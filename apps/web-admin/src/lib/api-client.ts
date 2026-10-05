const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : 'http://localhost:5000/api/v1';

export class ApiClient {
  private static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('ff_token');
  }

  public static setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ff_token', token);
    }
  }

  public static clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ff_token');
      localStorage.removeItem('ff_user');
    }
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Network request failed');
      }

      return data as T;
    } catch (err: any) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  // Auth
  static async register(payload: any) {
    return this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  static async login(payload: any) {
    return this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  static async getProfile() {
    return this.request<any>('/auth/profile');
  }

  // Tournaments
  static async getTournaments(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<any>(`/tournaments${query}`);
  }

  static async getTournament(id: string) {
    return this.request<any>(`/tournaments/${id}`);
  }

  static async joinSlot(tournamentId: string, slotNumber: number, teamName?: string) {
    return this.request<any>(`/tournaments/${tournamentId}/join`, {
      method: 'POST',
      body: JSON.stringify({ slotNumber, teamName }),
    });
  }

  static async createTournament(payload: any) {
    return this.request<any>('/tournaments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Rooms
  static async getRoomCredentials(tournamentId: string) {
    return this.request<any>(`/rooms/${tournamentId}/credentials`);
  }

  static async updateRoomCredentials(tournamentId: string, payload: any) {
    return this.request<any>(`/rooms/${tournamentId}/credentials`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Wallet
  static async requestDeposit(payload: { method: string; amount: number; phone: string; trxId: string }) {
    return this.request<any>('/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  static async requestWithdrawal(payload: { method: string; amount: number; phone: string }) {
    return this.request<any>('/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  static async getWalletHistory() {
    return this.request<any>('/wallet/history');
  }

  // Admin Finance
  static async adminGetTransactions(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<any>(`/wallet/admin/list${query}`);
  }

  static async adminApproveTransaction(id: string) {
    return this.request<any>(`/wallet/admin/${id}/approve`, { method: 'POST' });
  }

  static async adminRejectTransaction(id: string, reason?: string) {
    return this.request<any>(`/wallet/admin/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Anti-Cheat & Security
  static async adminGetAntiCheatLogs() {
    return this.request<any>('/security/admin/logs');
  }

  static async adminBanPlayer(userId: string, reason: string) {
    return this.request<any>('/security/admin/ban', {
      method: 'POST',
      body: JSON.stringify({ userId, reason }),
    });
  }
}
