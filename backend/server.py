from fastapi import FastAPI, APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import socketio
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configuration
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "heartease-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY", "")

# MongoDB connection
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Socket.IO setup for real-time chat
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
fastapi_app = FastAPI(title="HeartEase API")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Active WebRTC signaling connections
webrtc_connections: Dict[str, WebSocket] = {}

# ===========================
# MODELS
# ===========================

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None
    gender: str  # male/female/other
    role: str = "user"  # user/agent
    gender_preference: Optional[str] = None  # For users seeking support

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    phone: Optional[str]
    gender: str
    role: str
    gender_preference: Optional[str]
    avatar: Optional[str]
    created_at: datetime

class AgentProfile(BaseModel):
    specialties: List[str] = []
    bio: Optional[str] = ""
    rating: float = 5.0
    total_sessions: int = 0
    total_earnings: float = 0.0
    is_available: bool = False

class SessionCreate(BaseModel):
    agent_id: str
    session_type: str  # call/chat

class SessionUpdate(BaseModel):
    status: str  # pending/active/completed/cancelled

class Message(BaseModel):
    session_id: str
    content: str
    
class MoodEntry(BaseModel):
    mood_score: int  # 1-10
    note: Optional[str] = ""

class PaymentCreate(BaseModel):
    session_id: str
    amount: float

class ReportCreate(BaseModel):
    reported_id: str
    reason: str
    details: Optional[str] = ""
    session_id: Optional[str] = None

# ===========================
# HELPER FUNCTIONS
# ===========================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await db.users.find_one({"_id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

def serialize_user(user: dict) -> dict:
    """Convert MongoDB user document to serializable dict"""
    user_copy = user.copy()
    user_copy['id'] = str(user_copy.pop('_id'))
    user_copy.pop('password', None)
    return user_copy

# ===========================
# SOCKET.IO EVENTS (Chat)
# ===========================

@sio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    logger.info(f"Client disconnected: {sid}")

@sio.event
async def join_session(sid, data):
    session_id = data.get("session_id")
    user_id = data.get("user_id")
    
    if not session_id:
        return
    
    await sio.enter_room(sid, session_id)
    logger.info(f"User {user_id} joined session {session_id}")
    
    # Notify others in the session
    await sio.emit('user_joined', {
        'user_id': user_id,
        'timestamp': datetime.utcnow().isoformat()
    }, room=session_id, skip_sid=sid)

@sio.event
async def send_message(sid, data):
    session_id = data.get("session_id")
    sender_id = data.get("sender_id")
    content = data.get("content")
    
    # Save message to database
    message_doc = {
        "_id": str(uuid.uuid4()),
        "session_id": session_id,
        "sender_id": sender_id,
        "content": content,
        "timestamp": datetime.utcnow(),
        "read": False,
        "type": "text"
    }
    
    await db.messages.insert_one(message_doc)
    
    # Broadcast to session room
    message_copy = message_doc.copy()
    message_copy['_id'] = str(message_copy['_id'])
    message_copy['timestamp'] = message_copy['timestamp'].isoformat()
    
    await sio.emit('new_message', message_copy, room=session_id)

@sio.event
async def typing(sid, data):
    session_id = data.get("session_id")
    user_id = data.get("user_id")
    
    await sio.emit('user_typing', {
        'user_id': user_id,
        'timestamp': datetime.utcnow().isoformat()
    }, room=session_id, skip_sid=sid)

@sio.event
async def leave_session(sid, data):
    session_id = data.get("session_id")
    await sio.leave_room(sid, session_id)

