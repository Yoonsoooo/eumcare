"use client";

import { useState, useEffect, useRef } from "react";
import {
  Camera,
  User,
  Mail,
  Phone,
  Edit2,
  Save,
  X,
  LogOut,
  Settings,
  Bell,
  Shield,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { apiClient } from "../utils/api";
import { toast } from "sonner";

// [수정 1] joinedDate 필드 추가 (API에서 보내주는 값)
interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  created_at?: string; // DB 생성일
  joinedDate?: string; // Auth 가입일 (실제 가입일)
}

export function ProfileSettings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  // 편집 폼 상태
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data } = await apiClient.getMyProfile();
      if (data) {
        // API 데이터와 인터페이스 타입 매칭
        setProfile(data as unknown as UserProfile);
        setEditName(data.name || "");
        setEditPhone(data.phone || "");
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    if (!confirm("로그아웃 하시겠습니까?")) return;
    try {
      await apiClient.signOut();
      toast.success("로그아웃 되었습니다.");
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("로그아웃 중 오류가 발생했습니다.");
    }
  };

  // [수정 2] 사진 업로드 로직 전면 수정
  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 유효성 검사
    if (file.size > 5 * 1024 * 1024) {
      toast.error("파일 크기는 5MB 이하여야 합니다");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드 가능합니다");
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // ✨ 중요: uploadMyProfilePhoto 사용 및 응답 구조 정확히 분해
      const response = await apiClient.uploadMyProfilePhoto(formData);

      // api.ts의 리턴값 구조: { data: { publicUrl: "..." } }
      const newAvatarUrl = response.data.publicUrl;

      if (newAvatarUrl) {
        setProfile((prev) =>
          prev ? { ...prev, avatar_url: newAvatarUrl } : null
        );
        toast.success("프로필 사진이 업데이트되었습니다!");

        // 강제 리렌더링을 위한 꼼수 (혹시 모를 캐시 문제 방지)
        // await loadProfile(); // 필요하다면 주석 해제
      } else {
        throw new Error("이미지 URL을 받아오지 못했습니다.");
      }
    } catch (error) {
      console.error("Failed to upload photo:", error);
      toast.error("사진 업로드에 실패했습니다");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeletePhoto = async () => {
    if (!profile?.avatar_url) return;
    if (!confirm("프로필 사진을 삭제하시겠습니까?")) return;

    try {
      await apiClient.deleteProfilePhoto();
      setProfile((prev) => (prev ? { ...prev, avatar_url: undefined } : null));
      toast.success("프로필 사진이 삭제되었습니다");
    } catch (error) {
      console.error("Failed to delete photo:", error);
      toast.error("사진 삭제에 실패했습니다");
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error("이름을 입력해주세요");
      return;
    }

    setSaving(true);
    try {
      const { data } = await apiClient.updateProfile({
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
      });

      if (data) {
        // 데이터 갱신 후 다시 로드
        await loadProfile();
      }
      setIsEditDialogOpen(false);
      toast.success("프로필이 업데이트되었습니다!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("프로필 업데이트에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return "등록되지 않음";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(
        7
      )}`;
    }
    return phone;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">마이페이지</h2>
      </div>

      {/* 프로필 카드 */}
      <Card className="border-orange-100 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-orange-400 to-orange-500"></div>

        <CardContent className="relative px-6 pb-6">
          <div className="relative -mt-12 mb-4">
            <div className="relative inline-block">
              {/* Avatar Key에 URL을 넣어주어 URL 변경시 강제 리렌더링 유도 */}
              <Avatar
                className="w-24 h-24 border-4 border-white shadow-lg"
                key={profile?.avatar_url}
              >
                {profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile.name} />
                ) : null}
                <AvatarFallback className="bg-orange-100 text-orange-600 text-2xl font-bold">
                  {profile?.name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>

              <button
                className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center shadow-lg transition-colors"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <Camera className="w-4 h-4 text-white" />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            {profile?.avatar_url && (
              <button
                className="absolute top-0 left-20 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow transition-colors"
                onClick={handleDeletePhoto}
                title="사진 삭제"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            )}
          </div>

          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900">{profile?.name}</h3>
            <p className="text-sm text-gray-500">{profile?.email}</p>
          </div>

          <Button
            variant="outline"
            className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            프로필 편집
          </Button>
        </CardContent>
      </Card>

      {/* 상세 정보 */}
      <Card className="border-orange-100">
        <CardContent className="p-4 space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-4 h-4 text-orange-500" />내 정보
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-orange-400" />
                <span className="text-gray-600">이름</span>
              </div>
              <span className="font-medium">{profile?.name}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-orange-400" />
                <span className="text-gray-600">이메일</span>
              </div>
              <span className="font-medium">{profile?.email}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-orange-400" />
                <span className="text-gray-600">전화번호</span>
              </div>
              <span className="font-medium">
                {formatPhoneNumber(profile?.phone)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-4 h-4 text-orange-400" />
                <span className="text-gray-600">가입일</span>
              </div>
              <span className="font-medium">
                {/* [수정 3] joinedDate 우선 사용, 없으면 created_at 사용 */}
                {formatDate(profile?.joinedDate || profile?.created_at || "")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-100">
        <CardContent className="p-2">
          <button className="w-full flex items-center gap-3 p-3 hover:bg-orange-50 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-orange-500" />
            <span className="flex-1 text-left">알림 설정</span>
            <span className="text-gray-400">›</span>
          </button>

          <button className="w-full flex items-center gap-3 p-3 hover:bg-orange-50 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-orange-500" />
            <span className="flex-1 text-left">앱 설정</span>
            <span className="text-gray-400">›</span>
          </button>

          <button className="w-full flex items-center gap-3 p-3 hover:bg-orange-50 rounded-lg transition-colors">
            <HelpCircle className="w-5 h-5 text-orange-500" />
            <span className="flex-1 text-left">도움말</span>
            <span className="text-gray-400">›</span>
          </button>

          <button
            className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-lg transition-colors text-red-600"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            <span className="flex-1 text-left">로그아웃</span>
          </button>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="border-orange-100">
          <DialogHeader>
            <DialogTitle>프로필 편집</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="flex justify-center">
              <div className="relative">
                {/* 다이얼로그 내부 아바타에도 키 적용 */}
                <Avatar className="w-20 h-20" key={profile?.avatar_url}>
                  {profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile.name} />
                  ) : null}
                  <AvatarFallback className="bg-orange-100 text-orange-600 text-xl">
                    {profile?.name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <button
                  className="absolute bottom-0 right-0 w-7 h-7 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center shadow"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>이름</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="border-orange-200 focus:border-orange-400"
              />
            </div>

            <div className="space-y-2">
              <Label>이메일</Label>
              <Input
                value={profile?.email || ""}
                disabled
                className="bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-400">
                이메일은 변경할 수 없습니다
              </p>
            </div>

            <div className="space-y-2">
              <Label>전화번호</Label>
              <Input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="border-orange-200 focus:border-orange-400"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={saving}
              >
                취소
              </Button>
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    저장 중...
                  </span>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    저장
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
