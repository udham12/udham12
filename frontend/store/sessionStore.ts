import { create } from 'zustand';

interface Session {
  _id: string;
  user_id: string;
  agent_id: string;
  type: 'call' | 'chat';
  status: string;
  room_id: string;
  start_time?: string;
  duration: number;
  amount: number;
  user_name?: string;
  user_avatar?: string;
  agent_name?: string;
  agent_avatar?: string;
}

interface SessionState {
  activeSession: Session | null;
  timer: number;
  isPaused: boolean;
  needsPayment: boolean;
  setActiveSession: (session: Session | null) => void;
  incrementTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setNeedsPayment: (needs: boolean) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  activeSession: null,
  timer: 0,
  isPaused: false,
  needsPayment: false,
  
  setActiveSession: (session) => set({ activeSession: session }),
  
  incrementTimer: () => set((state) => {
    if (state.isPaused) return state;
    const newTimer = state.timer + 1;
    
    // Check if free time expired
    const freeLimit = state.activeSession?.type === 'chat' ? 300 : 600; // 5 min for chat, 10 for call
    
    if (newTimer >= freeLimit && !state.needsPayment) {
      return { timer: newTimer, needsPayment: true, isPaused: true };
    }
    
    return { timer: newTimer };
  }),
  
  pauseTimer: () => set({ isPaused: true }),
  resetTimer: () => set({ timer: 0, isPaused: false, needsPayment: false }),
  setNeedsPayment: (needs) => set({ needsPayment: needs, isPaused: needs })
}));