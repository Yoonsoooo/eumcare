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

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  created_at?: string;
  joinedDate?: string;
}

interface ProfileSettingsProps {
  fontScale?: number;
  onSignOut?: () => void;
}

export function ProfileSettings({
  fontScale = 1,
  onSignOut,
}: ProfileSettingsProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 아이콘 크기 계산
  const getIconSize = (base: number) => base * fontScale;

  // 아바타 크기 계산
  const getAvatarSize = (base: number) => base * fontScale;

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data } = await apiClient.getMyProfile();
      if (data) {
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
      if (onSignOut) {
        onSignOut();
      } else {
        await apiClient.signOut();
        toast.success("로그아웃 되었습니다.");
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("로그아웃 중 오류가 발생했습니다.");
    }
  };

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

      const response = await apiClient.uploadMyProfilePhoto(formData);
      const newAvatarUrl = response.data.publicUrl;

      if (newAvatarUrl) {
        setProfile((prev) =>
          prev ? { ...prev, avatar_url: newAvatarUrl } : null
        );
        toast.success("프로필 사진이 업데이트되었습니다!");
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
        <h2
          className="font-bold"
          style={{ fontSize: `${1.25 * fontScale}rem` }}
        >
          마이페이지
        </h2>
      </div>

      {/* 프로필 카드 */}
      <Card className="border-orange-100 overflow-hidden">
        <div
          className="bg-gradient-to-r from-orange-400 to-orange-500"
          style={{ height: `${6 * fontScale}rem` }}
        ></div>

        <CardContent
          className="relative"
          style={{ padding: `0 ${1.5 * fontScale}rem ${1.5 * fontScale}rem` }}
        >
          <div
            className="relative mb-4"
            style={{ marginTop: `-${3 * fontScale}rem` }}
          >
            <div className="relative inline-block">
              <Avatar
                className="border-4 border-white shadow-lg"
                style={{
                  width: `${6 * fontScale}rem`,
                  height: `${6 * fontScale}rem`,
                }}
                key={profile?.avatar_url}
              >
                {profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile.name} />
                ) : null}
                <AvatarFallback
                  className="bg-orange-100 text-orange-600 font-bold"
                  style={{ fontSize: `${1.5 * fontScale}rem` }}
                >
                  {profile?.name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>

              <button
                className="absolute bottom-0 right-0 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center shadow-lg transition-colors"
                style={{
                  width: `${2 * fontScale}rem`,
                  height: `${2 * fontScale}rem`,
                }}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <div
                    className="animate-spin rounded-full border-2 border-white border-t-transparent"
                    style={{
                      width: `${1 * fontScale}rem`,
                      height: `${1 * fontScale}rem`,
                    }}
                  />
                ) : (
                  <Camera
                    style={{
                      width: `${1 * fontScale}rem`,
                      height: `${1 * fontScale}rem`,
                    }}
                    className="text-white"
                  />
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
                className="absolute bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow transition-colors"
                style={{
                  top: 0,
                  left: `${5 * fontScale}rem`,
                  width: `${1.5 * fontScale}rem`,
                  height: `${1.5 * fontScale}rem`,
                }}
                onClick={handleDeletePhoto}
                title="사진 삭제"
              >
                <X
                  style={{
                    width: `${0.75 * fontScale}rem`,
                    height: `${0.75 * fontScale}rem`,
                  }}
                  className="text-white"
                />
              </button>
            )}
          </div>

          <div style={{ marginBottom: `${1 * fontScale}rem` }}>
            <h3
              className="font-bold text-gray-900"
              style={{ fontSize: `${1.25 * fontScale}rem` }}
            >
              {profile?.name}
            </h3>
            <p
              className="text-gray-500"
              style={{ fontSize: `${0.875 * fontScale}rem` }}
            >
              {profile?.email}
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
            style={{
              fontSize: `${1 * fontScale}rem`,
              padding: `${0.5 * fontScale}rem ${1 * fontScale}rem`,
            }}
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit2
              style={{
                width: `${1 * fontScale}rem`,
                height: `${1 * fontScale}rem`,
                marginRight: `${0.5 * fontScale}rem`,
              }}
            />
            프로필 편집
          </Button>
        </CardContent>
      </Card>

      {/* 상세 정보 */}
      <Card className="border-orange-100">
        <CardContent style={{ padding: `${1 * fontScale}rem` }}>
          <h4
            className="font-semibold text-gray-900 flex items-center gap-2"
            style={{
              fontSize: `${1 * fontScale}rem`,
              marginBottom: `${1 * fontScale}rem`,
            }}
          >
            <User
              style={{
                width: `${1 * fontScale}rem`,
                height: `${1 * fontScale}rem`,
              }}
              className="text-orange-500"
            />
            내 정보
          </h4>

          <div className="space-y-3">
            {/* 이름 */}
            <div
              className="flex items-center justify-between border-b border-gray-100"
              style={{ padding: `${0.5 * fontScale}rem 0` }}
            >
              <div
                className="flex items-center text-gray-600"
                style={{
                  gap: `${0.75 * fontScale}rem`,
                  fontSize: `${0.875 * fontScale}rem`,
                }}
              >
                <User
                  style={{
                    width: `${1 * fontScale}rem`,
                    height: `${1 * fontScale}rem`,
                  }}
                  className="text-orange-400"
                />
                <span>이름</span>
              </div>
              <span
                className="font-medium"
                style={{ fontSize: `${0.875 * fontScale}rem` }}
              >
                {profile?.name}
              </span>
            </div>

            {/* 이메일 */}
            <div
              className="flex items-center justify-between border-b border-gray-100"
              style={{ padding: `${0.5 * fontScale}rem 0` }}
            >
              <div
                className="flex items-center text-gray-600"
                style={{
                  gap: `${0.75 * fontScale}rem`,
                  fontSize: `${0.875 * fontScale}rem`,
                }}
              >
                <Mail
                  style={{
                    width: `${1 * fontScale}rem`,
                    height: `${1 * fontScale}rem`,
                  }}
                  className="text-orange-400"
                />
                <span>이메일</span>
              </div>
              <span
                className="font-medium"
                style={{ fontSize: `${0.875 * fontScale}rem` }}
              >
                {profile?.email}
              </span>
            </div>

            {/* 전화번호 */}
            <div
              className="flex items-center justify-between border-b border-gray-100"
              style={{ padding: `${0.5 * fontScale}rem 0` }}
            >
              <div
                className="flex items-center text-gray-600"
                style={{
                  gap: `${0.75 * fontScale}rem`,
                  fontSize: `${0.875 * fontScale}rem`,
                }}
              >
                <Phone
                  style={{
                    width: `${1 * fontScale}rem`,
                    height: `${1 * fontScale}rem`,
                  }}
                  className="text-orange-400"
                />
                <span>전화번호</span>
              </div>
              <span
                className="font-medium"
                style={{ fontSize: `${0.875 * fontScale}rem` }}
              >
                {formatPhoneNumber(profile?.phone)}
              </span>
            </div>

            {/* 가입일 */}
            <div
              className="flex items-center justify-between"
              style={{ padding: `${0.5 * fontScale}rem 0` }}
            >
              <div
                className="flex items-center text-gray-600"
                style={{
                  gap: `${0.75 * fontScale}rem`,
                  fontSize: `${0.875 * fontScale}rem`,
                }}
              >
                <Shield
                  style={{
                    width: `${1 * fontScale}rem`,
                    height: `${1 * fontScale}rem`,
                  }}
                  className="text-orange-400"
                />
                <span>가입일</span>
              </div>
              <span
                className="font-medium"
                style={{ fontSize: `${0.875 * fontScale}rem` }}
              >
                {formatDate(profile?.joinedDate || profile?.created_at || "")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 메뉴 카드 */}
      <Card className="border-orange-100">
        <CardContent style={{ padding: `${0.5 * fontScale}rem` }}>
          <button
            className="w-full flex items-center hover:bg-orange-50 rounded-lg transition-colors"
            style={{
              gap: `${0.75 * fontScale}rem`,
              padding: `${0.75 * fontScale}rem`,
            }}
          >
            <Bell
              style={{
                width: `${1.25 * fontScale}rem`,
                height: `${1.25 * fontScale}rem`,
              }}
              className="text-orange-500"
            />
            <span
              className="flex-1 text-left"
              style={{ fontSize: `${1 * fontScale}rem` }}
            >
              알림 설정
            </span>
            <span className="text-gray-400">›</span>
          </button>

          <button
            className="w-full flex items-center hover:bg-orange-50 rounded-lg transition-colors"
            style={{
              gap: `${0.75 * fontScale}rem`,
              padding: `${0.75 * fontScale}rem`,
            }}
          >
            <Settings
              style={{
                width: `${1.25 * fontScale}rem`,
                height: `${1.25 * fontScale}rem`,
              }}
              className="text-orange-500"
            />
            <span
              className="flex-1 text-left"
              style={{ fontSize: `${1 * fontScale}rem` }}
            >
              앱 설정
            </span>
            <span className="text-gray-400">›</span>
          </button>

          <button
            className="w-full flex items-center hover:bg-orange-50 rounded-lg transition-colors"
            style={{
              gap: `${0.75 * fontScale}rem`,
              padding: `${0.75 * fontScale}rem`,
            }}
          >
            <HelpCircle
              style={{
                width: `${1.25 * fontScale}rem`,
                height: `${1.25 * fontScale}rem`,
              }}
              className="text-orange-500"
            />
            <span
              className="flex-1 text-left"
              style={{ fontSize: `${1 * fontScale}rem` }}
            >
              도움말
            </span>
            <span className="text-gray-400">›</span>
          </button>

          <button
            className="w-full flex items-center hover:bg-red-50 rounded-lg transition-colors text-red-600"
            style={{
              gap: `${0.75 * fontScale}rem`,
              padding: `${0.75 * fontScale}rem`,
            }}
            onClick={handleLogout}
          >
            <LogOut
              style={{
                width: `${1.25 * fontScale}rem`,
                height: `${1.25 * fontScale}rem`,
              }}
            />
            <span
              className="flex-1 text-left"
              style={{ fontSize: `${1 * fontScale}rem` }}
            >
              로그아웃
            </span>
          </button>
        </CardContent>
      </Card>

      {/* 프로필 편집 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="border-orange-100">
          <DialogHeader>
            <DialogTitle style={{ fontSize: `${1.125 * fontScale}rem` }}>
              프로필 편집
            </DialogTitle>
          </DialogHeader>

          <div
            className="space-y-4"
            style={{ marginTop: `${1 * fontScale}rem` }}
          >
            <div className="flex justify-center">
              <div className="relative">
                <Avatar
                  style={{
                    width: `${5 * fontScale}rem`,
                    height: `${5 * fontScale}rem`,
                  }}
                  key={profile?.avatar_url}
                >
                  {profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile.name} />
                  ) : null}
                  <AvatarFallback
                    className="bg-orange-100 text-orange-600"
                    style={{ fontSize: `${1.25 * fontScale}rem` }}
                  >
                    {profile?.name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <button
                  className="absolute bottom-0 right-0 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center shadow"
                  style={{
                    width: `${1.75 * fontScale}rem`,
                    height: `${1.75 * fontScale}rem`,
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera
                    style={{
                      width: `${0.875 * fontScale}rem`,
                      height: `${0.875 * fontScale}rem`,
                    }}
                    className="text-white"
                  />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label style={{ fontSize: `${0.875 * fontScale}rem` }}>
                이름
              </Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="border-orange-200 focus:border-orange-400"
                style={{ fontSize: `${1 * fontScale}rem` }}
              />
            </div>

            <div className="space-y-2">
              <Label style={{ fontSize: `${0.875 * fontScale}rem` }}>
                이메일
              </Label>
              <Input
                value={profile?.email || ""}
                disabled
                className="bg-gray-50 text-gray-500"
                style={{ fontSize: `${1 * fontScale}rem` }}
              />
              <p
                className="text-gray-400"
                style={{ fontSize: `${0.75 * fontScale}rem` }}
              >
                이메일은 변경할 수 없습니다
              </p>
            </div>

            <div className="space-y-2">
              <Label style={{ fontSize: `${0.875 * fontScale}rem` }}>
                전화번호
              </Label>
              <Input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="border-orange-200 focus:border-orange-400"
                style={{ fontSize: `${1 * fontScale}rem` }}
              />
            </div>

            <div
              className="flex gap-2"
              style={{ paddingTop: `${0.5 * fontScale}rem` }}
            >
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={saving}
                style={{ fontSize: `${1 * fontScale}rem` }}
              >
                취소
              </Button>
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600"
                onClick={handleSaveProfile}
                disabled={saving}
                style={{ fontSize: `${1 * fontScale}rem` }}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <div
                      className="animate-spin rounded-full border-2 border-white border-t-transparent"
                      style={{
                        width: `${1 * fontScale}rem`,
                        height: `${1 * fontScale}rem`,
                      }}
                    />
                    저장 중...
                  </span>
                ) : (
                  <>
                    <Save
                      style={{
                        width: `${1 * fontScale}rem`,
                        height: `${1 * fontScale}rem`,
                        marginRight: `${0.5 * fontScale}rem`,
                      }}
                    />
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
