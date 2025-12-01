"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mail,
  MoreVertical,
  UserPlus,
  Share2,
  Bell,
  Phone,
  Calendar,
  Activity,
  Pill,
  Moon,
  Utensils,
  Users,
  Camera,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { apiClient } from "../utils/api";
import { toast } from "sonner";

interface MemberActivity {
  mealCount: number;
  scheduleCount: number;
  medicationCount: number;
  sleepCount: number;
  communityCount: number;
  lastActiveAt: string | null;
}

interface Member {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string; // ✨ [수정] profileImage -> avatarUrl (API와 통일)
  isOwner: boolean;
  joinedDate: string;
  activity?: MemberActivity;
}

interface Invitation {
  id: string;
  fromUserName: string;
  fromUserEmail: string;
  diaryName: string;
  createdAt: string;
  status: "pending" | "accepted" | "declined";
  sender_email?: string;
  created_at?: string;
}

export function FamilyMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isInvitationsDialogOpen, setIsInvitationsDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  // 구성원 상세 정보 모달
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isMemberDetailOpen, setIsMemberDetailOpen] = useState(false);

  // 프로필 사진 업로드
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // 삭제 관련 상태
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadMembers();
    loadInvitations();
  }, []);

  async function loadMembers() {
    try {
      const { data } = await apiClient.getFamilyMembers();
      // API에서 받아온 데이터가 Member 인터페이스와 맞는지(avatarUrl 등) 확인
      setMembers(data || []);
    } catch (error) {
      console.error("Failed to load family members:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadInvitations() {
    try {
      const { data } = await apiClient.getInvitations();
      setInvitations(data || []);
    } catch (error) {
      console.error("Failed to load invitations:", error);
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail) return;

    setSearchLoading(true);
    try {
      await apiClient.sendInvitation(inviteEmail, {
        name: inviteName,
        phone: invitePhone,
      });
      toast.success(`${inviteName || inviteEmail}님에게 초대를 보냈습니다!`);
      setInviteEmail("");
      setInvitePhone("");
      setInviteName("");
      setIsInviteDialogOpen(false);
    } catch (error: any) {
      console.error("Failed to invite member:", error);
      if (error.message === "User not found") {
        toast.error("해당 이메일로 가입된 사용자를 찾을 수 없습니다");
      } else {
        toast.error("초대에 실패했습니다");
      }
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await apiClient.acceptInvitation(invitationId);
      toast.success("초대를 수락했습니다!");
      loadInvitations();
      loadMembers();
    } catch (error) {
      console.error("Failed to accept invitation:", error);
      toast.error("초대 수락에 실패했습니다");
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      await apiClient.declineInvitation(invitationId);
      toast.success("초대를 거절했습니다");
      loadInvitations();
    } catch (error) {
      console.error("Failed to decline invitation:", error);
      toast.error("초대 거절에 실패했습니다");
    }
  };

  const handleCopyInviteLink = () => {
    const inviteLink = "https://ieumcare.app/invite/abc123";
    navigator.clipboard.writeText(inviteLink);
    toast.success("초대 링크가 복사되었습니다!");
  };

  const handleMemberClick = (member: Member) => {
    setSelectedMember(member);
    setIsMemberDetailOpen(true);
  };

  const handleOpenDeleteDialog = (member: Member) => {
    setMemberToDelete(member);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;

    setIsDeleting(true);
    try {
      await apiClient.removeFamilyMember(memberToDelete.id);
      setMembers(members.filter((m) => m.id !== memberToDelete.id));
      setIsDeleteDialogOpen(false);
      setIsMemberDetailOpen(false);
      setMemberToDelete(null);
      setSelectedMember(null);
      toast.success(`${memberToDelete.name}님을 구성원에서 삭제했습니다`);
    } catch (error: any) {
      console.error("Failed to delete member:", error);
      toast.error(error.message || "구성원 삭제에 실패했습니다");
    } finally {
      setIsDeleting(false);
    }
  };

  // ✨ [수정됨] 사진 업로드 핸들러
  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !selectedMember) return;

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

      // 1. API 호출
      // 반환값 예시: { success: true, data: "https://..." }
      const response = await apiClient.uploadMemberPhoto(
        selectedMember.id,
        formData
      );

      // 2. URL 추출 (api.ts에서 data 자체가 URL 문자열임)
      const imageUrl = response.data;

      // 3. 상태 업데이트 (avatarUrl 사용)
      setSelectedMember({ ...selectedMember, avatarUrl: imageUrl });
      setMembers(
        members.map((m) =>
          m.id === selectedMember.id ? { ...m, avatarUrl: imageUrl } : m
        )
      );

      toast.success("프로필 사진이 업데이트되었습니다!");
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

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "pending"
  );

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "-";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(
        7
      )}`;
    }
    return phone;
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

  const getLastActiveText = (lastActiveAt: string | null) => {
    if (!lastActiveAt) return "활동 기록 없음";
    const now = new Date();
    const lastActive = new Date(lastActiveAt);
    const diffMs = now.getTime() - lastActive.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "방금 전 활동";
    if (diffHours < 24) return `${diffHours}시간 전 활동`;
    if (diffDays === 1) return "어제 활동";
    return `${diffDays}일 전 활동`;
  };

  const getTotalActivity = (activity?: MemberActivity) => {
    if (!activity) return 0;
    return (
      (activity.mealCount || 0) +
      (activity.scheduleCount || 0) +
      (activity.medicationCount || 0) +
      (activity.sleepCount || 0) +
      (activity.communityCount || 0)
    );
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* 상단 헤더 및 초대 버튼들 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">가족 구성원</h2>
        <div className="flex items-center gap-2">
          {/* 받은 초대 버튼 */}
          <Dialog
            open={isInvitationsDialogOpen}
            onOpenChange={setIsInvitationsDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="relative border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <Bell className="w-4 h-4 mr-2" />
                받은 초대
                {pendingInvitations.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {pendingInvitations.length}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="border-orange-100">
              <DialogHeader>
                <DialogTitle>📬 받은 초대</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-4">
                {pendingInvitations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-orange-200" />
                    <p>받은 초대가 없습니다</p>
                  </div>
                ) : (
                  pendingInvitations.map((invitation) => (
                    <Card key={invitation.id} className="border-orange-100">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-orange-100 text-orange-600">
                              {(invitation.sender_email ||
                                invitation.fromUserName ||
                                "?")[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm">
                              <span className="font-medium text-gray-900">
                                {invitation.sender_email || "알 수 없음"}
                              </span>
                              <span className="text-gray-600">님이 </span>
                              <span className="font-medium text-orange-600">
                                {invitation.diaryName}
                              </span>
                              <span className="text-gray-600">
                                {" "}
                                다이어리에 초대했습니다.
                              </span>
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {Math.floor(
                                (new Date().getTime() -
                                  new Date(
                                    invitation.created_at ||
                                      invitation.createdAt
                                  ).getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )}
                              일 전
                            </p>
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                className="bg-orange-500 hover:bg-orange-600"
                                onClick={() =>
                                  handleAcceptInvitation(invitation.id)
                                }
                              >
                                수락
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-gray-200 text-gray-600 hover:bg-gray-50"
                                onClick={() =>
                                  handleDeclineInvitation(invitation.id)
                                }
                              >
                                거절
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* 초대하기 버튼 */}
          <Dialog
            open={isInviteDialogOpen}
            onOpenChange={setIsInviteDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <UserPlus className="w-4 h-4 mr-2" />
                초대하기
              </Button>
            </DialogTrigger>
            <DialogContent className="border-orange-100">
              <DialogHeader>
                <DialogTitle>👨‍👩‍👧‍👦 가족 구성원 초대</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                  <p className="text-sm text-orange-800">
                    💡 초대할 가족의 정보를 입력하세요. 이메일은 필수이며,
                    상대방이 이음케어에 가입되어 있어야 초대할 수 있습니다.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">이름</Label>
                  <Input
                    type="text"
                    placeholder="홍길동"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">전화번호</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
                    <Input
                      type="tel"
                      placeholder="010-1234-5678"
                      value={invitePhone}
                      onChange={(e) => setInvitePhone(e.target.value)}
                      className="pl-10 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">
                    이메일 주소 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
                    <Input
                      type="email"
                      placeholder="example@email.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="pl-10 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                    />
                  </div>
                </div>
                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  onClick={handleInvite}
                  disabled={searchLoading || !inviteEmail}
                >
                  {searchLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span> 초대 보내는 중...
                    </span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      초대 보내기
                    </>
                  )}
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-orange-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">또는</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
                  onClick={handleCopyInviteLink}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  초대 링크 복사
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-orange-50 border-orange-100">
        <CardContent className="p-4">
          <p className="text-sm text-orange-800">
            🧡 가족 구성원들과 함께 일정과 기록을 공유하세요. 초대를 보내면
            상대방의 <strong>'받은 초대'</strong>에서 확인할 수 있습니다.
          </p>
        </CardContent>
      </Card>

      {/* Members List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
            <p className="text-gray-500">로딩 중...</p>
          </div>
        ) : members.length === 0 ? (
          <Card className="border-orange-100">
            <CardContent className="p-8 text-center text-gray-500">
              아직 가족 구성원이 없습니다.
              <br />
              <span className="text-orange-500">초대하기</span> 버튼을 눌러
              가족을 초대해보세요!
            </CardContent>
          </Card>
        ) : (
          members.map((member) => (
            <Card
              key={member.id}
              className="border-orange-100 hover:border-orange-200 hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleMemberClick(member)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    {/* ✨ [수정됨] profileImage -> avatarUrl */}
                    {member.avatarUrl ? (
                      <AvatarImage src={member.avatarUrl} alt={member.name} />
                    ) : null}
                    <AvatarFallback className="bg-orange-100 text-orange-600 font-medium">
                      {member.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-gray-900 font-semibold text-base">
                        {member.name}
                      </h3>
                      {member.isOwner && (
                        <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded font-medium">
                          관리자
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 mt-1.5 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-orange-400" />
                        <span>{formatPhoneNumber(member.phone || "")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-orange-400" />
                        <span>{member.email}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-orange-50 hover:text-orange-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMemberClick(member);
                    }}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 구성원 상세 정보 모달 */}
      <Dialog open={isMemberDetailOpen} onOpenChange={setIsMemberDetailOpen}>
        <DialogContent className="border-orange-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="relative group">
                <Avatar className="w-14 h-14">
                  {/* ✨ [수정됨] profileImage -> avatarUrl */}
                  {selectedMember?.avatarUrl ? (
                    <AvatarImage
                      src={selectedMember.avatarUrl}
                      alt={selectedMember.name}
                    />
                  ) : null}
                  <AvatarFallback className="bg-orange-100 text-orange-600 font-medium text-lg">
                    {selectedMember?.name[0]}
                  </AvatarFallback>
                </Avatar>
                <button
                  className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
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
              <div>
                <div className="flex items-center gap-2">
                  <span>{selectedMember?.name}</span>
                  {selectedMember?.isOwner && (
                    <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded font-medium">
                      관리자
                    </span>
                  )}
                </div>
                <p className="text-sm font-normal text-gray-500">
                  {getLastActiveText(
                    selectedMember?.activity?.lastActiveAt || null
                  )}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedMember && (
            <div className="space-y-4 mt-4">
              {/* 기본 정보 */}
              <Card className="border-orange-100">
                <CardContent className="p-4 space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    📋 기본 정보
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-orange-400" />
                      <span className="text-gray-600">전화번호</span>
                      <span className="ml-auto font-medium">
                        {formatPhoneNumber(selectedMember.phone || "")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-orange-400" />
                      <span className="text-gray-600">이메일</span>
                      <span className="ml-auto font-medium">
                        {selectedMember.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-orange-400" />
                      <span className="text-gray-600">가입일</span>
                      <span className="ml-auto font-medium">
                        {formatDate(selectedMember.joinedDate)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 활동 통계 */}
              <Card className="border-orange-100">
                <CardContent className="p-4 space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    📊 활동 통계
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <Utensils className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-orange-600">
                        {selectedMember.activity?.mealCount || 0}
                      </p>
                      <p className="text-xs text-gray-500">식사 기록</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <Calendar className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedMember.activity?.scheduleCount || 0}
                      </p>
                      <p className="text-xs text-gray-500">일정 등록</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <Pill className="w-5 h-5 text-green-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-green-600">
                        {selectedMember.activity?.medicationCount || 0}
                      </p>
                      <p className="text-xs text-gray-500">투약 기록</p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3 text-center">
                      <Moon className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-indigo-600">
                        {selectedMember.activity?.sleepCount || 0}
                      </p>
                      <p className="text-xs text-gray-500">수면 기록</p>
                    </div>
                    <div className="bg-pink-50 rounded-lg p-3 text-center">
                      <Users className="w-5 h-5 text-pink-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-pink-600">
                        {selectedMember.activity?.communityCount || 0}
                      </p>
                      <p className="text-xs text-gray-500">커뮤니티</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <Activity className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-purple-600">
                        {getTotalActivity(selectedMember.activity)}
                      </p>
                      <p className="text-xs text-gray-500">총 활동</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 최근 활동 */}
              <Card className="border-orange-100">
                <CardContent className="p-4 space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    🕐 최근 활동
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedMember.activity?.lastActiveAt ? (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <Activity className="w-4 h-4 text-orange-400" />
                        <span className="text-gray-600">마지막 활동</span>
                        <span className="ml-auto text-gray-900">
                          {formatDate(selectedMember.activity.lastActiveAt)}
                        </span>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-400">
                        아직 활동 기록이 없습니다
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 액션 버튼 */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50"
                  onClick={() => {
                    if (selectedMember.phone) {
                      window.location.href = `tel:${selectedMember.phone}`;
                    } else {
                      toast.error("전화번호가 등록되지 않았습니다");
                    }
                  }}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  전화하기
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50"
                  onClick={() => {
                    window.location.href = `mailto:${selectedMember.email}`;
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  이메일
                </Button>
              </div>

              {/* 구성원 삭제 버튼 */}
              {!selectedMember.isOwner && (
                <Button
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                  onClick={() => handleOpenDeleteDialog(selectedMember)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  구성원에서 삭제
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="border-red-100 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              구성원 삭제
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
              <Avatar className="w-10 h-10">
                {/* ✨ [수정됨] profileImage -> avatarUrl */}
                {memberToDelete?.avatarUrl ? (
                  <AvatarImage
                    src={memberToDelete.avatarUrl}
                    alt={memberToDelete.name}
                  />
                ) : null}
                <AvatarFallback className="bg-red-100 text-red-600 font-medium">
                  {memberToDelete?.name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900">
                  {memberToDelete?.name}
                </p>
                <p className="text-sm text-gray-500">{memberToDelete?.email}</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>{memberToDelete?.name}</strong>님을 가족 구성원에서
                삭제하시겠습니까?
              </p>
              <ul className="text-xs text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                <li>삭제 후에도 해당 구성원의 기존 기록은 유지됩니다</li>
                <li>다시 초대하여 구성원으로 추가할 수 있습니다</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-gray-200"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setMemberToDelete(null);
                }}
                disabled={isDeleting}
              >
                취소
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                onClick={handleDeleteMember}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    삭제 중...
                  </span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    삭제하기
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 전체 활동 통계 (하단) */}
      {members.length > 0 && (
        <Card className="border-orange-100">
          <CardContent className="p-4">
            <h3 className="text-gray-900 font-semibold mb-3 flex items-center gap-2">
              📊 전체 활동 통계
            </h3>
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-2 border-b border-orange-50 last:border-0 cursor-pointer hover:bg-orange-50 rounded-lg px-2 -mx-2 transition-colors"
                  onClick={() => handleMemberClick(member)}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      {/* ✨ [수정됨] profileImage -> avatarUrl */}
                      {member.avatarUrl ? (
                        <AvatarImage src={member.avatarUrl} alt={member.name} />
                      ) : null}
                      <AvatarFallback className="bg-orange-100 text-orange-600 text-xs">
                        {member.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{member.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Utensils className="w-3 h-3 text-orange-400" />
                      <span className="text-orange-600 font-medium">
                        {member.activity?.mealCount || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-blue-400" />
                      <span className="text-blue-600 font-medium">
                        {member.activity?.scheduleCount || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Pill className="w-3 h-3 text-green-400" />
                      <span className="text-green-600 font-medium">
                        {member.activity?.medicationCount || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Moon className="w-3 h-3 text-indigo-400" />
                      <span className="text-indigo-600 font-medium">
                        {member.activity?.sleepCount || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-pink-400" />
                      <span className="text-pink-600 font-medium">
                        {member.activity?.communityCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-4 pt-3 border-t border-orange-100">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Utensils className="w-3 h-3 text-orange-400" />
                <span>식사</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3 text-blue-400" />
                <span>일정</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Pill className="w-3 h-3 text-green-400" />
                <span>투약</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Moon className="w-3 h-3 text-indigo-400" />
                <span>수면</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Users className="w-3 h-3 text-pink-400" />
                <span>커뮤니티</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
