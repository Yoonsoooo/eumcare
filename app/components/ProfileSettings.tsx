"use client";

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  Loader2,
  LogOut,
  Bell,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { apiClient } from "../utils/api";
import { signOut } from "../utils/auth";
import { toast } from "sonner";

interface ProfileData {
  id: string;
  email: string;
  name: string;
  phone: string;
  createdAt?: string;
}

interface ProfileSettingsProps {
  fontScale?: number;
  onSignOut?: () => void;
}

export function ProfileSettings({
  fontScale = 1,
  onSignOut,
}: ProfileSettingsProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 수정 폼 상태
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // 비밀번호 변경
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // 알림 설정
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);

  const getFontWeight = () => {
    if (fontScale >= 1.5) return "font-semibold";
    if (fontScale >= 1.2) return "font-medium";
    return "font-normal";
  };

  useEffect(() => {
    loadProfile();

    // 알림 권한 상태 확인
    if ("Notification" in window) {
      setPushEnabled(Notification.permission === "granted");
    }
  }, []);

  async function loadProfile() {
    try {
      const { data, error } = await apiClient.getProfile();
      if (error) throw new Error(error);
      setProfile(data);
      setName(data?.name || "");
      setPhone(data?.phone || "");
    } catch (error) {
      console.error("프로필 로딩 실패:", error);
      toast.error("프로필을 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const { error } = await apiClient.updateProfile({ name, phone });
      if (error) throw new Error(error);
      toast.success("프로필이 저장되었습니다!");
      loadProfile();
    } catch (error: any) {
      console.error("프로필 저장 실패:", error);
      toast.error(error.message || "프로필 저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("비밀번호는 6자 이상이어야 합니다");
      return;
    }

    setChangingPassword(true);
    try {
      await apiClient.updatePassword(newPassword);
      toast.success("비밀번호가 변경되었습니다!");
      setNewPassword("");
      setConfirmPassword("");
      setIsPasswordDialogOpen(false);
    } catch (error: any) {
      console.error("비밀번호 변경 실패:", error);
      toast.error(error.message || "비밀번호 변경에 실패했습니다");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleSignOut() {
    if (confirm("정말 로그아웃 하시겠습니까?")) {
      await signOut();
      onSignOut?.();
      toast.success("로그아웃되었습니다");
    }
  }

  async function handleTogglePush(enabled: boolean) {
    if (enabled) {
      if (!("Notification" in window)) {
        toast.error("이 브라우저는 알림을 지원하지 않습니다");
        return;
      }
      const permission = await Notification.requestPermission();
      setPushEnabled(permission === "granted");
      if (permission === "granted") {
        toast.success("알림이 활성화되었습니다");
      } else {
        toast.error("알림 권한이 거부되었습니다");
      }
    } else {
      setPushEnabled(false);
      toast.success("알림이 비활성화되었습니다");
    }
  }

  // 전화번호 포맷팅
  const formatPhoneInput = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7)
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(
      7,
      11
    )}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2
          className="animate-spin text-orange-500"
          style={{ width: 32 * fontScale, height: 32 * fontScale }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <h2
        className={`font-bold ${getFontWeight()}`}
        style={{ fontSize: `${1.25 * fontScale}rem` }}
      >
        마이페이지
      </h2>

      {/* 프로필 헤더 */}
      <Card className="border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50">
        <CardContent style={{ padding: `${1.5 * fontScale}rem` }}>
          <div className="flex items-center gap-4">
            <div
              className="rounded-full bg-orange-500 text-white flex items-center justify-center font-bold"
              style={{
                width: 64 * fontScale,
                height: 64 * fontScale,
                fontSize: `${1.5 * fontScale}rem`,
              }}
            >
              {name?.[0] || profile?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h3
                className={`text-gray-900 ${getFontWeight()}`}
                style={{ fontSize: `${1.25 * fontScale}rem` }}
              >
                {name || "이름 없음"}
              </h3>
              <p
                className="text-gray-500"
                style={{ fontSize: `${0.875 * fontScale}rem` }}
              >
                {profile?.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 기본 정보 */}
      <Card className="border-orange-100">
        <CardHeader>
          <CardTitle
            className={`flex items-center gap-2 ${getFontWeight()}`}
            style={{ fontSize: `${1 * fontScale}rem` }}
          >
            <User
              className="text-orange-500"
              style={{ width: 20 * fontScale, height: 20 * fontScale }}
            />
            기본 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 이메일 (수정 불가) */}
          <div className="space-y-2">
            <Label
              className="text-gray-700 flex items-center gap-2"
              style={{ fontSize: `${0.875 * fontScale}rem` }}
            >
              <Mail
                className="text-orange-400"
                style={{ width: 16 * fontScale, height: 16 * fontScale }}
              />
              이메일
            </Label>
            <Input
              type="email"
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

          {/* 이름 */}
          <div className="space-y-2">
            <Label
              className="text-gray-700 flex items-center gap-2"
              style={{ fontSize: `${0.875 * fontScale}rem` }}
            >
              <User
                className="text-orange-400"
                style={{ width: 16 * fontScale, height: 16 * fontScale }}
              />
              이름
            </Label>
            <Input
              type="text"
              placeholder="이름을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
              style={{ fontSize: `${1 * fontScale}rem` }}
            />
          </div>

          {/* 전화번호 */}
          <div className="space-y-2">
            <Label
              className="text-gray-700 flex items-center gap-2"
              style={{ fontSize: `${0.875 * fontScale}rem` }}
            >
              <Phone
                className="text-orange-400"
                style={{ width: 16 * fontScale, height: 16 * fontScale }}
              />
              전화번호
            </Label>
            <Input
              type="tel"
              placeholder="010-1234-5678"
              value={phone}
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
              className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
              style={{ fontSize: `${1 * fontScale}rem` }}
            />
          </div>

          {/* 저장 버튼 */}
          <Button
            className="w-full bg-orange-500 hover:bg-orange-600"
            onClick={handleSaveProfile}
            disabled={saving}
            style={{ fontSize: `${1 * fontScale}rem` }}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2
                  className="animate-spin"
                  style={{ width: 16 * fontScale, height: 16 * fontScale }}
                />
                저장 중...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save
                  style={{ width: 16 * fontScale, height: 16 * fontScale }}
                />
                프로필 저장
              </span>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 알림 설정 */}
      <Card className="border-orange-100">
        <CardHeader>
          <CardTitle
            className={`flex items-center gap-2 ${getFontWeight()}`}
            style={{ fontSize: `${1 * fontScale}rem` }}
          >
            <Bell
              className="text-orange-500"
              style={{ width: 20 * fontScale, height: 20 * fontScale }}
            />
            알림 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-gray-900 ${getFontWeight()}`}
                style={{ fontSize: `${0.875 * fontScale}rem` }}
              >
                푸시 알림
              </p>
              <p
                className="text-gray-500"
                style={{ fontSize: `${0.75 * fontScale}rem` }}
              >
                약 복용, 일정 알림을 받습니다
              </p>
            </div>
            <Switch checked={pushEnabled} onCheckedChange={handleTogglePush} />
          </div>

          <div className="h-px bg-orange-100" />

          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-gray-900 ${getFontWeight()}`}
                style={{ fontSize: `${0.875 * fontScale}rem` }}
              >
                이메일 알림
              </p>
              <p
                className="text-gray-500"
                style={{ fontSize: `${0.75 * fontScale}rem` }}
              >
                중요한 알림을 이메일로 받습니다
              </p>
            </div>
            <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
          </div>
        </CardContent>
      </Card>

      {/* 보안 */}
      <Card className="border-orange-100">
        <CardHeader>
          <CardTitle
            className={`flex items-center gap-2 ${getFontWeight()}`}
            style={{ fontSize: `${1 * fontScale}rem` }}
          >
            <Shield
              className="text-orange-500"
              style={{ width: 20 * fontScale, height: 20 * fontScale }}
            />
            보안
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog
            open={isPasswordDialogOpen}
            onOpenChange={setIsPasswordDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
                style={{ fontSize: `${0.875 * fontScale}rem` }}
              >
                <Lock
                  style={{
                    width: 16 * fontScale,
                    height: 16 * fontScale,
                    marginRight: 8,
                  }}
                />
                비밀번호 변경
              </Button>
            </DialogTrigger>
            <DialogContent className="border-orange-100">
              <DialogHeader>
                <DialogTitle style={{ fontSize: `${1.125 * fontScale}rem` }}>
                  🔒 비밀번호 변경
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label style={{ fontSize: `${0.875 * fontScale}rem` }}>
                    새 비밀번호
                  </Label>
                  <Input
                    type="password"
                    placeholder="6자 이상 입력"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="border-orange-200 focus:border-orange-400"
                    style={{ fontSize: `${1 * fontScale}rem` }}
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ fontSize: `${0.875 * fontScale}rem` }}>
                    비밀번호 확인
                  </Label>
                  <Input
                    type="password"
                    placeholder="비밀번호를 다시 입력"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-orange-200 focus:border-orange-400"
                    style={{ fontSize: `${1 * fontScale}rem` }}
                  />
                </div>
                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  onClick={handleChangePassword}
                  disabled={
                    changingPassword || !newPassword || !confirmPassword
                  }
                  style={{ fontSize: `${1 * fontScale}rem` }}
                >
                  {changingPassword ? (
                    <span className="flex items-center gap-2">
                      <Loader2
                        className="animate-spin"
                        style={{
                          width: 16 * fontScale,
                          height: 16 * fontScale,
                        }}
                      />
                      변경 중...
                    </span>
                  ) : (
                    "비밀번호 변경"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* 계정 정보 */}
      <Card className="border-gray-100 bg-gray-50">
        <CardContent style={{ padding: `${1 * fontScale}rem` }}>
          <p
            className="text-gray-500"
            style={{ fontSize: `${0.875 * fontScale}rem` }}
          >
            가입일:{" "}
            {profile?.createdAt
              ? new Date(profile.createdAt).toLocaleDateString("ko-KR")
              : "-"}
          </p>
        </CardContent>
      </Card>

      {/* 로그아웃 버튼 */}
      <Button
        variant="outline"
        className="w-full border-red-200 text-red-600 hover:bg-red-50"
        onClick={handleSignOut}
        style={{ fontSize: `${1 * fontScale}rem` }}
      >
        <LogOut
          style={{
            width: 16 * fontScale,
            height: 16 * fontScale,
            marginRight: 8,
          }}
        />
        로그아웃
      </Button>
    </div>
  );
}
