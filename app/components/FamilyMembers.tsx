"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  MoreVertical,
  UserPlus,
  Share2,
  Search,
  Bell,
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
import { Avatar, AvatarFallback } from "./ui/avatar";
import { apiClient } from "../utils/api";
import { toast } from "sonner";

interface Member {
  id: string;
  name: string;
  email: string;
  isOwner: boolean;
  joinedDate: string;
}

interface Invitation {
  id: string;
  fromUserName: string;
  fromUserEmail: string;
  diaryName: string;
  createdAt: string;
  status: "pending" | "accepted" | "declined";
}

export function FamilyMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isInvitationsDialogOpen, setIsInvitationsDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    loadMembers();
    loadInvitations();
  }, []);

  async function loadMembers() {
    try {
      const { data } = await apiClient.getFamilyMembers();
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
      await apiClient.sendInvitation(inviteEmail);
      toast.success(`${inviteEmail}님에게 초대를 보냈습니다!`);
      setInviteEmail("");
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

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "pending"
  );

  function getTimeAgo(createdAt: string) {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "방금 전";
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays === 1) return "어제";
    return `${diffDays}일 전`;
  }

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">가족 구성원</h2>
        <div className="flex items-center gap-2">
          {/* ✨ 받은 초대 버튼 */}
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
                {/* ✨ 알림 뱃지 */}
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
                                  new Date(invitation.created_at).getTime()) /
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

          {/* ✨ 초대하기 버튼 */}
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
                {/* ✨ 안내 문구 */}
                <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                  <p className="text-sm text-orange-800">
                    💡 초대할 가족의 이메일 주소를 입력하세요. 상대방이
                    이음케어에 가입되어 있어야 초대할 수 있습니다.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">이메일 주소</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
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
              className="border-orange-100 hover:border-orange-200 hover:shadow-md transition-all"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-orange-100 text-orange-600 font-medium">
                      {member.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-gray-900 font-medium">
                        {member.name}
                      </h3>
                      {member.isOwner && (
                        <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded font-medium">
                          관리자
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
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
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Statistics */}
      {members.length > 0 && (
        <Card className="border-orange-100">
          <CardContent className="p-4">
            <h3 className="text-gray-900 font-semibold mb-3 flex items-center gap-2">
              📊 활동 통계
            </h3>
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-2 border-b border-orange-50 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="bg-orange-100 text-orange-600 text-xs">
                        {member.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{member.name}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-orange-600 font-medium">
                      {Math.floor(Math.random() * 20) + 5}
                    </span>
                    <span className="text-gray-500">개 기록</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
