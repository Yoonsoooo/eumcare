import { projectId, publicAnonKey } from "../supabase/info.tsx";

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-b2f39fc5`;

export class APIClient {
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      localStorage.setItem("access_token", token);
    } else {
      localStorage.removeItem("access_token");
    }
  }

  getAccessToken() {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem("access_token");
    }
    return this.accessToken;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getAccessToken();
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token || publicAnonKey}`,
      ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`API Error (${endpoint}):`, data.error);
      throw new Error(data.error || "API request failed");
    }

    return data;
  }

  // Auth
  async signup(email: string, password: string, name: string) {
    return this.request("/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
  }

  // Diaries
  async createDiary(elderlyCareRecipientName: string) {
    return this.request("/diaries", {
      method: "POST",
      body: JSON.stringify({ elderlyCareRecipientName }),
    });
  }

  async getMyDiary() {
    return this.request("/diaries/my");
  }

  // Diary Entries
  async addDiaryEntry(
    type: string,
    title: string,
    content: string,
    imageUrl?: string
  ) {
    return this.request("/diary-entries", {
      method: "POST",
      body: JSON.stringify({ type, title, content, imageUrl }),
    });
  }

  async getDiaryEntries() {
    return this.request("/diary-entries");
  }

  // Schedules
  async addSchedule(schedule: any) {
    return this.request("/schedules", {
      method: "POST",
      body: JSON.stringify(schedule),
    });
  }

  async getSchedules() {
    return this.request("/schedules");
  }

  // Community
  async addCommunityPost(title: string, content: string, category: string) {
    return this.request("/community/posts", {
      method: "POST",
      body: JSON.stringify({ title, content, category }),
    });
  }

  async getCommunityPosts() {
    return this.request("/community/posts");
  }

  async likePost(postId: string) {
    return this.request(`/community/posts/${postId}/like`, {
      method: "POST",
    });
  }

  // Family Members
  async getFamilyMembers() {
    return this.request("/family-members");
  }

  async inviteMember(email: string) {
    return this.request("/invite", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async acceptInvite(token: string) {
    return this.request(`/accept-invite/${token}`, {
      method: "POST",
    });
  }
}

export const apiClient = new APIClient();
