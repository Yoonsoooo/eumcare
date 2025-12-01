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
        joinedDate: user.created_at,
        avatarUrl: profile.avatar_url || user.user_metadata?.avatar_url || null,
      },
    };
  }

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
  // 2. Photo Upload (사진 업로드)
  // ==========================================

  private getFileFromFormData(formData: FormData): File {
    let file = formData.get("file") as File;

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

  async uploadMemberPhoto(memberId: string, formData: FormData) {
    console.log(`📸 [Upload Start] Member ID: ${memberId}`);

    try {
      const file = this.getFileFromFormData(formData);
      console.log(`📁 File found: ${file.name} (${file.size} bytes)`);

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${memberId}/${fileName}`;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      console.log("🔗 Generated Public URL:", publicUrl);

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

      try {
        const { data: currentProfile } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", user.id)
          .single();

        if (currentProfile?.avatar_url) {
          const urlParts = currentProfile.avatar_url.split("/avatars/");
          if (urlParts.length > 1) {
            const oldFileName = urlParts[1];
            await supabase.storage.from("avatars").remove([oldFileName]);
          }
        }
      } catch (e) {
        console.warn("⚠️ 기존 이미지 삭제 중 오류 (무시 가능):", e);
      }

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

    const { data: myConnections } = await supabase
      .from("invitations")
      .select("*")
      .or(`sender_email.eq.${myEmail},receiver_email.eq.${myEmail}`)
      .eq("status", "accepted");

    let rootEmail = myEmail;
    const receivedInvite = myConnections?.find(
      (inv) => inv.receiver_email === myEmail
    );
    if (receivedInvite) {
      rootEmail = receivedInvite.sender_email;
    }

    const { data: familyInvites } = await supabase
      .from("invitations")
      .select("sender_email, receiver_email")
      .eq("sender_email", rootEmail)
      .eq("status", "accepted");

    const familyEmails = new Set<string>();
    familyEmails.add(rootEmail);
    familyEmails.add(myEmail);

    familyInvites?.forEach((inv) => {
      familyEmails.add(inv.receiver_email);
    });

    const uniqueEmails = Array.from(familyEmails);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("email", uniqueEmails);

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
    // 멤버 ID로 이메일 조회
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", memberId)
      .single();

    if (!profile?.email) {
      throw new Error("해당 구성원을 찾을 수 없습니다.");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) throw new Error("로그인이 필요합니다.");

    // 해당 멤버와 관련된 초대장 삭제 또는 상태 변경
    const { error } = await supabase
      .from("invitations")
      .delete()
      .or(
        `and(sender_email.eq.${user.email},receiver_email.eq.${profile.email}),and(sender_email.eq.${profile.email},receiver_email.eq.${user.email})`
      );

    if (error) throw error;
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

      // 마지막 활동 시간 조회
      const { data: lastActivity } = await supabase
        .from("diary_entries")
        .select("created_at")
        .eq("author_email", email)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      return {
        mealCount: mealCount || 0,
        scheduleCount: scheduleCount || 0,
        medicationCount: (medicineDiaryCount || 0) + (medTableCount || 0),
        sleepCount: sleepCount || 0,
        communityCount: communityCount || 0,
        lastActiveAt: lastActivity?.created_at || null,
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
  // 3-1. Member Activity Details (구성원 활동 상세 조회) ✨ NEW
  // ==========================================

  // 멤버 ID로 이메일 조회하는 헬퍼 함수
  private async getMemberEmailById(memberId: string): Promise<string | null> {
    // memberId가 이메일 형식인지 확인
    if (memberId.includes("@")) {
      return memberId;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", memberId)
      .single();

    return profile?.email || null;
  }

  // 식사 기록 조회
  async getMemberMeals(memberId: string) {
    try {
      const email = await this.getMemberEmailById(memberId);
      if (!email) return { data: [] };

      const { data, error } = await supabase
        .from("diary_entries")
        .select("*")
        .eq("author_email", email)
        .eq("type", "meal")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // 프론트엔드 인터페이스에 맞게 데이터 변환
      const formattedData = (data || []).map((entry) => ({
        id: entry.id,
        mealType: entry.title || "식사", // title을 mealType으로 사용
        description: entry.content || "",
        photoUrl: entry.image_url || null,
        createdAt: entry.created_at,
      }));

      return { data: formattedData };
    } catch (error) {
      console.error("getMemberMeals error:", error);
      return { data: [] };
    }
  }

  // 일정 조회
  async getMemberSchedules(memberId: string) {
    try {
      const email = await this.getMemberEmailById(memberId);
      if (!email) return { data: [] };

      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .eq("author_email", email)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedData = (data || []).map((schedule) => ({
        id: schedule.id,
        title: schedule.title || "일정",
        date: schedule.date || "",
        time: schedule.time || null,
        description: schedule.description || schedule.content || null,
        isCompleted: schedule.is_completed || false,
        createdAt: schedule.created_at,
      }));

      return { data: formattedData };
    } catch (error) {
      console.error("getMemberSchedules error:", error);
      return { data: [] };
    }
  }

  // 투약 기록 조회
  async getMemberMedications(memberId: string) {
    try {
      const email = await this.getMemberEmailById(memberId);
      if (!email) return { data: [] };

      // diary_entries에서 medicine 타입 조회
      const { data: diaryMeds, error: diaryError } = await supabase
        .from("diary_entries")
        .select("*")
        .eq("author_email", email)
        .eq("type", "medicine")
        .order("created_at", { ascending: false })
        .limit(30);

      // medications 테이블에서도 조회
      const { data: tableMeds, error: tableError } = await supabase
        .from("medications")
        .select("*")
        .eq("author_email", email)
        .order("created_at", { ascending: false })
        .limit(30);

      if (diaryError) console.error("diaryMeds error:", diaryError);
      if (tableError) console.error("tableMeds error:", tableError);

      // 두 소스의 데이터를 합치고 포맷팅
      const formattedDiaryMeds = (diaryMeds || []).map((entry) => ({
        id: entry.id,
        medicationName: entry.title || "약",
        dosage: entry.content || "",
        takenAt: new Date(entry.created_at).toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isCompleted: entry.is_completed || false,
        createdAt: entry.created_at,
        source: "diary",
      }));

      const formattedTableMeds = (tableMeds || []).map((med) => ({
        id: med.id,
        medicationName: med.name || med.medication_name || "약",
        dosage: med.dosage || "",
        takenAt: med.time || med.taken_at || "",
        isCompleted: med.is_taken || false,
        createdAt: med.created_at,
        source: "table",
      }));

      // 합치고 시간순 정렬
      const allMeds = [...formattedDiaryMeds, ...formattedTableMeds].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return { data: allMeds };
    } catch (error) {
      console.error("getMemberMedications error:", error);
      return { data: [] };
    }
  }

  // 수면 기록 조회
  async getMemberSleepRecords(memberId: string) {
    try {
      const email = await this.getMemberEmailById(memberId);
      if (!email) return { data: [] };

      const { data, error } = await supabase
        .from("diary_entries")
        .select("*")
        .eq("author_email", email)
        .eq("type", "sleep")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedData = (data || []).map((entry) => {
        // content에서 수면 시간 정보 파싱 시도
        let sleepTime = "";
        let wakeTime = "";
        let quality = 3;
        let note = entry.content || "";

        // content 형식 예: "취침: 22:00, 기상: 07:00, 질: 4" 또는 자유 형식
        if (entry.content) {
          const sleepMatch = entry.content.match(/취침[:\s]*(\d{1,2}:\d{2})/);
          const wakeMatch = entry.content.match(/기상[:\s]*(\d{1,2}:\d{2})/);
          const qualityMatch = entry.content.match(/[질수면][:\s]*(\d)/);

          if (sleepMatch) sleepTime = sleepMatch[1];
          if (wakeMatch) wakeTime = wakeMatch[1];
          if (qualityMatch) quality = parseInt(qualityMatch[1]);
        }

        return {
          id: entry.id,
          sleepTime: sleepTime || entry.title || "",
          wakeTime: wakeTime || "",
          quality: quality,
          note: note,
          createdAt: entry.created_at,
        };
      });

      return { data: formattedData };
    } catch (error) {
      console.error("getMemberSleepRecords error:", error);
      return { data: [] };
    }
  }

  // 커뮤니티 게시글 조회
  async getMemberCommunityPosts(memberId: string) {
    try {
      const email = await this.getMemberEmailById(memberId);
      if (!email) return { data: [] };

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("author_email", email)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedData = (data || []).map((post) => ({
        id: post.id,
        title: post.title || "게시글",
        content: post.content || "",
        category: post.category || "일반",
        likesCount: post.likes_count || post.likes || 0,
        commentsCount: post.comments_count || post.comments || 0,
        createdAt: post.created_at,
      }));

      return { data: formattedData };
    } catch (error) {
      console.error("getMemberCommunityPosts error:", error);
      return { data: [] };
    }
  }

  // 모든 활동 통합 조회 (총 활동)
  async getMemberAllActivities(memberId: string) {
    try {
      const [meals, schedules, medications, sleeps, communities] =
        await Promise.all([
          this.getMemberMeals(memberId),
          this.getMemberSchedules(memberId),
          this.getMemberMedications(memberId),
          this.getMemberSleepRecords(memberId),
          this.getMemberCommunityPosts(memberId),
        ]);

      // 모든 활동에 타입 추가하고 합치기
      const allActivities = [
        ...(meals.data || []).map((item) => ({ ...item, _type: "meal" })),
        ...(schedules.data || []).map((item) => ({
          ...item,
          _type: "schedule",
        })),
        ...(medications.data || []).map((item) => ({
          ...item,
          _type: "medication",
        })),
        ...(sleeps.data || []).map((item) => ({ ...item, _type: "sleep" })),
        ...(communities.data || []).map((item) => ({
          ...item,
          _type: "community",
        })),
      ];

      // 시간순 정렬 (최신순)
      allActivities.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return { data: allActivities };
    } catch (error) {
      console.error("getMemberAllActivities error:", error);
      return { data: [] };
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

    const { data: myConnections } = await supabase
      .from("invitations")
      .select("*")
      .or(`sender_email.eq.${myEmail},receiver_email.eq.${myEmail}`)
      .eq("status", "accepted");

    let rootEmail = myEmail;

    const receivedInvite = myConnections?.find(
      (inv) => inv.receiver_email === myEmail
    );
    if (receivedInvite) {
      rootEmail = receivedInvite.sender_email;
    }

    const { data: familyInvites } = await supabase
      .from("invitations")
      .select("receiver_email")
      .eq("sender_email", rootEmail)
      .eq("status", "accepted");

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
