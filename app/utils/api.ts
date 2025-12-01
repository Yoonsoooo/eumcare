import { supabase } from "./auth";

export class APIClient {
  setAccessToken(token: string | null) {}

  // ==========================================
  // 1. Auth & Profile (인증 및 프로필)
  // ==========================================

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

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error);
      throw error;
    }
    return { success: true };
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

  // [유지] 가입일(joinedDate) 포함 반환
  async getMyProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("로그인이 필요합니다.");

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) throw error;

    return {
      data: {
        ...profile,
        joinedDate: user.created_at, // 가입일 추가
        avatarUrl: profile.avatar_url || user.user_metadata?.avatar_url || null,
      },
    };
  }

  // 호환성 유지용
  async getProfile() {
    return this.getMyProfile();
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

  async updateMyProfile(updates: {
    name?: string;
    phone?: string;
    avatar_url?: string;
  }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("로그인이 필요합니다.");
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();
    if (error) throw error;
    return { data };
  }

  // ==========================================
  // 2. Photo Upload (사진 업로드 - 강력한 디버깅 추가)
  // ==========================================

  // 공통 파일 추출 헬퍼 함수
  private getFileFromFormData(formData: FormData): File {
    let file = formData.get("file") as File;

    // 키 값이 'file'이 아닐 경우 전체 탐색하여 파일 찾기
    if (!file) {
      for (const value of formData.values()) {
        if (value instanceof File) {
          file = value;
          break;
        }
      }
    }

    if (!file) {
      console.error(
        "❌ FormData에서 파일을 찾을 수 없습니다. input name='file'인지 확인하세요."
      );
      throw new Error("업로드할 파일이 없습니다.");
    }
    return file;
  }

  // [수정] 가족 구성원 사진 업로드
  async uploadMemberPhoto(memberId: string, formData: FormData) {
    console.log(`📸 [Upload Start] Member ID: ${memberId}`);

    try {
      const file = this.getFileFromFormData(formData);
      console.log(`📁 File found: ${file.name} (${file.size} bytes)`);

      // 파일명 생성 (특수문자 제거 및 타임스탬프)
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${memberId}/${fileName}`;

      // Public URL 생성
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      console.log("🔗 Generated Public URL:", publicUrl);

      // DB 업데이트
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl, updated_at: new Date() })
        .eq("id", memberId);

      if (updateError) {
        console.error("❌ Profile DB Update Error:", updateError);
        throw updateError;
      }

      return { success: true, data: publicUrl };
    } catch (e) {
      console.error("🔥 uploadMemberPhoto Exception:", e);
      throw e;
    }
  }

  // [수정] 내 프로필 사진 업로드
  async uploadMyProfilePhoto(formData: FormData) {
    console.log("📸 [MyProfile Upload Start]");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      const file = this.getFileFromFormData(formData);
      console.log(`📁 File found: ${file.name}`);

      const fileExt = file.name.split(".").pop();
      const filePath = `user-${user.id}-${Date.now()}.${fileExt}`;

      // 기존 사진 삭제 시도 (실패해도 진행)
      try {
        const { data: currentProfile } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", user.id)
          .single();

        if (currentProfile?.avatar_url) {
          // URL에서 파일명만 추출하는 로직
          const urlParts = currentProfile.avatar_url.split("/avatars/");
          if (urlParts.length > 1) {
            const oldFileName = urlParts[1];
            await supabase.storage.from("avatars").remove([oldFileName]);
          }
        }
      } catch (e) {
        console.warn("⚠️ 기존 이미지 삭제 중 오류 (무시 가능):", e);
      }

      // 새 파일 업로드
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("❌ MyProfile Upload Error:", uploadError);
        console.error(
          "💡 힌트: Supabase Storage 'avatars' 버킷 권한(Policy)을 확인하세요."
        );
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const imageUrl = urlData.publicUrl;
      console.log("🔗 New Profile URL:", imageUrl);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: imageUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      return { data: { publicUrl: imageUrl } };
    } catch (e) {
      console.error("🔥 uploadMyProfilePhoto Exception:", e);
      throw e;
    }
  }

  // [유지] 내 프로필 사진 삭제
  async deleteProfilePhoto() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("로그인이 필요합니다.");

    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();

    if (profile?.avatar_url) {
      const urlParts = profile.avatar_url.split("/avatars/");
      if (urlParts.length > 1) {
        const fileName = urlParts[1];
        await supabase.storage.from("avatars").remove([fileName]);
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", user.id);

    if (error) throw error;
    return { success: true };
  }

  // ==========================================
  // 3. Family & Members (가족 구성원 로직)
  // ==========================================

  async getFamilyMembers() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !user.email) return { data: [] };

    const myEmail = user.email;

    // 1. 연결된 초대장 찾기
    const { data: myConnections } = await supabase
      .from("invitations")
      .select("*")
      .or(`sender_email.eq.${myEmail},receiver_email.eq.${myEmail}`)
      .eq("status", "accepted");

    // 2. 방장(Root) 찾기
    let rootEmail = myEmail;
    const receivedInvite = myConnections?.find(
      (inv) => inv.receiver_email === myEmail
    );
    if (receivedInvite) {
      rootEmail = receivedInvite.sender_email;
    }

    // 3. 방장 기준 모든 초대장 가져오기
    const { data: familyInvites } = await supabase
      .from("invitations")
      .select("sender_email, receiver_email")
      .eq("sender_email", rootEmail)
      .eq("status", "accepted");

    // 4. 이메일 수집
    const familyEmails = new Set<string>();
    familyEmails.add(rootEmail);
    familyEmails.add(myEmail);

    familyInvites?.forEach((inv) => {
      familyEmails.add(inv.receiver_email);
    });

    const uniqueEmails = Array.from(familyEmails);

    // 5. 프로필 조회
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("email", uniqueEmails);

    // 6. 데이터 가공
    const membersWithActivity = await Promise.all(
      uniqueEmails.map(async (email) => {
        const profile = profiles?.find((p) => p.email === email);
        const activity = await this.getMemberActivity(email);
        const isOwner = email === rootEmail;

        return {
          id: profile?.id || email,
          name: profile?.name || email.split("@")[0],
          email: email,
          phone: profile?.phone || "",
          avatarUrl: profile?.avatar_url || null,
          isOwner: isOwner,
          isMe: email === myEmail,
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

  async removeFamilyMember(memberId: string) {
    return { success: true };
  }

  async getMemberActivity(email: string) {
    try {
      const { count: mealCount } = await supabase
        .from("diary_entries")
        .select("*", { count: "exact", head: true })
        .eq("author_email", email)
        .eq("type", "meal");
      const { count: scheduleCount } = await supabase
        .from("schedules")
        .select("*", { count: "exact", head: true })
        .eq("author_email", email);
      const { count: medicineDiaryCount } = await supabase
        .from("diary_entries")
        .select("*", { count: "exact", head: true })
        .eq("author_email", email)
        .eq("type", "medicine");
      const { count: medTableCount } = await supabase
        .from("medications")
        .select("*", { count: "exact", head: true })
        .eq("author_email", email);
      const { count: sleepCount } = await supabase
        .from("diary_entries")
        .select("*", { count: "exact", head: true })
        .eq("author_email", email)
        .eq("type", "sleep");
      const { count: communityCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("author_email", email);

      return {
        mealCount: mealCount || 0,
        scheduleCount: scheduleCount || 0,
        medicationCount: (medicineDiaryCount || 0) + (medTableCount || 0),
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

  // ==========================================
  // 4. Diaries & Schedules (일기 및 일정)
  // ==========================================

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

    const myEmail = user.email;

    // 1. 나와 연결된 초대장 확인 (내가 방장인지, 멤버인지 확인)
    const { data: myConnections } = await supabase
      .from("invitations")
      .select("*")
      .or(`sender_email.eq.${myEmail},receiver_email.eq.${myEmail}`)
      .eq("status", "accepted");

    // 2. '방장(Root)' 이메일 찾기
    let rootEmail = myEmail;

    // 내가 받은 초대장이 있다면, 보낸 사람이 방장입니다.
    const receivedInvite = myConnections?.find(
      (inv) => inv.receiver_email === myEmail
    );
    if (receivedInvite) {
      rootEmail = receivedInvite.sender_email;
    }

    // 3. 방장이 초대한 **모든** 사람들(형제/자매 포함) 찾기
    const { data: familyInvites } = await supabase
      .from("invitations")
      .select("receiver_email")
      .eq("sender_email", rootEmail)
      .eq("status", "accepted");

    // 4. 이메일 리스트 합치기 (중복 제거)
    // 구성: [나, 방장, 방장이 초대한 다른 사람들]
    const familyEmails = new Set<string>();
    familyEmails.add(myEmail);
    familyEmails.add(rootEmail);

    familyInvites?.forEach((inv) => {
      familyEmails.add(inv.receiver_email);
    });

    return Array.from(familyEmails);
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

  // ==========================================
  // 5. Invitations (초대 관련)
  // ==========================================

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

  // ==========================================
  // 6. Community (커뮤니티)
  // ==========================================

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
    return { data: { success: true } };
  }
}

export const apiClient = new APIClient();
