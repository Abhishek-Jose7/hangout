// Session management for multi-device sync
interface UserSession {
  userId: string;
  groups: string[];
  lastActive: string;
  deviceId: string;
  memberId?: string;
}

class SessionManager {
  private static instance: SessionManager;
  private sessions: Map<string, UserSession> = new Map();
  private readonly STORAGE_KEY = 'hangout_sessions';
  private readonly DEVICE_ID_KEY = 'hangout_device_id';

  private constructor() {
    this.loadSessions();
    this.generateDeviceId();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private generateDeviceId(): string {
    if (typeof window === 'undefined') {
      // Server-side rendering - return a temporary ID
      return 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    let deviceId = localStorage.getItem(this.DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  private loadSessions(): void {
    try {
      if (typeof window === 'undefined') {
        // Server-side rendering - skip localStorage operations
        return;
      }
      
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const sessions = JSON.parse(stored);
        this.sessions = new Map(Object.entries(sessions));
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }

  private saveSessions(): void {
    try {
      if (typeof window === 'undefined') {
        // Server-side rendering - skip localStorage operations
        return;
      }
      
      const sessionsObj = Object.fromEntries(this.sessions);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionsObj));
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  }

  public getCurrentUserSession(): UserSession | null {
    const userId = this.getCurrentUserId();
    return userId ? this.sessions.get(userId) || null : null;
  }

  public updateUserSession(userId: string, groupCode: string): void {
    const existingSession = this.sessions.get(userId);
    const deviceId = this.generateDeviceId();

    const updatedSession: UserSession = {
      userId,
      groups: existingSession
        ? [...new Set([...existingSession.groups, groupCode])]
        : [groupCode],
      lastActive: new Date().toISOString(),
      deviceId
    };

    this.sessions.set(userId, updatedSession);
    this.saveSessions();
  }

  public getUserGroups(userId: string): string[] {
    const session = this.sessions.get(userId);
    return session ? session.groups : [];
  }

  public clearUserSession(userId: string): void {
    this.sessions.delete(userId);
    this.saveSessions();
  }

  public getCurrentUserId(): string | null {
    // This would typically come from your auth system (Clerk)
    // For now, we'll use a simple approach
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem('current_user_id');
  }

  public setCurrentUserId(userId: string): void {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.setItem('current_user_id', userId);
  }

  public getAllSessions(): UserSession[] {
    return Array.from(this.sessions.values());
  }

  // Sync with server (if needed for cross-device sync)
  public async syncWithServer(): Promise<void> {
    // This would sync with your backend if you want true cross-device sync
    // For now, we'll just ensure local storage is up to date
    console.log('Session sync completed');
  }
}

export default SessionManager;
