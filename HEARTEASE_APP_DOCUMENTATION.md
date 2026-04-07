# 💜 HeartEase - Emotional Support Mobile App

## 🎯 Complete App Documentation

HeartEase is a comprehensive emotional support mobile application that connects users with trained listeners for real-time chat and voice call sessions. Built with React Native (Expo), FastAPI, MongoDB, and powered by AI (GPT-5.2) for mood tracking and personalized affirmations.

---

## 📱 **App Overview**

### **Core Purpose**
Connect people dealing with stress, heartbreak, loneliness, and family issues with compassionate listeners through secure, private conversations.

### **Key Features**
- 🔐 **JWT Authentication** - Secure user & agent accounts
- 💬 **Real-time Chat** - Socket.IO powered messaging with typing indicators
- 📞 **Voice Calls** - WebRTC peer-to-peer voice communication
- 🤖 **AI Mood Tracking** - GPT-5.2 powered emotional analysis & affirmations
- 💳 **Mock Payments** - UPI payment simulation (ready for Razorpay integration)
- 🎨 **Beautiful UI** - Calming purple/blue gradient design
- 🔒 **Privacy & Safety** - Report system, anonymous mode, encrypted sessions

---

## 🏗️ **Technical Architecture**

### **Tech Stack**

**Frontend:**
- React Native (Expo) - Cross-platform mobile framework
- Expo Router - File-based routing
- TypeScript - Type-safe code
- Zustand - State management
- Socket.IO Client - Real-time communication
- React Native WebRTC - Peer-to-peer calls
- Expo Linear Gradient - Beautiful UI gradients
- Axios - HTTP client

**Backend:**
- FastAPI - High-performance Python API
- MongoDB - NoSQL database
- Socket.IO - Real-time WebSocket server
- JWT (python-jose) - Authentication tokens
- Bcrypt - Password hashing
- Emergent Integrations - LLM integration (GPT-5.2)
- Python-SocketIO - WebSocket handling

---

## 🎨 **App Screens & Flow**

### **1. Welcome & Authentication**
- **Splash Screen** - HeartEase branding with gradient
- **Login Screen** - Email/password authentication
- **Register Screen** - User details, role selection (User/Agent), gender preferences

### **2. User Flows**

**Home Screen:**
- Daily AI-generated affirmation
- SOS quick connect button
- Gender-based listener selection (Male/Female)
- Available agents list with ratings
- Quick access to Chat or Call

**Mood Tracker:**
- 1-10 mood scale with emojis
- Optional notes
- AI-powered personalized affirmation (GPT-5.2)
- Mood history visualization

**Chat Session:**
- Real-time messaging
- Typing indicators
- Timer display (5 min free, then ₹50/20min)
- Message history
- Payment prompt after free time

**Voice Call:**
- Clean call interface
- Timer display (10 min free, then ₹100/20min)
- Mute/unmute control
- Speaker/earpiece toggle
- End call button

**Payment:**
- Session details (type, duration, amount)
- Mock UPI payment gateway
- Secure payment confirmation
- Instant session continuation

**Profile:**
- User information
- Session history
- Settings
- Logout

### **3. Agent Flows**

**Agent Dashboard:**
- Availability toggle (online/offline)
- Earnings statistics (today, total)
- Total sessions count
- Rating display
- Pending session requests
- Accept/Reject incoming sessions

---

## 🔧 **Backend API Endpoints**

### **Base URL**
```
https://emotional-support-25.preview.emergentagent.com/api
```

### **Authentication**

#### Register User/Agent
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepass",
  "name": "John Doe",
  "phone": "+1234567890",
  "gender": "male",
  "role": "user",  // "user" or "agent"
  "gender_preference": "female"  // For users only
}

Response: {
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": { ... }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepass"
}

Response: {
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": { ... }
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer {token}

Response: {
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  ...
}
```

#### Update Profile
```http
PUT /api/auth/profile?name=NewName&phone=+1234567890
Authorization: Bearer {token}

Response: { updated user object }
```

---

### **Agent Management**

#### Get Available Agents
```http
GET /api/agents/available?gender=female
Authorization: Bearer {token}

Response: [
  {
    "id": "uuid",
    "name": "Agent Name",
    "gender": "female",
    "bio": "...",
    "rating": 4.8,
    "total_sessions": 50
  }
]
```

#### Toggle Availability (Agent Only)
```http
PUT /api/agents/toggle-availability
Authorization: Bearer {agent_token}

Response: {
  "is_available": true
}
```

#### Get Agent Dashboard (Agent Only)
```http
GET /api/agents/dashboard
Authorization: Bearer {agent_token}

Response: {
  "is_available": true,
  "rating": 4.9,
  "total_sessions": 100,
  "total_earnings": 5000,
  "today_earnings": 250,
  "pending_requests": [...]
}
```

---

### **Session Management**

#### Start Session
```http
POST /api/sessions/start
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "agent_id": "agent_uuid",
  "session_type": "chat"  // or "call"
}