# ===========================
# AUTH ENDPOINTS
# ===========================

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(user_data.password)
    
    user_doc = {
        "_id": user_id,
        "email": user_data.email,
        "password": hashed_password,
        "name": user_data.name,
        "phone": user_data.phone,
        "gender": user_data.gender,
        "role": user_data.role,
        "gender_preference": user_data.gender_preference,
        "avatar": None,
        "created_at": datetime.utcnow(),
        "mood_history": []
    }
    
    await db.users.insert_one(user_doc)
    
    # If agent, create agent profile
    if user_data.role == "agent":
        agent_doc = {
            "_id": str(uuid.uuid4()),
            "user_id": user_id,
            "specialties": ["Emotional Support", "Active Listening"],
            "bio": "I'm here to listen and support you through difficult times.",
            "rating": 5.0,
            "total_sessions": 0,
            "total_earnings": 0.0,
            "is_available": False
        }
        await db.agents.insert_one(agent_doc)
    
    # Create access token
    access_token = create_access_token({"sub": user_id})
    
    user_response = serialize_user(user_doc)
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token({"sub": user['_id']})
    
    user_response = serialize_user(user)
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@api_router.get("/auth/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    return serialize_user(current_user)

@api_router.put("/auth/profile")
async def update_profile(
    name: Optional[str] = None,
    phone: Optional[str] = None,
    avatar: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    update_data = {}
    if name:
        update_data["name"] = name
    if phone:
        update_data["phone"] = phone
    if avatar:
        update_data["avatar"] = avatar
    
    if update_data:
        await db.users.update_one(
            {"_id": current_user['_id']},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"_id": current_user['_id']})
    return serialize_user(updated_user)

# ===========================
# AGENT ENDPOINTS
# ===========================

@api_router.get("/agents/available")
async def get_available_agents(gender: Optional[str] = None):
    query = {"is_available": True}
    
    # Get all available agents
    agents = await db.agents.find(query).to_list(100)
    
    # Enrich with user data
    enriched_agents = []
    for agent in agents:
        user = await db.users.find_one({"_id": agent['user_id']})
        if user:
            # Filter by gender if specified
            if gender and user.get('gender') != gender:
                continue
            
            enriched_agent = {
                "id": agent['_id'],
                "user_id": agent['user_id'],
                "name": user['name'],
                "gender": user['gender'],
                "avatar": user.get('avatar'),
                "bio": agent.get('bio', ''),
                "specialties": agent.get('specialties', []),
                "rating": agent.get('rating', 5.0),
                "total_sessions": agent.get('total_sessions', 0)
            }
            enriched_agents.append(enriched_agent)
    
    return enriched_agents

@api_router.put("/agents/toggle-availability")
async def toggle_availability(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'agent':
        raise HTTPException(status_code=403, detail="Only agents can toggle availability")
    
    agent = await db.agents.find_one({"user_id": current_user['_id']})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent profile not found")
    
    new_status = not agent['is_available']
    
    await db.agents.update_one(
        {"user_id": current_user['_id']},
        {"$set": {"is_available": new_status}}
    )
    
    return {"is_available": new_status}

@api_router.get("/agents/dashboard")
async def get_agent_dashboard(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'agent':
        raise HTTPException(status_code=403, detail="Only agents can access dashboard")
    
    agent = await db.agents.find_one({"user_id": current_user['_id']})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent profile not found")
    
    # Get pending sessions
    pending_sessions = await db.sessions.find({
        "agent_id": current_user['_id'],
        "status": "pending"
    }).to_list(10)
    
    # Enrich pending sessions with user data
    for session in pending_sessions:
        user = await db.users.find_one({"_id": session['user_id']})
        if user:
            session['user_name'] = user['name']
            session['user_avatar'] = user.get('avatar')
    
    # Get today's earnings
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_sessions = await db.sessions.find({
        "agent_id": current_user['_id'],
        "status": "completed",
        "end_time": {"$gte": today_start}
    }).to_list(100)
    
    today_earnings = sum(session.get('amount', 0) for session in today_sessions)
    
    return {
        "is_available": agent['is_available'],
        "rating": agent['rating'],
        "total_sessions": agent['total_sessions'],
        "total_earnings": agent['total_earnings'],
        "today_earnings": today_earnings,
        "pending_requests": pending_sessions
    }

# ===========================
# SESSION ENDPOINTS
# ===========================

@api_router.post("/sessions/start")
async def start_session(session_data: SessionCreate, current_user: dict = Depends(get_current_user)):
    # Create session
    session_id = str(uuid.uuid4())
    room_id = str(uuid.uuid4())
    
    session_doc = {
        "_id": session_id,
        "user_id": current_user['_id'],
        "agent_id": session_data.agent_id,
        "type": session_data.session_type,
        "status": "pending",
        "room_id": room_id,
        "start_time": datetime.utcnow(),
        "end_time": None,
        "duration": 0,
        "free_duration_used": 0,
        "amount": 0.0,
        "created_at": datetime.utcnow()
    }
    
    await db.sessions.insert_one(session_doc)
    
    session_copy = session_doc.copy()
    session_copy['_id'] = str(session_copy['_id'])
    session_copy['start_time'] = session_copy['start_time'].isoformat()
    session_copy['created_at'] = session_copy['created_at'].isoformat()
    
    return session_copy

@api_router.put("/sessions/accept/{session_id}")
async def accept_session(session_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'agent':
        raise HTTPException(status_code=403, detail="Only agents can accept sessions")
    
    session = await db.sessions.find_one({"_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session['agent_id'] != current_user['_id']:
        raise HTTPException(status_code=403, detail="Not authorized to accept this session")
    
    await db.sessions.update_one(
        {"_id": session_id},
        {"$set": {"status": "active", "start_time": datetime.utcnow()}}
    )
    
    return {"message": "Session accepted"}

@api_router.put("/sessions/reject/{session_id}")
async def reject_session(session_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'agent':
        raise HTTPException(status_code=403, detail="Only agents can reject sessions")
    
    session = await db.sessions.find_one({"_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session['agent_id'] != current_user['_id']:
        raise HTTPException(status_code=403, detail="Not authorized to reject this session")
    
    await db.sessions.update_one(
        {"_id": session_id},
        {"$set": {"status": "cancelled"}}
    )
    
    return {"message": "Session rejected"}

@api_router.put("/sessions/end/{session_id}")
async def end_session(
    session_id: str,
    duration: int,
    amount: float,
    current_user: dict = Depends(get_current_user)
):
    session = await db.sessions.find_one({"_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Only user or agent can end their session
    if session['user_id'] != current_user['_id'] and session['agent_id'] != current_user['_id']:
        raise HTTPException(status_code=403, detail="Not authorized to end this session")
    
    await db.sessions.update_one(
        {"_id": session_id},
        {
            "$set": {
                "status": "completed",
                "end_time": datetime.utcnow(),
                "duration": duration,
                "amount": amount
            }
        }
    )
    
    # Update agent stats
    if amount > 0:
        await db.agents.update_one(
            {"user_id": session['agent_id']},
            {
                "$inc": {
                    "total_sessions": 1,
                    "total_earnings": amount
                }
            }
        )
    
    return {"message": "Session ended successfully"}

@api_router.get("/sessions/active")
async def get_active_session(current_user: dict = Depends(get_current_user)):
    query = {
        "$or": [
            {"user_id": current_user['_id']},
            {"agent_id": current_user['_id']}
        ],
        "status": {"$in": ["pending", "active"]}
    }
    
    session = await db.sessions.find_one(query)
    
    if not session:
        return None
    
    # Enrich with user and agent data
    user = await db.users.find_one({"_id": session['user_id']})
    agent = await db.users.find_one({"_id": session['agent_id']})
    
    session_copy = session.copy()
    session_copy['_id'] = str(session_copy['_id'])
    session_copy['start_time'] = session_copy['start_time'].isoformat() if session_copy.get('start_time') else None
    session_copy['end_time'] = session_copy['end_time'].isoformat() if session_copy.get('end_time') else None
    session_copy['created_at'] = session_copy['created_at'].isoformat()
    
    if user:
        session_copy['user_name'] = user['name']
        session_copy['user_avatar'] = user.get('avatar')
    
    if agent:
        session_copy['agent_name'] = agent['name']
        session_copy['agent_avatar'] = agent.get('avatar')
    
    return session_copy

@api_router.get("/sessions/history")
async def get_session_history(current_user: dict = Depends(get_current_user)):
    query = {
        "$or": [
            {"user_id": current_user['_id']},
            {"agent_id": current_user['_id']}
        ],
        "status": "completed"
    }
    
    sessions = await db.sessions.find(query).sort("created_at", -1).limit(50).to_list(50)
    
    # Enrich sessions
    for session in sessions:
        user = await db.users.find_one({"_id": session['user_id']})
        agent = await db.users.find_one({"_id": session['agent_id']})
        
        session['_id'] = str(session['_id'])
        session['start_time'] = session['start_time'].isoformat() if session.get('start_time') else None
        session['end_time'] = session['end_time'].isoformat() if session.get('end_time') else None
        session['created_at'] = session['created_at'].isoformat()
        
        if user:
            session['user_name'] = user['name']
        if agent:
            session['agent_name'] = agent['name']
    
    return sessions

@api_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str, current_user: dict = Depends(get_current_user)):
    # Verify user has access to this session
    session = await db.sessions.find_one({"_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session['user_id'] != current_user['_id'] and session['agent_id'] != current_user['_id']:
        raise HTTPException(status_code=403, detail="Not authorized to view this chat")
    
    messages = await db.messages.find({"session_id": session_id}).sort("timestamp", 1).to_list(1000)
    
    for msg in messages:
        msg['_id'] = str(msg['_id'])
        msg['timestamp'] = msg['timestamp'].isoformat()
    
    return messages

# ===========================
# AI-POWERED MOOD TRACKING
# ===========================

@api_router.post("/mood/checkin")
async def mood_checkin(mood_data: MoodEntry, current_user: dict = Depends(get_current_user)):
    # Generate AI affirmation based on mood
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"mood_{current_user['_id']}",
            system_message="You are a compassionate emotional support AI. Generate a short, personalized, uplifting affirmation (1-2 sentences) based on the user's mood. Be empathetic and encouraging."
        ).with_model("openai", "gpt-5.2")
        
        mood_text = f"User mood score: {mood_data.mood_score}/10. User note: {mood_data.note}"
        user_message = UserMessage(text=mood_text)
        
        affirmation = await chat.send_message(user_message)
    except Exception as e:
        logger.error(f"Error generating affirmation: {e}")
        affirmation = "You are doing great! Every day is a new opportunity for growth and healing."
    
    # Save mood entry
    mood_entry = {
        "_id": str(uuid.uuid4()),
        "user_id": current_user['_id'],
        "mood_score": mood_data.mood_score,
        "note": mood_data.note,
        "affirmation": affirmation,
        "timestamp": datetime.utcnow()
    }
    
    await db.mood_entries.insert_one(mood_entry)
    
    # Update user's mood history
    await db.users.update_one(
        {"_id": current_user['_id']},
        {"$push": {"mood_history": {
            "score": mood_data.mood_score,
            "date": datetime.utcnow().isoformat()
        }}}
    )
    
    mood_copy = mood_entry.copy()
    mood_copy['_id'] = str(mood_copy['_id'])
    mood_copy['timestamp'] = mood_copy['timestamp'].isoformat()
    
    return mood_copy

@api_router.get("/mood/history")
async def get_mood_history(current_user: dict = Depends(get_current_user)):
    moods = await db.mood_entries.find({"user_id": current_user['_id']}).sort("timestamp", -1).limit(30).to_list(30)
    
    for mood in moods:
        mood['_id'] = str(mood['_id'])
        mood['timestamp'] = mood['timestamp'].isoformat()
    
    return moods

@api_router.get("/affirmations/daily")
async def get_daily_affirmation(current_user: dict = Depends(get_current_user)):
    # Get user's recent mood history
    recent_moods = await db.mood_entries.find({"user_id": current_user['_id']}).sort("timestamp", -1).limit(5).to_list(5)
    
    avg_mood = 7  # Default
    if recent_moods:
        avg_mood = sum(m['mood_score'] for m in recent_moods) / len(recent_moods)
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"daily_{current_user['_id']}",
            system_message="You are a compassionate wellness coach. Generate a beautiful, personalized daily affirmation (2-3 sentences) that uplifts and motivates. Make it specific and actionable."
        ).with_model("openai", "gpt-5.2")
        
        prompt = f"Generate a daily affirmation for someone with recent average mood of {avg_mood:.1f}/10. Make it positive and empowering."
        user_message = UserMessage(text=prompt)
        
        affirmation = await chat.send_message(user_message)
    except Exception as e:
        logger.error(f"Error generating daily affirmation: {e}")
        affirmation = "Today is full of possibilities. You have the strength to overcome any challenge and the courage to embrace joy."
    
    return {"affirmation": affirmation, "date": datetime.utcnow().isoformat()}

# ===========================
# PAYMENTS (MOCK)
# ===========================

@api_router.post("/payments/initiate")
async def initiate_payment(payment_data: PaymentCreate, current_user: dict = Depends(get_current_user)):
    # Mock payment - in production, integrate with Razorpay
    payment_id = str(uuid.uuid4())
    
    payment_doc = {
        "_id": payment_id,
        "session_id": payment_data.session_id,
        "user_id": current_user['_id'],
        "amount": payment_data.amount,
        "status": "pending",
        "method": "upi",
        "transaction_id": f"UPI{uuid.uuid4().hex[:10].upper()}",
        "timestamp": datetime.utcnow()
    }
    
    await db.payments.insert_one(payment_doc)
    
    payment_copy = payment_doc.copy()
    payment_copy['_id'] = str(payment_copy['_id'])
    payment_copy['timestamp'] = payment_copy['timestamp'].isoformat()
    
    return payment_copy

@api_router.post("/payments/verify/{payment_id}")
async def verify_payment(payment_id: str, current_user: dict = Depends(get_current_user)):
    # Mock verification - always succeeds
    await db.payments.update_one(
        {"_id": payment_id},
        {"$set": {"status": "completed"}}
    )
    
    return {"message": "Payment verified successfully", "status": "completed"}

# ===========================
# REPORTS & SAFETY
# ===========================

@api_router.post("/reports/create")
async def create_report(report_data: ReportCreate, current_user: dict = Depends(get_current_user)):
    report_doc = {
        "_id": str(uuid.uuid4()),
        "reporter_id": current_user['_id'],
        "reported_id": report_data.reported_id,
        "reason": report_data.reason,
        "details": report_data.details,
        "session_id": report_data.session_id,
        "status": "pending",
        "timestamp": datetime.utcnow()
    }
    
    await db.reports.insert_one(report_doc)
    
    return {"message": "Report submitted successfully"}

# ===========================
# WEBRTC SIGNALING
# ===========================

@fastapi_app.websocket("/ws/call/{session_id}/{user_id}")
async def webrtc_signaling(websocket: WebSocket, session_id: str, user_id: str):
    await websocket.accept()
    connection_key = f"{session_id}:{user_id}"
    webrtc_connections[connection_key] = websocket
    
    try:
        # Notify other participant
        for key, ws in webrtc_connections.items():
            if key.startswith(session_id) and key != connection_key:
                await ws.send_json({
                    "type": "peer_joined",
                    "user_id": user_id
                })
        
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")
            target_user = data.get("target")
            
            # Forward WebRTC signaling messages
            target_key = f"{session_id}:{target_user}"
            if target_key in webrtc_connections:
                await webrtc_connections[target_key].send_json(data)
    
    except WebSocketDisconnect:
        # Cleanup
        if connection_key in webrtc_connections:
            del webrtc_connections[connection_key]
        
        # Notify other participant
        for key, ws in list(webrtc_connections.items()):
            if key.startswith(session_id):
                try:
                    await ws.send_json({
                        "type": "peer_left",
                        "user_id": user_id
                    })
                except:
                    pass

# ===========================
# APP SETUP
# ===========================

# Include router
fastapi_app.include_router(api_router)

# CORS
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Wrap with Socket.IO
socket_app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app, socketio_path='/api/socket.io')
app = socket_app

@fastapi_app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
