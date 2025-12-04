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

  // ✅ [수정됨] 가족 구성원 사진 업로드 - 실제 업로드 로직 추가
  async uploadMemberPhoto(memberId: string, formData: FormData) {
    console.log(`📸 [Upload Start] Member ID: ${memberId}`);

    try {
      const file = this.getFileFromFormData(formData);
      console.log(`📁 File found: ${file.name} (${file.size} bytes)`);

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${memberId}/${fileName}`;

      // 기존 사진 삭제 시도
      try {
        const { data: currentProfile } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", memberId)
          .single();

        if (currentProfile?.avatar_url) {
          const urlParts = currentProfile.avatar_url.split("/avatars/");
          if (urlParts.length > 1) {
            const oldFilePath = urlParts[1];
            await supabase.storage.from("avatars").remove([oldFilePath]);
            console.log("🗑️ Old photo deleted:", oldFilePath);
          }
        }
      } catch (e) {
        console.warn("⚠️ 기존 이미지 삭제 중 오류 (무시 가능):", e);
      }

      // ✅ 실제 파일 업로드
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("❌ Storage Upload Error:", uploadError);
        throw uploadError;
      }

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

      console.log("✅ Photo upload successful!");
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
  // 3-1. Member Activity Details (구성원 활동 상세 조회)
  // ==========================================

  private async getMemberEmailById(memberId: string): Promise<string | null> {
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

      const formattedData = (data || []).map((entry) => ({
        id: entry.id,
        mealType: entry.title || "식사",
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

  async getMemberMedications(memberId: string) {
    try {
      const email = await this.getMemberEmailById(memberId);
      if (!email) return { data: [] };

      const { data: diaryMeds, error: diaryError } = await supabase
        .from("diary_entries")
        .select("*")
        .eq("author_email", email)
        .eq("type", "medicine")
        .order("created_at", { ascending: false })
        .limit(30);

      const { data: tableMeds, error: tableError } = await supabase
        .from("medications")
        .select("*")
        .eq("author_email", email)
        .order("created_at", { ascending: false })
        .limit(30);

      if (diaryError) console.error("diaryMeds error:", diaryError);
      if (tableError) console.error("tableMeds error:", tableError);

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
        let sleepTime = "";
        let wakeTime = "";
        let quality = 3;
        let note = entry.content || "";

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
  // 6. Community (커뮤니티) - 완전한 기능
  // ==========================================

  async addCommunityPost(title: string, content: string, category: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("로그인이 필요합니다");

    // 프로필에서 이름 가져오기
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, avatar_url")
      .eq("id", user.id)
      .single();

    const authorName =
      profile?.name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "익명";

    const { data, error } = await supabase
      .from("posts")
      .insert({
        title,
        content,
        category,
        user_id: user.id,
        author_email: user.email,
        author_name: authorName,
        likes_count: 0,
        comments_count: 0,
      })
      .select()
      .single();

    if (error) throw error;

    // 프로필 정보 포함해서 반환
    return {
      data: {
        ...data,
        authorName: authorName,
        authorAvatar: profile?.avatar_url || null,
      },
    };
  }

  async getCommunityPosts() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // 현재 사용자가 좋아요한 게시글 목록 조회
    let likedPostIds: string[] = [];
    if (user) {
      const { data: likes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id);
      likedPostIds = (likes || []).map((like) => like.post_id);
    }

    // 모든 작성자의 프로필 정보 가져오기
    const authorEmails = [
      ...new Set((data || []).map((post) => post.author_email).filter(Boolean)),
    ];

    let profilesMap: Record<
      string,
      { name: string; avatar_url: string | null }
    > = {};

    if (authorEmails.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("email, name, avatar_url")
        .in("email", authorEmails);

      (profiles || []).forEach((profile) => {
        if (profile.email) {
          profilesMap[profile.email] = {
            name: profile.name || profile.email.split("@")[0],
            avatar_url: profile.avatar_url,
          };
        }
      });
    }

    // 데이터 정규화 및 프로필 정보 추가
    const normalizedData = (data || []).map((post) => {
      const profile = profilesMap[post.author_email] || null;
      return {
        ...post,
        authorName:
          profile?.name ||
          post.author_name ||
          post.author_email?.split("@")[0] ||
          "익명",
        authorAvatar: profile?.avatar_url || null,
        createdAt: post.created_at,
        likes: post.likes_count || 0,
        comments: post.comments_count || 0,
        isLikedByMe: likedPostIds.includes(post.id),
      };
    });

    return { data: normalizedData };
  }

  async getPostById(postId: string) {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .single();
    if (error) throw error;
    return { data };
  }

  // ✅ 게시글 삭제
  async deletePost(postId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("로그인이 필요합니다");

    // 본인 게시글인지 확인
    const { data: post } = await supabase
      .from("posts")
      .select("user_id, author_email")
      .eq("id", postId)
      .single();

    if (!post) throw new Error("게시글을 찾을 수 없습니다");
    if (post.user_id !== user.id && post.author_email !== user.email) {
      throw new Error("본인의 게시글만 삭제할 수 있습니다");
    }

    // 관련 댓글도 함께 삭제 (CASCADE 설정이 없는 경우)
    await supabase.from("comments").delete().eq("post_id", postId);

    // 관련 좋아요도 삭제
    await supabase.from("post_likes").delete().eq("post_id", postId);

    const { error } = await supabase.from("posts").delete().eq("id", postId);

    if (error) throw error;
    return { success: true };
  }

  // ✅ 좋아요 토글 (좋아요/취소)
  async likePost(postId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("로그인이 필요합니다");

    // 이미 좋아요 했는지 확인
    const { data: existingLike } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle(); // single() 대신 maybeSingle() 사용

    const { data: post } = await supabase
      .from("posts")
      .select("likes_count")
      .eq("id", postId)
      .single();

    const currentCount = post?.likes_count || 0;

    if (existingLike) {
      // 이미 좋아요 했으면 취소
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      const newCount = Math.max(currentCount - 1, 0);
      await supabase
        .from("posts")
        .update({ likes_count: newCount })
        .eq("id", postId);

      return { data: { likes: newCount, isLiked: false } };
    } else {
      // 좋아요 추가
      await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: user.id,
        user_email: user.email,
      });

      const newCount = currentCount + 1;
      await supabase
        .from("posts")
        .update({ likes_count: newCount })
        .eq("id", postId);

      return { data: { likes: newCount, isLiked: true } };
    }
  }

  // ✅ 댓글 조회 (프로필 정보 포함)
  async getPostComments(postId: string) {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("getPostComments error:", error);
      return { data: [] };
    }

    // 모든 댓글 작성자의 프로필 정보 가져오기
    const authorEmails = [
      ...new Set((data || []).map((c) => c.author_email).filter(Boolean)),
    ];

    let profilesMap: Record<
      string,
      { name: string; avatar_url: string | null }
    > = {};

    if (authorEmails.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("email, name, avatar_url")
        .in("email", authorEmails);

      (profiles || []).forEach((profile) => {
        if (profile.email) {
          profilesMap[profile.email] = {
            name: profile.name || profile.email.split("@")[0],
            avatar_url: profile.avatar_url,
          };
        }
      });
    }

    // 프로필 정보 추가
    const commentsWithProfile = (data || []).map((comment) => {
      const profile = profilesMap[comment.author_email] || null;
      return {
        ...comment,
        authorName:
          profile?.name ||
          comment.author_name ||
          comment.author_email?.split("@")[0] ||
          "익명",
        authorAvatar: profile?.avatar_url || null,
      };
    });

    return { data: commentsWithProfile };
  }

  // ✅ 댓글 작성
  async addComment(postId: string, content: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("로그인이 필요합니다");

    // 프로필에서 이름과 아바타 가져오기
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, avatar_url")
      .eq("id", user.id)
      .single();

    const authorName =
      profile?.name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "익명";

    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        content,
        user_id: user.id,
        author_email: user.email,
        author_name: authorName,
      })
      .select()
      .single();

    if (error) throw error;

    // 게시글의 댓글 수 업데이트
    const { data: post } = await supabase
      .from("posts")
      .select("comments_count")
      .eq("id", postId)
      .single();

    await supabase
      .from("posts")
      .update({ comments_count: (post?.comments_count || 0) + 1 })
      .eq("id", postId);

    // 프로필 정보 포함해서 반환
    return {
      data: {
        ...data,
        authorName: authorName,
        authorAvatar: profile?.avatar_url || null,
      },
    };
  }

  // 게시글 수정
  async updatePost(
    postId: string,
    updates: { title?: string; content?: string; category?: string }
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("로그인이 필요합니다");

    // 본인 게시글인지 확인
    const { data: post } = await supabase
      .from("posts")
      .select("user_id, author_email")
      .eq("id", postId)
      .single();

    if (!post) throw new Error("게시글을 찾을 수 없습니다");
    if (post.user_id !== user.id && post.author_email !== user.email) {
      throw new Error("본인의 게시글만 수정할 수 있습니다");
    }

    const { data, error } = await supabase
      .from("posts")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .select()
      .single();

    if (error) throw error;
    return { data };
  }

  // 댓글 수정
  async updateComment(commentId: string, content: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("로그인이 필요합니다");

    // 본인 댓글인지 확인
    const { data: comment } = await supabase
      .from("comments")
      .select("user_id, author_email")
      .eq("id", commentId)
      .single();

    if (!comment) throw new Error("댓글을 찾을 수 없습니다");
    if (comment.user_id !== user.id && comment.author_email !== user.email) {
      throw new Error("본인의 댓글만 수정할 수 있습니다");
    }

    const { data, error } = await supabase
      .from("comments")
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId)
      .select()
      .single();

    if (error) throw error;
    return { data };
  }

  // ✅ 댓글 삭제
  async deleteComment(commentId: string, postId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("로그인이 필요합니다");

    // 본인 댓글인지 확인
    const { data: comment } = await supabase
      .from("comments")
      .select("user_id, author_email")
      .eq("id", commentId)
      .single();

    if (!comment) throw new Error("댓글을 찾을 수 없습니다");
    if (comment.user_id !== user.id && comment.author_email !== user.email) {
      throw new Error("본인의 댓글만 삭제할 수 있습니다");
    }

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) throw error;

    // 게시글의 댓글 수 업데이트
    const { data: post } = await supabase
      .from("posts")
      .select("comments_count")
      .eq("id", postId)
      .single();

    await supabase
      .from("posts")
      .update({ comments_count: Math.max((post?.comments_count || 1) - 1, 0) })
      .eq("id", postId);

    return { success: true };
  }
}

export const apiClient = new APIClient();
