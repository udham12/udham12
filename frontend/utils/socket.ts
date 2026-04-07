import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

class SocketService {
  private socket: Socket | null = null;
  
  connect() {
    if (!this.socket) {
      this.socket = io(BACKEND_URL, {
        path: '/api/socket.io',
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      
      this.socket.on('connect', () => {
        console.log('Socket connected');
      });
      
      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    }
    
    return this.socket;
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  getSocket() {
    return this.socket;
  }
  
  joinSession(sessionId: string, userId: string) {
    this.socket?.emit('join_session', { session_id: sessionId, user_id: userId });
  }
  
  leaveSession(sessionId: string) {
    this.socket?.emit('leave_session', { session_id: sessionId });
  }
  
  sendMessage(sessionId: string, senderId: string, content: string) {
    this.socket?.emit('send_message', {
      session_id: sessionId,
      sender_id: senderId,
      content,
    });
  }
  
  sendTyping(sessionId: string, userId: string) {
    this.socket?.emit('typing', {
      session_id: sessionId,
      user_id: userId,
    });
  }
  
  onMessage(callback: (message: any) => void) {
    this.socket?.on('new_message', callback);
  }
  
  onUserJoined(callback: (data: any) => void) {
    this.socket?.on('user_joined', callback);
  }
  
  onUserTyping(callback: (data: any) => void) {
    this.socket?.on('user_typing', callback);
  }
  
  offMessage() {
    this.socket?.off('new_message');
  }
  
  offUserJoined() {
    this.socket?.off('user_joined');
  }
  
  offUserTyping() {
    this.socket?.off('user_typing');
  }
}

export const socketService = new SocketService();