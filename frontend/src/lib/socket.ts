import { io, Socket } from 'socket.io-client';
import { api } from './api';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

class SocketService {
    private socket: Socket | null = null;
    
    public connect() {
        const token = api.getToken() || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
        if (!this.socket) {
            this.socket = io(WS_URL, {
                auth: { token }
            });
        } else if (this.socket.disconnected) {
            this.socket.auth = { token };
            this.socket.connect();
        }
        return this.socket;
    }
    
    public disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
    
    public get instance() {
        return this.socket;
    }
}

export const socketService = new SocketService();
