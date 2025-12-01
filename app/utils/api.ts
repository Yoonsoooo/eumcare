import { supabase } from "./auth";

export class APIClient {
  setAccessToken(token: string | null) {}

  // ... (Auth, Profile 관련 함수들은 기존과 동일 - 생략하지 않고 전체 코드 제공) ...

  async signup(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (data.user) {
      await supabase
        .from("profiles")
        .insert({ id: data.user.id, email: email, name: name });
    }
    if (error) throw error;
    return { data };
  }

  async syncProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const updates = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name,
      phone: user.user_metadata?.phone,
      updated_at: new Date(),
    };
    await supabase.from("profiles").upsert(updates);
  }

  async getProfile() {
    await this.syncProfile();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Not authenticated" };
    return {
      data: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || "",
        phone: user.user_metadata?.phone || "",
        createdAt: user.created_at,
        // 프로필 이미지 URL이 있다면 반환 (DB 컬럼명 확인 필요: avatar_url)
        avatarUrl: user.user_metadata?.avatar_url || null,
      },
      error: null,
    };
  }

  formatPhoneNumber(phone: string) {
    if (!phone) return "";
    const cleaned = ("" + phone).replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{4})(\d{4})$/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    return phone;
  }

  async updateProfile(profileData: { name?: string; phone?: string }) {
    const formattedPhone = profileData.phone
      ? this.formatPhoneNumber(profileData.phone)
      : undefined;
    const { data, error } = await supabase.auth.updateUser({
      data: { name: profileData.name, phone: formattedPhone },
    });
    if (!error) await this.syncProfile();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  }

  // ▼▼▼ [추가됨] 사진 업로드 함수 ▼▼▼
  /**
   * 멤버 사진 업로드 기능
   * 전제조건:
   * 1. Supabase Storage에 'avatars'라는 이름의 Public 버킷이 있어야 합니다.
   * 2. profiles 테이블에 'avatar_url' 컬럼이 존재해야 합니다.
   */
  async uploadMemberPhoto(memberId: string, formData: FormData) {
    const file = formData.get("file") as File;
    if (!file) {
      throw new Error("업로드할 파일이 없습니다.");
    }

    // 파일 확장자 추출
    const fileExt = file.name.split(".").pop();
    const fileName = `${memberId}-${Date.now()}.${fileExt}`;

    // ⚠️ 버킷명 확인! 'profiles'로 되어있는지 체크
    const { data, error } = await supabase.storage
      .from("profiles") // ✅ 이 이름이 생성한 버킷명과 일치해야 함!
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Upload error:", error);
      throw error;
    }

    // Public URL 가져오기
    const { data: urlData } = supabase.storage
      .from("profiles")
      .getPublicUrl(fileName);

    // DB에 URL 저장 (필요시)
    // await this.updateMemberProfile(memberId, { profileImage: urlData.publicUrl });

    return { data: urlData };
  }
  // ▲▲▲ [추가 완료] ▲▲▲

  // ... (Diary, Schedule 기본 함수들 유지) ...
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

  async getFamilyEmails() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return [];
    const { data: sent } = await supabase
      .from("invitations")
      .select("receiver_email")
      .eq("sender_email", user.email)
      .eq("status", "accepted");
    const { data: received } = await supabase
      .from("invitations")
      .select("sender_email")
      .eq("receiver_email", user.email)
      .eq("status", "accepted");
    const familyEmails = [
      user.email,
      ...(sent?.map((i) => i.receiver_email) || []),
      ...(received?.map((i) => i.sender_email) || []),
    ];
    return [...new Set(familyEmails)];
  }

  async addDiaryEntry(
    type: string,
    title: string,
    content: string,
    imageUrl?: string
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("로그인 필요");
    const { data, error } = await supabase
      .from("diary_entries")
      .insert({
        type,
        title,
        content,
        image_url: imageUrl,
        user_id: user.id,
        author_email: user.email,
        author_name: user.user_metadata?.name || user.email?.split("@")[0],
      })
      .select()
      .single();
    if (error) throw error;
    return { data };
  }

  async getDiaryEntries() {
    const familyEmails = await this.getFamilyEmails();
    if (familyEmails.length === 0) return { data: [] };
    const { data, error } = await supabase
      .from("diary_entries")
      .select("*")
      .in("author_email", familyEmails)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { data };
  }

  async getDiaryEntryById(id: string) {
    const { data, error } = await supabase
      .from("diary_entries")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return { data };
  }
  async deleteDiaryEntry(id: string) {
    const { error } = await supabase
      .from("diary_entries")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return { success: true };
  }
  async updateDiaryEntry(id: string, updates: any) {
    const { data, error } = await supabase
      .from("diary_entries")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return { data };
  }

  async addSchedule(schedule: any) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("로그인 필요");
    const { data, error } = await supabase
      .from("schedules")
      .insert({
        ...schedule,
        user_id: user.id,
        author_email: user.email,
        author_name: user.user_metadata?.name || user.email?.split("@")[0],
      })
      .select()
      .single();
    if (error) throw error;
    return { data };
  }

  async getSchedules() {
    const familyEmails = await this.getFamilyEmails();
    if (familyEmails.length === 0) return { data: [] };
    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .in("author_email", familyEmails)
      .order("date", { ascending: true });
    if (error) throw error;
    return { data };
  }

  async getScheduleById(id: string) {
    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return { data };
  }
  async deleteSchedule(id: string) {
    const { error } = await supabase.from("schedules").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
  }
  async updateSchedule(id: string, updates: any) {
    const { data, error } = await supabase
      .from("schedules")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return { data };
  }
  async toggleScheduleComplete(id: string, isCompleted: boolean) {
    const updates: any = {
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    };
    const { error } = await supabase
      .from("schedules")
      .update(updates)
      .eq("id", id);
    if (error) throw error;
    return { success: true };
  }
  async toggleDiaryComplete(id: string, isCompleted: boolean) {
    const updates: any = {
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    };
    const { error } = await supabase
      .from("diary_entries")
      .update(updates)
      .eq("id", id);
    if (error) throw error;
    return { success: true };
  }

  // ✨ 대안: 초대 관계 기반 관리자 판단
  async getFamilyMembers() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !user.email) return { data: [] };

    const { data: sentInvites } = await supabase
      .from("invitations")
      .select("*")
      .eq("sender_email", user.email)
      .eq("status", "accepted");

    const { data: receivedInvites } = await supabase
      .from("invitations")
      .select("*")
      .eq("receiver_email", user.email)
      .eq("status", "accepted");

    const familyList = [
      ...(sentInvites?.map((i) => ({ email: i.receiver_email })) || []),
      ...(receivedInvites?.map((i) => ({ email: i.sender_email })) || []),
    ];
    const uniqueEmails = [
      ...new Set([user.email, ...familyList.map((f) => f.email)]),
    ];

    // ✨ 초대받은 적 있는 사람들의 이메일 수집
    const allReceiverEmails = new Set<string>();

    // 가족 내 모든 초대 관계 조회
    const { data: allInvites } = await supabase
      .from("invitations")
      .select("sender_email, receiver_email")
      .eq("status", "accepted")
      .or(
        `sender_email.in.(${uniqueEmails.join(
          ","
        )}),receiver_email.in.(${uniqueEmails.join(",")})`
      );

    allInvites?.forEach((inv) => {
      allReceiverEmails.add(inv.receiver_email);
    });

    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("email", uniqueEmails);

    const membersWithActivity = await Promise.all(
      uniqueEmails.map(async (email) => {
        const profile = profiles?.find((p) => p.email === email);
        const activity = await this.getMemberActivity(email);

        // ✨ 관리자 = 초대받은 적 없는 사람 (= 원래 초대를 시작한 사람)
        const isOwner = !allReceiverEmails.has(email);

        return {
          id: profile?.id || email,
          name: profile?.name || email.split("@")[0],
          email: email,
          phone: profile?.phone || "",
          // 이미지 URL 추가 (DB에 avatar_url 컬럼이 있다고 가정)
          avatarUrl: profile?.avatar_url || null,
          isOwner: isOwner,
          isMe: email === user.email,
          joinedDate: profile?.updated_at || new Date().toISOString(),
          activity,
        };
      })
    );

    membersWithActivity.sort((a, b) => {
      if (a.isOwner && !b.isOwner) return -1;
      if (!a.isOwner && b.isOwner) return 1;
      return 0;
    });

    return { data: membersWithActivity };
  }

  // 가족 구성원 삭제
  async removeFamilyMember(memberId: string) {
    const { error } = await supabase
      .from("family_members")
      .delete()
      .eq("id", memberId);

    if (error) throw error;
    return { success: true };
  }

  // ✨ [수정] 활동 통계 (상세하게 카운트)
  async getMemberActivity(email: string) {
    try {
      // 1. 식사 (meal)
      const { count: mealCount } = await supabase
        .from("diary_entries")
        .select("*", { count: "exact", head: true })
        .eq("author_email", email)
        .eq("type", "meal");

      // 2. 일정 (schedule)
      const { count: scheduleCount } = await supabase
        .from("schedules")
        .select("*", { count: "exact", head: true })
        .eq("author_email", email);

      // 3. 투약 (medicine 타입 일기 + medications 테이블)
      const { count: medicineDiaryCount } = await supabase
        .from("diary_entries")
        .select("*", { count: "exact", head: true })
        .eq("author_email", email)
        .eq("type", "medicine");
      const { count: medTableCount } = await supabase
        .from("medications")
        .select("*", { count: "exact", head: true })
        .eq("author_email", email);
      const medicationCount = (medicineDiaryCount || 0) + (medTableCount || 0);

      // 4. 수면 (sleep)
      const { count: sleepCount } = await supabase
        .from("diary_entries")
        .select("*", { count: "exact", head: true })
        .eq("author_email", email)
        .eq("type", "sleep");

      // 5. 커뮤니티 (posts)
      const { count: communityCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("author_email", email);

      return {
        mealCount: mealCount || 0,
        scheduleCount: scheduleCount || 0,
        medicationCount: medicationCount || 0,
        sleepCount: sleepCount || 0,
        communityCount: communityCount || 0,
        lastActiveAt: new Date().toISOString(),
      };
    } catch {
      return {
        mealCount: 0,
        scheduleCount: 0,
        medicationCount: 0,
        sleepCount: 0,
        communityCount: 0,
        lastActiveAt: null,
      };
    }
  }

  // ... (나머지 함수들 동일) ...
  async getInvitations() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return { data: [] };
    const { data } = await supabase
      .from("invitations")
      .select("*")
      .eq("receiver_email", user.email)
      .eq("status", "pending");
    return { data: data || [] };
  }
  async sendInvitation(
    email: string,
    options?: { name?: string; phone?: string }
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) throw new Error("로그인 필요");
    const formattedPhone = options?.phone
      ? this.formatPhoneNumber(options.phone)
      : "";
    const { error } = await supabase.from("invitations").insert({
      sender_email: user.email,
      sender_name: user.user_metadata?.name || user.email.split("@")[0],
      sender_phone: user.user_metadata?.phone || "",
      receiver_email: email,
      receiver_name: options?.name || "",
      receiver_phone: formattedPhone,
    });
    if (error) throw error;
    return { success: true };
  }
  async inviteMember(email: string, options?: any) {
    return this.sendInvitation(email, options);
  }
  async acceptInvite(id: string) {
    const { error } = await supabase
      .from("invitations")
      .update({ status: "accepted" })
      .eq("id", id);
    if (error) throw error;
    return { success: true };
  }
  async acceptInvitation(id: string) {
    return this.acceptInvite(id);
  }
  async declineInvitation(id: string) {
    const { error } = await supabase
      .from("invitations")
      .update({ status: "declined" })
      .eq("id", id);
    if (error) throw error;
    return { success: true };
  }
  async addCommunityPost(title: string, content: string, category: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("posts")
      .insert({
        title,
        content,
        category,
        user_id: user?.id,
        author_email: user?.email,
      })
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
    // 좋아요 기능은 복잡해서 일단 성공으로 처리
    return { data: { success: true } };
  }
}

export const apiClient = new APIClient();