Response: {
  "_id": "session_uuid",
  "room_id": "room_uuid",
  "status": "pending",
  ...
}
```

#### Accept Session (Agent Only)
```http
PUT /api/sessions/accept/{session_id}
Authorization: Bearer {agent_token}

Response: {
  "message": "Session accepted"
}
```

#### Reject Session (Agent Only)
```http
PUT /api/sessions/reject/{session_id}
Authorization: Bearer {agent_token}

Response: {
  "message": "Session rejected"
}
```

#### End Session
```http
PUT /api/sessions/end/{session_id}?duration=600&amount=100
Authorization: Bearer {token}

Response: {
  "message": "Session ended successfully"
}
```

#### Get Active Session
```http
GET /api/sessions/active
Authorization: Bearer {token}

Response: {
  "_id": "session_uuid",
  "type": "chat",
  "status": "active",
  "user_name": "...",
  "agent_name": "...",
  ...
}
```

#### Get Session History
```http
GET /api/sessions/history
Authorization: Bearer {token}

Response: [
  {
    "_id": "session_uuid",
    "type": "chat",
    "duration": 600,
    "amount": 50,
    ...
  }
]
```

---

### **AI-Powered Mood Tracking**

#### Mood Check-in (AI-Generated Affirmation)
```http
POST /api/mood/checkin
Authorization: Bearer {token}
Content-Type: application/json

{
  "mood_score": 7,
  "note": "Feeling hopeful today"
}

Response: {
  "_id": "mood_uuid",
  "mood_score": 7,
  "note": "Feeling hopeful today",
  "affirmation": "Your hope is a powerful force. Continue nurturing this positive energy...",
  "timestamp": "2026-04-07T16:30:00Z"
}
```

#### Get Mood History
```http
GET /api/mood/history
Authorization: Bearer {token}

Response: [
  {
    "_id": "mood_uuid",
    "mood_score": 7,
    "affirmation": "...",
    "timestamp": "..."
  }
]
```

#### Get Daily Affirmation (AI-Generated)
```http
GET /api/affirmations/daily
Authorization: Bearer {token}

Response: {
  "affirmation": "Today is full of possibilities. You have the strength to overcome any challenge...",
  "date": "2026-04-07T16:30:00Z"
}
```

---

### **Payment System**

#### Initiate Payment
```http
POST /api/payments/initiate
Authorization: Bearer {token}
Content-Type: application/json

{
  "session_id": "session_uuid",
  "amount": 50
}

Response: {
  "_id": "payment_uuid",
  "transaction_id": "UPI1234567890",
  "status": "pending",
  ...
}
```

#### Verify Payment
```http
POST /api/payments/verify/{payment_id}
Authorization: Bearer {token}

Response: {
  "message": "Payment verified successfully",
  "status": "completed"
}
```

---

### **Safety & Reporting**

#### Create Report
```http
POST /api/reports/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "reported_id": "user_uuid",
  "reason": "inappropriate_behavior",
  "details": "Description of the issue",
  "session_id": "session_uuid"
}

Response: {
  "message": "Report submitted successfully"
}
```

---

### **Real-Time Communication**

#### Socket.IO Chat
```javascript
// Connect to Socket.IO
const socket = io('https://emotional-support-25.preview.emergentagent.com', {
  path: '/api/socket.io'
});

// Join session
socket.emit('join_session', {
  session_id: 'session_uuid',
  user_id: 'user_uuid'
});

// Send message
socket.emit('send_message', {
  session_id: 'session_uuid',
  sender_id: 'user_uuid',
  content: 'Hello!'
});

// Receive messages
socket.on('new_message', (message) => {
  console.log(message);
});

// Typing indicator
socket.emit('typing', {
  session_id: 'session_uuid',
  user_id: 'user_uuid'
});

socket.on('user_typing', (data) => {
  console.log(`${data.user_id} is typing...`);
});
```

#### WebRTC Signaling
```javascript
// Connect to WebRTC signaling
const ws = new WebSocket('wss://emotional-support-25.preview.emergentagent.com/ws/call/session_uuid/user_uuid');

// Send offer
ws.send(JSON.stringify({
  type: 'OFFER',
  target: 'target_user_id',
  offer: rtcOffer
}));

