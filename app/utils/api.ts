import { supabase } from "./auth";

export class APIClient {
  // 1. 토큰 관리 (호환성 유지)
  setAccessToken(token: string | null) {}

  // 2. Auth (회원가입)
  async signup(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    return { data };
  }

  // 3. Diaries (다이어리)
  async createDiary(elderlyCareRecipientName: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not found");

    const { data, error } = await supabase
      .from("diaries")
      .insert({
        elderly_care_recipient_name: elderlyCareRecipientName,
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return { data };
  }

  async getMyDiary() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null };

    const { data, error } = await supabase
      .from("diaries")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") console.error(error);
    return { data };
  }

  // 4. Diary Entries (일기)
  async addDiaryEntry(
    type: string,
    title: string,
    content: string,
    imageUrl?: string
  ) {
    const { data, error } = await supabase
      .from("diary_entries")
      .insert({ type, title, content, image_url: imageUrl })
      .select()
      .single();
    if (error) throw error;
    return { data };
  }

  async getDiaryEntries() {
    const { data, error } = await supabase
      .from("diary_entries")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { data };
  }

  async getDiaryEntryById(entryId: string) {
    const { data, error } = await supabase
      .from("diary_entries")
      .select("*")
      .eq("id", entryId)
      .single();
    if (error) throw error;
    return { data };
  }

  async deleteDiaryEntry(entryId: string) {
    const { error } = await supabase
      .from("diary_entries")
      .delete()
      .eq("id", entryId);
    if (error) throw error;
    return { success: true };
  }

  // 5. Schedules (일정 관리)
  async addSchedule(schedule: any) {
    const { data, error } = await supabase
      .from("schedules")
      .insert({
        title: schedule.title,
        date: schedule.date,
        time: schedule.time,
        location: schedule.location,
        notes: schedule.notes,
        category: schedule.category,
        reminder: schedule.reminder,
      })
      .select()
      .single();
    if (error) throw error;
    return { data };
  }

  async getSchedules() {
    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .order("date", { ascending: true });
    if (error) throw error;
    return { data };
  }

  async getScheduleById(scheduleId: string) {
    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .eq("id", scheduleId)
      .single();
    if (error) throw error;
    return { data };
  }

  async deleteSchedule(scheduleId: string) {
    const { error } = await supabase
      .from("schedules")
      .delete()
      .eq("id", scheduleId);
    if (error) throw error;
    return { success: true };
  }

  // 6. Community (커뮤니티)
  async addCommunityPost(title: string, content: string, category: string) {
    const { data, error } = await supabase
      .from("posts")
      .insert({ title, content, category })
      .select()
      .single();
    if (error) throw error;
    return { data };
  }

  async getCommunityPosts() {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { data };
  }

  async likePost(postId: string) {
    return { data: { success: true } };
  }

  // 7. Family Members (가족 & 초대)
  async getFamilyMembers() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !user.email) return { data: [] };

    // 1. 내가 초대를 보냈는데 상대가 수락한 경우
    const { data: sentInvites } = await supabase
      .from("invitations")
      .select("receiver_email")
      .eq("sender_email", user.email)
      .eq("status", "accepted");

    // 2. 내가 초대를 받았는데 내가 수락한 경우
    const { data: receivedInvites } = await supabase
      .from("invitations")
      .select("sender_email")
      .eq("receiver_email", user.email)
      .eq("status", "accepted");

    // 목록 합치기
    const familyEmails = [
      ...(sentInvites?.map((i) => i.receiver_email) || []),
      ...(receivedInvites?.map((i) => i.sender_email) || []),
    ];

    // 중복 제거
    const uniqueEmails = [...new Set(familyEmails)];

    // 화면에 보여줄 형태로 가공
    const members = uniqueEmails.map((email, index) => ({
      id: `member-${index}`,
      name: email, // 이름 정보가 따로 없어서 이메일로 표시
      email: email,
      role: "가족",
      joinedAt: new Date().toISOString(), // 가입일 정보가 없으면 현재 시간
    }));

    return { data: members };
  }

  async getInvitations() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !user.email) return { data: [] };

    const { data, error } = await supabase
      .from("invitations")
      .select("*")
      .eq("receiver_email", user.email) // 내 이메일로 온 것만
      .eq("status", "pending"); // 대기중인 것만

    if (error) {
      console.error("초대장 불러오기 실패:", error);
      return { data: [] };
    }
    return { data };
  }

  // ✨ [수정] 초대장 진짜로 보내기 (DB에 저장)
  async sendInvitation(email: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !user.email) throw new Error("로그인이 필요합니다");

    // DB에 저장
    const { error } = await supabase.from("invitations").insert({
      sender_email: user.email, // 보낸 사람
      receiver_email: email, // 받는 사람
    });

    if (error) throw error;
    return { success: true };
  }

  // (이름 호환용)
  async inviteMember(email: string) {
    return this.sendInvitation(email);
  }

  // ✨ [수정] 초대 수락하기
  async acceptInvite(invitationId: string) {
    // 상태를 'accepted'로 변경
    const { error } = await supabase
      .from("invitations")
      .update({ status: "accepted" })
      .eq("id", invitationId);

    if (error) throw error;
    return { success: true };
  }

  async acceptInvitation(invitationId: string) {
    return this.acceptInvite(invitationId);
  }

  async toggleScheduleComplete(id: string, isCompleted: boolean) {
    const { error } = await supabase
      .from("schedules")
      .update({ is_completed: isCompleted })
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  }

  // ✨ [추가] 일기/약 완료 체크/해제 (토글)
  async toggleDiaryComplete(id: string, isCompleted: boolean) {
    const { error } = await supabase
      .from("diary_entries")
      .update({ is_completed: isCompleted })
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  }
}

export const apiClient = new APIClient();
