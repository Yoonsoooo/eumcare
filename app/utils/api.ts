import { supabase } from "./auth";

export class APIClient {
  // 1. 토큰 관리 로직 제거 (Supabase가 알아서 관리함)
  setAccessToken(token: string | null) {
    // Supabase는 자동 로그인 관리가 되므로 이 함수는 비워둬도 되지만,
    // 기존 코드와의 호환성을 위해 남겨둡니다.
  }

  // 2. Auth (회원가입)
  async signup(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
    if (error) throw error;
    return { data };
  }

  // 3. Diaries (다이어리)
  async createDiary(elderlyCareRecipientName: string) {
    // 현재 유저 확인
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
      .single(); // 하나만 가져오기

    // 다이어리가 없으면 null 반환 (에러 아님)
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
      .insert({
        type,
        title,
        content,
        image_url: imageUrl,
      })
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
    // user_id는 Supabase가 자동으로 처리하거나 RLS로 처리됨
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
        // author_name은 선택사항 (유저 메타데이터에서 가져오거나 생략 가능)
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
    // 좋아요 로직은 복잡할 수 있으므로, 일단 간단히 구현하거나 RPC 호출 필요
    // 여기서는 예시로 빈 응답만 보냅니다.
    return { data: { success: true } };
  }

  // 7. Family Members (가족)
  async getFamilyMembers() {
    // 가족 구성원 로직도 DB 구조에 따라 다릅니다.
    // 일단 빈 배열 반환하도록 처리
    return { data: [] };
  }

  async inviteMember(email: string) {
    return { data: { success: true } };
  }

  async acceptInvite(token: string) {
    return { data: { success: true } };
  }
}

export const apiClient = new APIClient();
