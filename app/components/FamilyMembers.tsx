"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Mail,
  Phone,
  MoreVertical,
  UserPlus,
  Share2,
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

export function FamilyMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    loadMembers();
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

  const handleInvite = async () => {
    if (!inviteEmail) return;

    try {
      await apiClient.inviteMember(inviteEmail);
      toast.success(`${inviteEmail}로 초대 메일이 발송되었습니다!`);
      setInviteEmail("");
      setIsInviteDialogOpen(false);
    } catch (error) {
      console.error("Failed to invite member:", error);
      toast.error("초대에 실패했습니다");
    }
  };

  const handleCopyInviteLink = () => {
    const inviteLink = "https://ieumcare.app/invite/abc123";
    navigator.clipboard.writeText(inviteLink);
    toast.success("초대 링크가 복사되었습니다!");
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <h2>가족 구성원</h2>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              초대하기
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>가족 구성원 초대</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>이메일 주소</Label>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={handleInvite}>
                <Mail className="w-4 h-4 mr-2" />
                초대 메일 보내기
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">또는</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleCopyInviteLink}
              >
                <Share2 className="w-4 h-4 mr-2" />
                초대 링크 복사
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-100">
        <CardContent className="p-4">
          <p className="text-sm text-blue-900">
            💡 가족 구성원들과 함께 일정과 기록을 공유하세요. 초대받은 가족은
            이메일 링크를 통해 참여할 수 있습니다.
          </p>
        </CardContent>
      </Card>

      {/* Members List */}
      <div className="space-y-3">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {member.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-gray-900">{member.name}</h3>
                    {member.isOwner && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                        관리자
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <span>{member.email}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Statistics */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-gray-900 mb-3">활동 통계</h3>
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                      {member.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{member.name}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {Math.floor(Math.random() * 20) + 5}개 기록
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