// Receive messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle offer, answer, ice_candidate, peer_joined, peer_left
};
```

---

## 💾 **Database Schema**

### **Collections**

#### users
```javascript
{
  _id: "uuid",
  email: "user@example.com",
  password: "hashed_password",
  name: "John Doe",
  phone: "+1234567890",
  gender: "male",
  role: "user",  // "user" or "agent"
  gender_preference: "female",
  avatar: "base64_string",  // optional
  created_at: ISODate,
  mood_history: [
    { score: 7, date: "2026-04-07T00:00:00Z" }
  ]
}
```

#### agents
```javascript
{
  _id: "uuid",
  user_id: "user_uuid",
  specialties: ["Emotional Support", "Active Listening"],
  bio: "Description",
  rating: 4.8,
  total_sessions: 50,
  total_earnings: 2500.0,
  is_available: true
}
```

#### sessions
```javascript
{
  _id: "uuid",
  user_id: "user_uuid",
  agent_id: "agent_uuid",
  type: "chat",  // or "call"
  status: "active",  // "pending", "active", "completed", "cancelled"
  room_id: "room_uuid",
  start_time: ISODate,
  end_time: ISODate,
  duration: 600,  // seconds
  free_duration_used: 300,
  amount: 50.0,
  created_at: ISODate
}
```

#### messages
```javascript
{
  _id: "uuid",
  session_id: "session_uuid",
  sender_id: "user_uuid",
  content: "Message text",
  timestamp: ISODate,
  read: false,
  type: "text"  // or "system"
}
```

#### mood_entries
```javascript
{
  _id: "uuid",
  user_id: "user_uuid",
  mood_score: 7,
  note: "Feeling hopeful",
  affirmation: "AI-generated affirmation",
  timestamp: ISODate
}
```

#### payments
```javascript
{
  _id: "uuid",
  session_id: "session_uuid",
  user_id: "user_uuid",
  amount: 50.0,
  status: "completed",  // "pending", "completed", "failed"
  method: "upi",
  transaction_id: "UPI1234567890",
  timestamp: ISODate
}
```

#### reports
```javascript
{
  _id: "uuid",
  reporter_id: "user_uuid",
  reported_id: "user_uuid",
  reason: "inappropriate_behavior",
  details: "Description",
  session_id: "session_uuid",
  status: "pending",
  timestamp: ISODate
}
```

---

## 🚀 **How to Use the App**

### **For Users (Seeking Support)**

1. **Register/Login**
   - Open app → Register with email
   - Choose "Seek Support" role
   - Select gender preference

2. **Find a Listener**
   - Browse available agents on home screen
   - Filter by gender (Male/Female)
   - View agent ratings and experience

3. **Start a Session**
   - Tap Chat 💬 or Call 📞 button
   - Session starts with free time (5 min chat / 10 min call)
   - Continue with payment after free time

4. **Track Your Mood**
   - Go to Mood tab
   - Rate your mood (1-10)
   - Get AI-generated affirmation
   - View mood history

5. **Manage Profile**
   - View session history
   - Update personal info
   - Access settings

### **For Agents (Listeners)**

1. **Register/Login**
   - Open app → Register with email
   - Choose "Be a Listener" role

2. **Manage Availability**
   - Go to Dashboard tab
   - Toggle availability (Online/Offline)
   - View earnings and stats

3. **Handle Requests**
   - Receive pending session requests
   - Accept or Reject
   - Start helping users

4. **Track Earnings**
   - View today's earnings
   - Check total earnings
   - Monitor session count
   - See your rating

---

## 🔒 **Security & Privacy**

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - Bcrypt encryption
- **HTTPS/WSS** - Encrypted communication
- **Anonymous Mode** - Optional identity protection
- **Report System** - Safety enforcement
- **No Contact Sharing** - Platform-controlled communication

---

## 💰 **Pricing Model**

### **For Users:**
- **Chat:** First 5 minutes FREE, then ₹50 for 20 minutes
- **Call:** First 10 minutes FREE, then ₹100 for 20 minutes

### **Payment Methods:**
- UPI (currently mocked, ready for Razorpay)
- Cards (future integration)
- Wallets (future integration)

---

## 🧪 **Testing**

### **Backend Test Results**
✅ 21/21 tests passed (100% success rate)

**Tested:**
- JWT Authentication
- User Profile Management
- Agent Management
- Session Lifecycle
- AI Mood Tracking (GPT-5.2)
- Daily Affirmations
- Mock Payments
- Safety Reporting

### **Test Credentials**
See `/app/memory/test_credentials.md`

---

## 🔮 **Future Enhancements**

1. **Production Payment Integration**
   - Razorpay UPI integration
   - Automatic refunds
   - Payment history export

2. **Enhanced Features**
   - Video calls
   - Group support sessions
   - Scheduled sessions
   - Agent specializations filter
   - In-app resources library

3. **AI Improvements**
   - Crisis detection
   - Sentiment analysis during chat
   - Personalized coping strategies
   - Therapy session summaries

4. **Platform Expansion**
   - iOS TestFlight
   - Google Play Store
   - Web app version

---

## 📞 **Support**

For technical support or questions:
- Check API documentation above
- Review test results in `/app/test_result.md`
- Test credentials in `/app/memory/test_credentials.md`

---

## 🎉 **Credits**

**Built with AI Creativity:**
- Backend: FastAPI + MongoDB + Socket.IO + WebRTC
- Frontend: React Native (Expo) + Beautiful UI
- AI: GPT-5.2 for mood tracking & affirmations
- Real-time: Socket.IO + WebRTC

**Design Philosophy:**
Calming, supportive, accessible emotional wellness platform with privacy and safety as top priorities.

---

*HeartEase - Because no one should feel alone.* 💜
