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
  ChevronRight,
  X,
  Clock,
  Image as ImageIcon,
  MessageCircle,
  Heart,
  BarChart3,
  User,
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
  avatarUrl?: string;
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

interface MealRecord {
  id: string;
  mealType: string;
  description: string;
  photoUrl?: string;
  createdAt: string;
}

interface ScheduleRecord {
  id: string;
  title: string;
  date: string;
  time?: string;
  description?: string;
  createdAt: string;
}

interface MedicationRecord {
  id: string;
  medicationName: string;
  dosage: string;
  takenAt: string;
  createdAt: string;
}

interface SleepRecord {
  id: string;
  sleepTime: string;
  wakeTime: string;
  quality: number;
  note?: string;
  createdAt: string;
}

interface CommunityRecord {
  id: string;
  title: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

interface FamilyMembersProps {
  fontScale?: number;
}

type ActivityType =
  | "meal"
  | "schedule"
  | "medication"
  | "sleep"
  | "community"
  | "total";

export function FamilyMembers({ fontScale = 1 }: FamilyMembersProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isInvitationsDialogOpen, setIsInvitationsDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isMemberDetailOpen, setIsMemberDetailOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isActivityDetailOpen, setIsActivityDetailOpen] = useState(false);
  const [selectedActivityType, setSelectedActivityType] =
    useState<ActivityType | null>(null);
  const [activityRecords, setActivityRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const [statsViewMode, setStatsViewMode] = useState<"individual" | "total">(
    "total"
  );

  // 스케일 헬퍼 함수들
  const getIconSize = (base: number) => base * fontScale;
  const getPadding = (base: number) => `${base * fontScale}rem`;
  const getFontSize = (base: number) => `${base * fontScale}rem`;
  const getGap = (base: number) => `${base * fontScale}rem`;
  const getSize = (base: number) => `${base * fontScale}rem`;

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

  const getTotalStats = () => {
    return members.reduce(
      (acc, member) => {
        return {
          mealCount: acc.mealCount + (member.activity?.mealCount || 0),
          scheduleCount:
            acc.scheduleCount + (member.activity?.scheduleCount || 0),
          medicationCount:
            acc.medicationCount + (member.activity?.medicationCount || 0),
          sleepCount: acc.sleepCount + (member.activity?.sleepCount || 0),
          communityCount:
            acc.communityCount + (member.activity?.communityCount || 0),
        };
      },
      {
        mealCount: 0,
        scheduleCount: 0,
        medicationCount: 0,
        sleepCount: 0,
        communityCount: 0,
      }
    );
  };

  const totalStats = getTotalStats();
  const grandTotal =
    totalStats.mealCount +
    totalStats.scheduleCount +
    totalStats.medicationCount +
    totalStats.sleepCount +
    totalStats.communityCount;

  const loadActivityRecords = async (memberId: string, type: ActivityType) => {
    setLoadingRecords(true);
    setActivityRecords([]);

    try {
      let data: any[] = [];

      switch (type) {
        case "meal":
          const mealResponse = await apiClient.getMemberMeals?.(memberId);
          data = mealResponse?.data || [];
          break;
        case "schedule":
          const scheduleResponse = await apiClient.getMemberSchedules?.(
            memberId
          );
          data = scheduleResponse?.data || [];
          break;
        case "medication":
          const medicationResponse = await apiClient.getMemberMedications?.(
            memberId
          );
          data = medicationResponse?.data || [];
          break;
        case "sleep":
          const sleepResponse = await apiClient.getMemberSleepRecords?.(
            memberId
          );
          data = sleepResponse?.data || [];
          break;
        case "community":
          const communityResponse = await apiClient.getMemberCommunityPosts?.(
            memberId
          );
          data = communityResponse?.data || [];
          break;
        case "total":
          const [meals, schedules, medications, sleeps, communities] =
            await Promise.all([
              apiClient.getMemberMeals?.(memberId).catch(() => ({ data: [] })),
              apiClient
                .getMemberSchedules?.(memberId)
                .catch(() => ({ data: [] })),
              apiClient
                .getMemberMedications?.(memberId)
                .catch(() => ({ data: [] })),
              apiClient
                .getMemberSleepRecords?.(memberId)
                .catch(() => ({ data: [] })),
              apiClient
                .getMemberCommunityPosts?.(memberId)
                .catch(() => ({ data: [] })),
            ]);

          data = [
            ...(meals?.data || []).map((item: any) => ({
              ...item,
              _type: "meal",
            })),
            ...(schedules?.data || []).map((item: any) => ({
              ...item,
              _type: "schedule",
            })),
            ...(medications?.data || []).map((item: any) => ({
              ...item,
              _type: "medication",
            })),
            ...(sleeps?.data || []).map((item: any) => ({
              ...item,
              _type: "sleep",
            })),
            ...(communities?.data || []).map((item: any) => ({
              ...item,
              _type: "community",
            })),
          ].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
      }

      setActivityRecords(data);
    } catch (error) {
      console.error("Failed to load activity records:", error);
      setActivityRecords(getSampleRecords(type));
    } finally {
      setLoadingRecords(false);
    }
  };

  const getSampleRecords = (type: ActivityType) => {
    const now = new Date();
    switch (type) {
      case "meal":
        return [
          {
            id: "1",
            mealType: "아침",
            description: "현미밥, 된장국, 계란프라이",
            createdAt: now.toISOString(),
          },
          {
            id: "2",
            mealType: "점심",
            description: "비빔밥, 미역국",
            createdAt: new Date(now.getTime() - 86400000).toISOString(),
          },
        ];
      case "schedule":
        return [
          {
            id: "1",
            title: "병원 정기 검진",
            date: "2025-01-15",
            time: "10:00",
            createdAt: now.toISOString(),
          },
          {
            id: "2",
            title: "물리치료",
            date: "2025-01-20",
            time: "14:00",
            createdAt: new Date(now.getTime() - 86400000).toISOString(),
          },
        ];
      case "medication":
        return [
          {
            id: "1",
            medicationName: "혈압약",
            dosage: "1정",
            takenAt: "08:00",
            createdAt: now.toISOString(),
          },
          {
            id: "2",
            medicationName: "비타민D",
            dosage: "1정",
            takenAt: "09:00",
            createdAt: now.toISOString(),
          },
        ];
      case "sleep":
        return [
          {
            id: "1",
            sleepTime: "22:30",
            wakeTime: "06:30",
            quality: 4,
            note: "숙면",
            createdAt: now.toISOString(),
          },
          {
            id: "2",
            sleepTime: "23:00",
            wakeTime: "07:00",
            quality: 3,
            note: "중간에 한번 깸",
            createdAt: new Date(now.getTime() - 86400000).toISOString(),
          },
        ];
      case "community":
        return [
          {
            id: "1",
            title: "오늘 산책 다녀왔어요",
            content: "날씨가 좋아서 공원에서 산책했습니다.",
            likesCount: 5,
            commentsCount: 3,
            createdAt: now.toISOString(),
          },
        ];
      default:
        return [];
    }
  };

  const handleActivityClick = (member: Member, type: ActivityType) => {
    const count =
      type === "total"
        ? getTotalActivity(member.activity)
        : member.activity?.[`${type}Count` as keyof MemberActivity] || 0;

    if (count === 0) {
      toast.info("아직 기록이 없습니다");
      return;
    }

    setSelectedActivityType(type);
    setIsActivityDetailOpen(true);
    loadActivityRecords(member.id, type);
  };

  const getActivityTypeInfo = (type: ActivityType) => {
    switch (type) {
      case "meal":
        return { icon: Utensils, label: "식사 기록", color: "orange" };
      case "schedule":
        return { icon: Calendar, label: "일정 등록", color: "blue" };
      case "medication":
        return { icon: Pill, label: "투약 기록", color: "green" };
      case "sleep":
        return { icon: Moon, label: "수면 기록", color: "indigo" };
      case "community":
        return { icon: Users, label: "커뮤니티", color: "pink" };
      case "total":
        return { icon: Activity, label: "전체 활동", color: "purple" };
    }
  };

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

      const response = await apiClient.uploadMemberPhoto(
        selectedMember.id,
        formData
      );

      const imageUrl = response.data;

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

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  const getMealTypeEmoji = (mealType: string) => {
    switch (mealType) {
      case "아침":
        return "🌅";
      case "점심":
        return "☀️";
      case "저녁":
        return "🌙";
      case "간식":
        return "🍪";
      default:
        return "🍽️";
    }
  };

  const getSleepQualityText = (quality: number) => {
    if (quality >= 4) return "😴 숙면";
    if (quality >= 3) return "😊 보통";
    if (quality >= 2) return "😐 나쁨";
    return "😫 매우 나쁨";
  };

  const renderActivityRecord = (record: any, type: ActivityType) => {
    const recordType = record._type || type;

    switch (recordType) {
      case "meal":
        return (
          <div
            className="flex items-start bg-orange-50 rounded-lg border border-orange-100"
            style={{ gap: getGap(0.75), padding: getPadding(0.75) }}
          >
            <div style={{ fontSize: getFontSize(1.5) }}>
              {getMealTypeEmoji(record.mealType)}
            </div>
            <div className="flex-1">
              <div className="flex items-center" style={{ gap: getGap(0.5) }}>
                <span
                  className="font-medium text-orange-700"
                  style={{ fontSize: getFontSize(0.875) }}
                >
                  {record.mealType}
                </span>
                <span
                  className="text-gray-400"
                  style={{ fontSize: getFontSize(0.75) }}
                >
                  {formatDateTime(record.createdAt)}
                </span>
              </div>
              <p
                className="text-gray-600"
                style={{
                  fontSize: getFontSize(0.875),
                  marginTop: getGap(0.25),
                }}
              >
                {record.description}
              </p>
              {record.photoUrl && (
                <div style={{ marginTop: getGap(0.5) }}>
                  <img
                    src={record.photoUrl}
                    alt="식사 사진"
                    className="object-cover rounded-lg"
                    style={{
                      width: getSize(5),
                      height: getSize(5),
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        );

      case "schedule":
        return (
          <div
            className="flex items-start bg-blue-50 rounded-lg border border-blue-100"
            style={{ gap: getGap(0.75), padding: getPadding(0.75) }}
          >
            <div
              className="bg-blue-100 rounded-lg flex items-center justify-center"
              style={{
                width: getSize(2.5),
                height: getSize(2.5),
              }}
            >
              <Calendar
                className="text-blue-600"
                style={{
                  width: getIconSize(20),
                  height: getIconSize(20),
                }}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center" style={{ gap: getGap(0.5) }}>
                <span
                  className="font-medium text-blue-700"
                  style={{ fontSize: getFontSize(0.875) }}
                >
                  {record.title}
                </span>
              </div>
              <div
                className="flex items-center text-gray-600"
                style={{
                  gap: getGap(0.5),
                  marginTop: getGap(0.25),
                  fontSize: getFontSize(0.875),
                }}
              >
                <Clock
                  style={{
                    width: getIconSize(12),
                    height: getIconSize(12),
                  }}
                />
                <span>
                  {record.date} {record.time && `${record.time}`}
                </span>
              </div>
              {record.description && (
                <p
                  className="text-gray-500"
                  style={{
                    fontSize: getFontSize(0.875),
                    marginTop: getGap(0.25),
                  }}
                >
                  {record.description}
                </p>
              )}
            </div>
          </div>
        );

      case "medication":
        return (
          <div
            className="flex items-start bg-green-50 rounded-lg border border-green-100"
            style={{ gap: getGap(0.75), padding: getPadding(0.75) }}
          >
            <div
              className="bg-green-100 rounded-lg flex items-center justify-center"
              style={{
                width: getSize(2.5),
                height: getSize(2.5),
              }}
            >
              <Pill
                className="text-green-600"
                style={{
                  width: getIconSize(20),
                  height: getIconSize(20),
                }}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center" style={{ gap: getGap(0.5) }}>
                <span
                  className="font-medium text-green-700"
                  style={{ fontSize: getFontSize(0.875) }}
                >
                  {record.medicationName}
                </span>
                <span
                  className="bg-green-200 text-green-800 rounded"
                  style={{
                    fontSize: getFontSize(0.75),
                    padding: `${0.125 * fontScale}rem ${0.5 * fontScale}rem`,
                  }}
                >
                  {record.dosage}
                </span>
              </div>
              <div
                className="flex items-center text-gray-600"
                style={{
                  gap: getGap(0.5),
                  marginTop: getGap(0.25),
                  fontSize: getFontSize(0.875),
                }}
              >
                <Clock
                  style={{
                    width: getIconSize(12),
                    height: getIconSize(12),
                  }}
                />
                <span>복용 시간: {record.takenAt}</span>
              </div>
            </div>
          </div>
        );

      case "sleep":
        return (
          <div
            className="flex items-start bg-indigo-50 rounded-lg border border-indigo-100"
            style={{ gap: getGap(0.75), padding: getPadding(0.75) }}
          >
            <div
              className="bg-indigo-100 rounded-lg flex items-center justify-center"
              style={{
                width: getSize(2.5),
                height: getSize(2.5),
              }}
            >
              <Moon
                className="text-indigo-600"
                style={{
                  width: getIconSize(20),
                  height: getIconSize(20),
                }}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center" style={{ gap: getGap(0.5) }}>
                <span
                  className="font-medium text-indigo-700"
                  style={{ fontSize: getFontSize(0.875) }}
                >
                  {record.sleepTime} ~ {record.wakeTime}
                </span>
                <span style={{ fontSize: getFontSize(0.75) }}>
                  {getSleepQualityText(record.quality)}
                </span>
              </div>
              {record.note && (
                <p
                  className="text-gray-600"
                  style={{
                    fontSize: getFontSize(0.875),
                    marginTop: getGap(0.25),
                  }}
                >
                  {record.note}
                </p>
              )}
            </div>
          </div>
        );

      case "community":
        return (
          <div
            className="flex items-start bg-pink-50 rounded-lg border border-pink-100"
            style={{ gap: getGap(0.75), padding: getPadding(0.75) }}
          >
            <div
              className="bg-pink-100 rounded-lg flex items-center justify-center"
              style={{
                width: getSize(2.5),
                height: getSize(2.5),
              }}
            >
              <MessageCircle
                className="text-pink-600"
                style={{
                  width: getIconSize(20),
                  height: getIconSize(20),
                }}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center" style={{ gap: getGap(0.5) }}>
                <span
                  className="font-medium text-pink-700"
                  style={{ fontSize: getFontSize(0.875) }}
                >
                  {record.title}
                </span>
              </div>
              <p
                className="text-gray-600 line-clamp-2"
                style={{
                  fontSize: getFontSize(0.875),
                  marginTop: getGap(0.25),
                }}
              >
                {record.content}
              </p>
              <div
                className="flex items-center text-gray-500"
                style={{
                  gap: getGap(0.75),
                  marginTop: getGap(0.5),
                  fontSize: getFontSize(0.75),
                }}
              >
                <span
                  className="flex items-center"
                  style={{ gap: getGap(0.25) }}
                >
                  <Heart
                    style={{
                      width: getIconSize(12),
                      height: getIconSize(12),
                    }}
                  />{" "}
                  {record.likesCount}
                </span>
                <span
                  className="flex items-center"
                  style={{ gap: getGap(0.25) }}
                >
                  <MessageCircle
                    style={{
                      width: getIconSize(12),
                      height: getIconSize(12),
                    }}
                  />{" "}
                  {record.commentsCount}
                </span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="pb-20 md:pb-6"
      style={{ display: "flex", flexDirection: "column", gap: getGap(1) }}
    >
      {/* 상단 헤더 및 초대 버튼들 */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold" style={{ fontSize: getFontSize(1.25) }}>
          가족 구성원
        </h2>
        <div className="flex items-center" style={{ gap: getGap(0.5) }}>
          {/* 받은 초대 버튼 */}
          <Dialog
            open={isInvitationsDialogOpen}
            onOpenChange={setIsInvitationsDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="relative border-orange-200 text-orange-600 hover:bg-orange-50"
                style={{
                  fontSize: getFontSize(0.875),
                  padding: `${0.5 * fontScale}rem ${1 * fontScale}rem`,
                }}
              >
                <Bell
                  style={{
                    width: getIconSize(16),
                    height: getIconSize(16),
                    marginRight: 8 * fontScale,
                  }}
                />
                받은 초대
                {pendingInvitations.length > 0 && (
                  <span
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full flex items-center justify-center"
                    style={{
                      width: getSize(1.25),
                      height: getSize(1.25),
                      fontSize: getFontSize(0.75),
                    }}
                  >
                    {pendingInvitations.length}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="border-orange-100">
              <DialogHeader>
                <DialogTitle style={{ fontSize: getFontSize(1.125) }}>
                  📬 받은 초대
                </DialogTitle>
              </DialogHeader>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: getGap(0.75),
                  marginTop: getGap(1),
                }}
              >
                {pendingInvitations.length === 0 ? (
                  <div
                    className="text-center text-gray-500"
                    style={{ padding: getPadding(2) }}
                  >
                    <Bell
                      className="mx-auto text-orange-200"
                      style={{
                        width: getIconSize(48),
                        height: getIconSize(48),
                        marginBottom: getGap(0.75),
                      }}
                    />
                    <p style={{ fontSize: getFontSize(0.875) }}>
                      받은 초대가 없습니다
                    </p>
                  </div>
                ) : (
                  pendingInvitations.map((invitation) => (
                    <Card key={invitation.id} className="border-orange-100">
                      <CardContent style={{ padding: getPadding(1) }}>
                        <div
                          className="flex items-start"
                          style={{ gap: getGap(0.75) }}
                        >
                          <Avatar
                            style={{
                              width: getSize(2.5),
                              height: getSize(2.5),
                            }}
                          >
                            <AvatarFallback
                              className="bg-orange-100 text-orange-600"
                              style={{ fontSize: getFontSize(0.875) }}
                            >
                              {(invitation.sender_email ||
                                invitation.fromUserName ||
                                "?")[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p style={{ fontSize: getFontSize(0.875) }}>
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
                            <p
                              className="text-gray-400"
                              style={{
                                fontSize: getFontSize(0.75),
                                marginTop: getGap(0.25),
                              }}
                            >
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
                            <div
                              className="flex"
                              style={{
                                gap: getGap(0.5),
                                marginTop: getGap(0.75),
                              }}
                            >
                              <Button
                                size="sm"
                                className="bg-orange-500 hover:bg-orange-600"
                                onClick={() =>
                                  handleAcceptInvitation(invitation.id)
                                }
                                style={{
                                  fontSize: getFontSize(0.875),
                                  padding: `${0.375 * fontScale}rem ${
                                    0.75 * fontScale
                                  }rem`,
                                }}
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
                                style={{
                                  fontSize: getFontSize(0.875),
                                  padding: `${0.375 * fontScale}rem ${
                                    0.75 * fontScale
                                  }rem`,
                                }}
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
              <Button
                className="bg-orange-500 hover:bg-orange-600"
                style={{
                  fontSize: getFontSize(0.875),
                  padding: `${0.5 * fontScale}rem ${1 * fontScale}rem`,
                }}
              >
                <UserPlus
                  style={{
                    width: getIconSize(16),
                    height: getIconSize(16),
                    marginRight: 8 * fontScale,
                  }}
                />
                초대하기
              </Button>
            </DialogTrigger>
            <DialogContent className="border-orange-100">
              <DialogHeader>
                <DialogTitle style={{ fontSize: getFontSize(1.125) }}>
                  👨‍👩‍👧‍👦 가족 구성원 초대
                </DialogTitle>
              </DialogHeader>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: getGap(1),
                  marginTop: getGap(1),
                }}
              >
                <div
                  className="bg-orange-50 border border-orange-100 rounded-lg"
                  style={{ padding: getPadding(0.75) }}
                >
                  <p
                    className="text-orange-800"
                    style={{ fontSize: getFontSize(0.875) }}
                  >
                    💡 초대할 가족의 정보를 입력하세요. 이메일은 필수이며,
                    상대방이 이음케어에 가입되어 있어야 초대할 수 있습니다.
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: getGap(0.5),
                  }}
                >
                  <Label
                    className="text-gray-700"
                    style={{ fontSize: getFontSize(0.875) }}
                  >
                    이름
                  </Label>
                  <Input
                    type="text"
                    placeholder="홍길동"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                    style={{ fontSize: getFontSize(0.875) }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: getGap(0.5),
                  }}
                >
                  <Label
                    className="text-gray-700"
                    style={{ fontSize: getFontSize(0.875) }}
                  >
                    전화번호
                  </Label>
                  <div className="relative">
                    <Phone
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400"
                      style={{
                        width: getIconSize(16),
                        height: getIconSize(16),
                      }}
                    />
                    <Input
                      type="tel"
                      placeholder="010-1234-5678"
                      value={invitePhone}
                      onChange={(e) => setInvitePhone(e.target.value)}
                      className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                      style={{
                        fontSize: getFontSize(0.875),
                        paddingLeft: `${2.5 * fontScale}rem`,
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: getGap(0.5),
                  }}
                >
                  <Label
                    className="text-gray-700"
                    style={{ fontSize: getFontSize(0.875) }}
                  >
                    이메일 주소 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400"
                      style={{
                        width: getIconSize(16),
                        height: getIconSize(16),
                      }}
                    />
                    <Input
                      type="email"
                      placeholder="example@email.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                      style={{
                        fontSize: getFontSize(0.875),
                        paddingLeft: `${2.5 * fontScale}rem`,
                      }}
                    />
                  </div>
                </div>
                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  onClick={handleInvite}
                  disabled={searchLoading || !inviteEmail}
                  style={{
                    fontSize: getFontSize(0.875),
                    padding: `${0.625 * fontScale}rem`,
                  }}
                >
                  {searchLoading ? (
                    <span
                      className="flex items-center"
                      style={{ gap: getGap(0.5) }}
                    >
                      <span className="animate-spin">⏳</span> 초대 보내는 중...
                    </span>
                  ) : (
                    <>
                      <UserPlus
                        style={{
                          width: getIconSize(16),
                          height: getIconSize(16),
                          marginRight: 8 * fontScale,
                        }}
                      />
                      초대 보내기
                    </>
                  )}
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-orange-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span
                      className="bg-white text-gray-500"
                      style={{
                        fontSize: getFontSize(0.75),
                        padding: `0 ${0.5 * fontScale}rem`,
                      }}
                    >
                      또는
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
                  onClick={handleCopyInviteLink}
                  style={{
                    fontSize: getFontSize(0.875),
                    padding: `${0.625 * fontScale}rem`,
                  }}
                >
                  <Share2
                    style={{
                      width: getIconSize(16),
                      height: getIconSize(16),
                      marginRight: 8 * fontScale,
                    }}
                  />
                  초대 링크 복사
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-orange-50 border-orange-100">
        <CardContent style={{ padding: getPadding(1) }}>
          <p
            className="text-orange-800"
            style={{ fontSize: getFontSize(0.875) }}
          >
            🧡 가족 구성원들과 함께 일정과 기록을 공유하세요. 초대를 보내면
            상대방의 <strong>'받은 초대'</strong>에서 확인할 수 있습니다.
          </p>
        </CardContent>
      </Card>

      {/* Members List */}
      <div
        style={{ display: "flex", flexDirection: "column", gap: getGap(0.75) }}
      >
        {loading ? (
          <div className="text-center" style={{ padding: getPadding(2) }}>
            <div
              className="animate-spin rounded-full border-b-2 border-orange-500 mx-auto"
              style={{
                width: getSize(2),
                height: getSize(2),
                marginBottom: getGap(0.5),
              }}
            ></div>
            <p
              className="text-gray-500"
              style={{ fontSize: getFontSize(0.875) }}
            >
              로딩 중...
            </p>
          </div>
        ) : members.length === 0 ? (
          <Card className="border-orange-100">
            <CardContent
              className="text-center text-gray-500"
              style={{
                padding: getPadding(2),
                fontSize: getFontSize(1),
              }}
            >
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
              <CardContent style={{ padding: getPadding(1) }}>
                <div className="flex items-center" style={{ gap: getGap(1) }}>
                  <Avatar
                    style={{
                      width: getSize(3),
                      height: getSize(3),
                    }}
                  >
                    {member.avatarUrl ? (
                      <AvatarImage src={member.avatarUrl} alt={member.name} />
                    ) : null}
                    <AvatarFallback
                      className="bg-orange-100 text-orange-600 font-medium"
                      style={{ fontSize: getFontSize(1) }}
                    >
                      {member.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div
                      className="flex items-center"
                      style={{ gap: getGap(0.5) }}
                    >
                      <h3
                        className="text-gray-900 font-semibold"
                        style={{ fontSize: getFontSize(1) }}
                      >
                        {member.name}
                      </h3>
                      {member.isOwner && (
                        <span
                          className="bg-orange-100 text-orange-700 rounded font-medium"
                          style={{
                            fontSize: getFontSize(0.75),
                            padding: `${0.125 * fontScale}rem ${
                              0.5 * fontScale
                            }rem`,
                          }}
                        >
                          관리자
                        </span>
                      )}
                    </div>
                    <div
                      className="flex flex-col text-gray-500"
                      style={{
                        gap: getGap(0.25),
                        marginTop: getGap(0.375),
                        fontSize: getFontSize(0.875),
                      }}
                    >
                      <div
                        className="flex items-center"
                        style={{ gap: getGap(0.25) }}
                      >
                        <Phone
                          className="text-orange-400"
                          style={{
                            width: getIconSize(12),
                            height: getIconSize(12),
                          }}
                        />
                        <span>{formatPhoneNumber(member.phone || "")}</span>
                      </div>
                      <div
                        className="flex items-center"
                        style={{ gap: getGap(0.25) }}
                      >
                        <Mail
                          className="text-orange-400"
                          style={{
                            width: getIconSize(12),
                            height: getIconSize(12),
                          }}
                        />
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
                    style={{
                      width: getSize(2.5),
                      height: getSize(2.5),
                    }}
                  >
                    <MoreVertical
                      style={{
                        width: getIconSize(16),
                        height: getIconSize(16),
                      }}
                    />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 구성원 상세 정보 모달 */}
      <Dialog open={isMemberDetailOpen} onOpenChange={setIsMemberDetailOpen}>
        <DialogContent className="border-orange-100 max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle
              className="flex items-center"
              style={{ gap: getGap(0.75) }}
            >
              <div className="relative group">
                <Avatar
                  style={{
                    width: getSize(3.5),
                    height: getSize(3.5),
                  }}
                >
                  {selectedMember?.avatarUrl ? (
                    <AvatarImage
                      src={selectedMember.avatarUrl}
                      alt={selectedMember.name}
                    />
                  ) : null}
                  <AvatarFallback
                    className="bg-orange-100 text-orange-600 font-medium"
                    style={{ fontSize: getFontSize(1.125) }}
                  >
                    {selectedMember?.name[0]}
                  </AvatarFallback>
                </Avatar>
                <button
                  className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? (
                    <div
                      className="animate-spin rounded-full border-2 border-white border-t-transparent"
                      style={{
                        width: getSize(1.25),
                        height: getSize(1.25),
                      }}
                    />
                  ) : (
                    <Camera
                      className="text-white"
                      style={{
                        width: getIconSize(20),
                        height: getIconSize(20),
                      }}
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
              <div>
                <div className="flex items-center" style={{ gap: getGap(0.5) }}>
                  <span style={{ fontSize: getFontSize(1.125) }}>
                    {selectedMember?.name}
                  </span>
                  {selectedMember?.isOwner && (
                    <span
                      className="bg-orange-100 text-orange-700 rounded font-medium"
                      style={{
                        fontSize: getFontSize(0.75),
                        padding: `${0.125 * fontScale}rem ${
                          0.5 * fontScale
                        }rem`,
                      }}
                    >
                      관리자
                    </span>
                  )}
                </div>
                <p
                  className="font-normal text-gray-500"
                  style={{ fontSize: getFontSize(0.875) }}
                >
                  {getLastActiveText(
                    selectedMember?.activity?.lastActiveAt || null
                  )}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedMember && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: getGap(1),
                marginTop: getGap(1),
              }}
            >
              {/* 기본 정보 */}
              <Card className="border-orange-100">
                <CardContent
                  style={{
                    padding: getPadding(1),
                    display: "flex",
                    flexDirection: "column",
                    gap: getGap(0.75),
                  }}
                >
                  <h4
                    className="font-semibold text-gray-900 flex items-center"
                    style={{
                      fontSize: getFontSize(1),
                      gap: getGap(0.5),
                    }}
                  >
                    📋 기본 정보
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: getGap(0.5),
                    }}
                  >
                    <div
                      className="flex items-center"
                      style={{
                        gap: getGap(0.75),
                        fontSize: getFontSize(0.875),
                      }}
                    >
                      <Phone
                        className="text-orange-400"
                        style={{
                          width: getIconSize(16),
                          height: getIconSize(16),
                        }}
                      />
                      <span className="text-gray-600">전화번호</span>
                      <span className="ml-auto font-medium">
                        {formatPhoneNumber(selectedMember.phone || "")}
                      </span>
                    </div>
                    <div
                      className="flex items-center"
                      style={{
                        gap: getGap(0.75),
                        fontSize: getFontSize(0.875),
                      }}
                    >
                      <Mail
                        className="text-orange-400"
                        style={{
                          width: getIconSize(16),
                          height: getIconSize(16),
                        }}
                      />
                      <span className="text-gray-600">이메일</span>
                      <span className="ml-auto font-medium">
                        {selectedMember.email}
                      </span>
                    </div>
                    <div
                      className="flex items-center"
                      style={{
                        gap: getGap(0.75),
                        fontSize: getFontSize(0.875),
                      }}
                    >
                      <Calendar
                        className="text-orange-400"
                        style={{
                          width: getIconSize(16),
                          height: getIconSize(16),
                        }}
                      />
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
                <CardContent
                  style={{
                    padding: getPadding(1),
                    display: "flex",
                    flexDirection: "column",
                    gap: getGap(0.75),
                  }}
                >
                  <h4
                    className="font-semibold text-gray-900 flex items-center"
                    style={{
                      fontSize: getFontSize(1),
                      gap: getGap(0.5),
                    }}
                  >
                    📊 활동 통계
                    <span
                      className="font-normal text-gray-400"
                      style={{ fontSize: getFontSize(0.75) }}
                    >
                      클릭하여 상세 보기
                    </span>
                  </h4>
                  <div
                    className="grid grid-cols-3"
                    style={{ gap: getGap(0.75) }}
                  >
                    {/* 식사 기록 */}
                    <button
                      className="bg-orange-50 rounded-lg text-center hover:bg-orange-100 transition-colors group"
                      style={{ padding: getPadding(0.75) }}
                      onClick={() =>
                        handleActivityClick(selectedMember, "meal")
                      }
                    >
                      <Utensils
                        className="text-orange-500 mx-auto group-hover:scale-110 transition-transform"
                        style={{
                          width: getIconSize(20),
                          height: getIconSize(20),
                          marginBottom: getGap(0.25),
                        }}
                      />
                      <p
                        className="font-bold text-orange-600"
                        style={{ fontSize: getFontSize(1.5) }}
                      >
                        {selectedMember.activity?.mealCount || 0}
                      </p>
                      <p
                        className="text-gray-500"
                        style={{ fontSize: getFontSize(0.75) }}
                      >
                        식사 기록
                      </p>
                      <ChevronRight
                        className="text-orange-400 mx-auto opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{
                          width: getIconSize(12),
                          height: getIconSize(12),
                          marginTop: getGap(0.25),
                        }}
                      />
                    </button>

                    {/* 일정 등록 */}
                    <button
                      className="bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition-colors group"
                      style={{ padding: getPadding(0.75) }}
                      onClick={() =>
                        handleActivityClick(selectedMember, "schedule")
                      }
                    >
                      <Calendar
                        className="text-blue-500 mx-auto group-hover:scale-110 transition-transform"
                        style={{
                          width: getIconSize(20),
                          height: getIconSize(20),
                          marginBottom: getGap(0.25),
                        }}
                      />
                      <p
                        className="font-bold text-blue-600"
                        style={{ fontSize: getFontSize(1.5) }}
                      >
                        {selectedMember.activity?.scheduleCount || 0}
                      </p>
                      <p
                        className="text-gray-500"
                        style={{ fontSize: getFontSize(0.75) }}
                      >
                        일정 등록
                      </p>
                      <ChevronRight
                        className="text-blue-400 mx-auto opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{
                          width: getIconSize(12),
                          height: getIconSize(12),
                          marginTop: getGap(0.25),
                        }}
                      />
                    </button>

                    {/* 투약 기록 */}
                    <button
                      className="bg-green-50 rounded-lg text-center hover:bg-green-100 transition-colors group"
                      style={{ padding: getPadding(0.75) }}
                      onClick={() =>
                        handleActivityClick(selectedMember, "medication")
                      }
                    >
                      <Pill
                        className="text-green-500 mx-auto group-hover:scale-110 transition-transform"
                        style={{
                          width: getIconSize(20),
                          height: getIconSize(20),
                          marginBottom: getGap(0.25),
                        }}
                      />
                      <p
                        className="font-bold text-green-600"
                        style={{ fontSize: getFontSize(1.5) }}
                      >
                        {selectedMember.activity?.medicationCount || 0}
                      </p>
                      <p
                        className="text-gray-500"
                        style={{ fontSize: getFontSize(0.75) }}
                      >
                        투약 기록
                      </p>
                      <ChevronRight
                        className="text-green-400 mx-auto opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{
                          width: getIconSize(12),
                          height: getIconSize(12),
                          marginTop: getGap(0.25),
                        }}
                      />
                    </button>

                    {/* 수면 기록 */}
                    <button
                      className="bg-indigo-50 rounded-lg text-center hover:bg-indigo-100 transition-colors group"
                      style={{ padding: getPadding(0.75) }}
                      onClick={() =>
                        handleActivityClick(selectedMember, "sleep")
                      }
                    >
                      <Moon
                        className="text-indigo-500 mx-auto group-hover:scale-110 transition-transform"
                        style={{
                          width: getIconSize(20),
                          height: getIconSize(20),
                          marginBottom: getGap(0.25),
                        }}
                      />
                      <p
                        className="font-bold text-indigo-600"
                        style={{ fontSize: getFontSize(1.5) }}
                      >
                        {selectedMember.activity?.sleepCount || 0}
                      </p>
                      <p
                        className="text-gray-500"
                        style={{ fontSize: getFontSize(0.75) }}
                      >
                        수면 기록
                      </p>
                      <ChevronRight
                        className="text-indigo-400 mx-auto opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{
                          width: getIconSize(12),
                          height: getIconSize(12),
                          marginTop: getGap(0.25),
                        }}
                      />
                    </button>

                    {/* 커뮤니티 */}
                    <button
                      className="bg-pink-50 rounded-lg text-center hover:bg-pink-100 transition-colors group"
                      style={{ padding: getPadding(0.75) }}
                      onClick={() =>
                        handleActivityClick(selectedMember, "community")
                      }
                    >
                      <Users
                        className="text-pink-500 mx-auto group-hover:scale-110 transition-transform"
                        style={{
                          width: getIconSize(20),
                          height: getIconSize(20),
                          marginBottom: getGap(0.25),
                        }}
                      />
                      <p
                        className="font-bold text-pink-600"
                        style={{ fontSize: getFontSize(1.5) }}
                      >
                        {selectedMember.activity?.communityCount || 0}
                      </p>
                      <p
                        className="text-gray-500"
                        style={{ fontSize: getFontSize(0.75) }}
                      >
                        커뮤니티
                      </p>
                      <ChevronRight
                        className="text-pink-400 mx-auto opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{
                          width: getIconSize(12),
                          height: getIconSize(12),
                          marginTop: getGap(0.25),
                        }}
                      />
                    </button>

                    {/* 총 활동 */}
                    <button
                      className="bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition-colors group"
                      style={{ padding: getPadding(0.75) }}
                      onClick={() =>
                        handleActivityClick(selectedMember, "total")
                      }
                    >
                      <Activity
                        className="text-purple-500 mx-auto group-hover:scale-110 transition-transform"
                        style={{
                          width: getIconSize(20),
                          height: getIconSize(20),
                          marginBottom: getGap(0.25),
                        }}
                      />
                      <p
                        className="font-bold text-purple-600"
                        style={{ fontSize: getFontSize(1.5) }}
                      >
                        {getTotalActivity(selectedMember.activity)}
                      </p>
                      <p
                        className="text-gray-500"
                        style={{ fontSize: getFontSize(0.75) }}
                      >
                        총 활동
                      </p>
                      <ChevronRight
                        className="text-purple-400 mx-auto opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{
                          width: getIconSize(12),
                          height: getIconSize(12),
                          marginTop: getGap(0.25),
                        }}
                      />
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* 최근 활동 */}
              <Card className="border-orange-100">
                <CardContent
                  style={{
                    padding: getPadding(1),
                    display: "flex",
                    flexDirection: "column",
                    gap: getGap(0.75),
                  }}
                >
                  <h4
                    className="font-semibold text-gray-900 flex items-center"
                    style={{
                      fontSize: getFontSize(1),
                      gap: getGap(0.5),
                    }}
                  >
                    🕐 최근 활동
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: getGap(0.5),
                      fontSize: getFontSize(0.875),
                    }}
                  >
                    {selectedMember.activity?.lastActiveAt ? (
                      <div
                        className="flex items-center bg-gray-50 rounded-lg"
                        style={{
                          gap: getGap(0.5),
                          padding: getPadding(0.5),
                        }}
                      >
                        <Activity
                          className="text-orange-400"
                          style={{
                            width: getIconSize(16),
                            height: getIconSize(16),
                          }}
                        />
                        <span className="text-gray-600">마지막 활동</span>
                        <span className="ml-auto text-gray-900">
                          {formatDate(selectedMember.activity.lastActiveAt)}
                        </span>
                      </div>
                    ) : (
                      <div
                        className="text-center text-gray-400"
                        style={{ padding: getPadding(1) }}
                      >
                        아직 활동 기록이 없습니다
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 액션 버튼 */}
              <div className="flex" style={{ gap: getGap(0.5) }}>
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
                  style={{
                    fontSize: getFontSize(0.875),
                    padding: `${0.625 * fontScale}rem`,
                  }}
                >
                  <Phone
                    style={{
                      width: getIconSize(16),
                      height: getIconSize(16),
                      marginRight: 8 * fontScale,
                    }}
                  />
                  전화하기
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50"
                  onClick={() => {
                    window.location.href = `mailto:${selectedMember.email}`;
                  }}
                  style={{
                    fontSize: getFontSize(0.875),
                    padding: `${0.625 * fontScale}rem`,
                  }}
                >
                  <Mail
                    style={{
                      width: getIconSize(16),
                      height: getIconSize(16),
                      marginRight: 8 * fontScale,
                    }}
                  />
                  이메일
                </Button>
              </div>

              {/* 구성원 삭제 버튼 */}
              {!selectedMember.isOwner && (
                <Button
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                  onClick={() => handleOpenDeleteDialog(selectedMember)}
                  style={{
                    fontSize: getFontSize(0.875),
                    padding: `${0.625 * fontScale}rem`,
                  }}
                >
                  <Trash2
                    style={{
                      width: getIconSize(16),
                      height: getIconSize(16),
                      marginRight: 8 * fontScale,
                    }}
                  />
                  구성원에서 삭제
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 활동 상세 보기 모달 */}
      <Dialog
        open={isActivityDetailOpen}
        onOpenChange={setIsActivityDetailOpen}
      >
        <DialogContent className="border-orange-100 max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle
              className="flex items-center"
              style={{ gap: getGap(0.5) }}
            >
              {selectedActivityType && (
                <>
                  {(() => {
                    const info = getActivityTypeInfo(selectedActivityType);
                    const Icon = info.icon;
                    return (
                      <>
                        <div
                          className={`bg-${info.color}-100 rounded-lg flex items-center justify-center`}
                          style={{
                            width: getSize(2),
                            height: getSize(2),
                          }}
                        >
                          <Icon
                            className={`text-${info.color}-600`}
                            style={{
                              width: getIconSize(16),
                              height: getIconSize(16),
                            }}
                          />
                        </div>
                        <span style={{ fontSize: getFontSize(1.125) }}>
                          {selectedMember?.name}님의 {info.label}
                        </span>
                      </>
                    );
                  })()}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div
            className="flex-1 overflow-y-auto"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: getGap(0.75),
              marginTop: getGap(1),
            }}
          >
            {loadingRecords ? (
              <div className="text-center" style={{ padding: getPadding(2) }}>
                <div
                  className="animate-spin rounded-full border-b-2 border-orange-500 mx-auto"
                  style={{
                    width: getSize(2),
                    height: getSize(2),
                    marginBottom: getGap(0.5),
                  }}
                ></div>
                <p
                  className="text-gray-500"
                  style={{ fontSize: getFontSize(0.875) }}
                >
                  기록을 불러오는 중...
                </p>
              </div>
            ) : activityRecords.length === 0 ? (
              <div
                className="text-center text-gray-500"
                style={{ padding: getPadding(2) }}
              >
                <Activity
                  className="mx-auto text-gray-200"
                  style={{
                    width: getIconSize(48),
                    height: getIconSize(48),
                    marginBottom: getGap(0.75),
                  }}
                />
                <p style={{ fontSize: getFontSize(0.875) }}>
                  아직 기록이 없습니다
                </p>
              </div>
            ) : (
              activityRecords.map((record) => (
                <div key={record.id}>
                  {renderActivityRecord(record, selectedActivityType!)}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="border-red-100 max-w-sm">
          <DialogHeader>
            <DialogTitle
              className="flex items-center text-red-600"
              style={{ gap: getGap(0.5), fontSize: getFontSize(1.125) }}
            >
              <AlertTriangle
                style={{
                  width: getIconSize(20),
                  height: getIconSize(20),
                }}
              />
              구성원 삭제
            </DialogTitle>
          </DialogHeader>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: getGap(1),
              marginTop: getGap(1),
            }}
          >
            <div
              className="flex items-center bg-red-50 rounded-lg border border-red-100"
              style={{ gap: getGap(0.75), padding: getPadding(0.75) }}
            >
              <Avatar
                style={{
                  width: getSize(2.5),
                  height: getSize(2.5),
                }}
              >
                {memberToDelete?.avatarUrl ? (
                  <AvatarImage
                    src={memberToDelete.avatarUrl}
                    alt={memberToDelete.name}
                  />
                ) : null}
                <AvatarFallback
                  className="bg-red-100 text-red-600 font-medium"
                  style={{ fontSize: getFontSize(0.875) }}
                >
                  {memberToDelete?.name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p
                  className="font-medium text-gray-900"
                  style={{ fontSize: getFontSize(0.875) }}
                >
                  {memberToDelete?.name}
                </p>
                <p
                  className="text-gray-500"
                  style={{ fontSize: getFontSize(0.75) }}
                >
                  {memberToDelete?.email}
                </p>
              </div>
            </div>

            <div
              className="bg-yellow-50 border border-yellow-200 rounded-lg"
              style={{ padding: getPadding(0.75) }}
            >
              <p
                className="text-yellow-800"
                style={{ fontSize: getFontSize(0.875) }}
              >
                ⚠️ <strong>{memberToDelete?.name}</strong>님을 가족 구성원에서
                삭제하시겠습니까?
              </p>
              <ul
                className="text-yellow-700 list-disc list-inside"
                style={{
                  fontSize: getFontSize(0.75),
                  marginTop: getGap(0.5),
                  display: "flex",
                  flexDirection: "column",
                  gap: getGap(0.25),
                }}
              >
                <li>삭제 후에도 해당 구성원의 기존 기록은 유지됩니다</li>
                <li>다시 초대하여 구성원으로 추가할 수 있습니다</li>
              </ul>
            </div>

            <div className="flex" style={{ gap: getGap(0.5) }}>
              <Button
                variant="outline"
                className="flex-1 border-gray-200"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setMemberToDelete(null);
                }}
                disabled={isDeleting}
                style={{
                  fontSize: getFontSize(0.875),
                  padding: `${0.625 * fontScale}rem`,
                }}
              >
                취소
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                onClick={handleDeleteMember}
                disabled={isDeleting}
                style={{
                  fontSize: getFontSize(0.875),
                  padding: `${0.625 * fontScale}rem`,
                }}
              >
                {isDeleting ? (
                  <span
                    className="flex items-center"
                    style={{ gap: getGap(0.5) }}
                  >
                    <div
                      className="animate-spin rounded-full border-2 border-white border-t-transparent"
                      style={{
                        width: getSize(1),
                        height: getSize(1),
                      }}
                    />
                    삭제 중...
                  </span>
                ) : (
                  <>
                    <Trash2
                      style={{
                        width: getIconSize(16),
                        height: getIconSize(16),
                        marginRight: 8 * fontScale,
                      }}
                    />
                    삭제하기
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 전체 활동 통계 (하단) - 개선된 버전 */}
      {members.length > 0 && (
        <Card className="border-orange-100">
          <CardContent style={{ padding: getPadding(1) }}>
            {/* 헤더 + 토글 */}
            <div
              className="flex items-center justify-between"
              style={{ marginBottom: getGap(1) }}
            >
              <h3
                className="text-gray-900 font-semibold flex items-center"
                style={{ fontSize: getFontSize(1), gap: getGap(0.5) }}
              >
                📊 활동 통계
              </h3>
              <div
                className="flex bg-gray-100 rounded-lg"
                style={{ padding: getPadding(0.25) }}
              >
                <button
                  className={`rounded-md transition-colors ${
                    statsViewMode === "total"
                      ? "bg-white text-orange-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  style={{
                    padding: `${0.375 * fontScale}rem ${0.75 * fontScale}rem`,
                    fontSize: getFontSize(0.75),
                  }}
                  onClick={() => setStatsViewMode("total")}
                >
                  <BarChart3
                    style={{
                      width: getIconSize(12),
                      height: getIconSize(12),
                      display: "inline",
                      marginRight: 4 * fontScale,
                    }}
                  />
                  전체 합산
                </button>
                <button
                  className={`rounded-md transition-colors ${
                    statsViewMode === "individual"
                      ? "bg-white text-orange-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  style={{
                    padding: `${0.375 * fontScale}rem ${0.75 * fontScale}rem`,
                    fontSize: getFontSize(0.75),
                  }}
                  onClick={() => setStatsViewMode("individual")}
                >
                  <User
                    style={{
                      width: getIconSize(12),
                      height: getIconSize(12),
                      display: "inline",
                      marginRight: 4 * fontScale,
                    }}
                  />
                  개인별
                </button>
              </div>
            </div>

            {/* 전체 합산 통계 */}
            {statsViewMode === "total" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: getGap(1),
                }}
              >
                {/* 전체 합산 숫자 카드 */}
                <div className="grid grid-cols-3" style={{ gap: getGap(0.5) }}>
                  <div
                    className="bg-orange-50 rounded-lg text-center"
                    style={{ padding: getPadding(0.75) }}
                  >
                    <Utensils
                      className="text-orange-500 mx-auto"
                      style={{
                        width: getIconSize(16),
                        height: getIconSize(16),
                        marginBottom: getGap(0.25),
                      }}
                    />
                    <p
                      className="font-bold text-orange-600"
                      style={{ fontSize: getFontSize(1.25) }}
                    >
                      {totalStats.mealCount}
                    </p>
                    <p
                      className="text-gray-500"
                      style={{ fontSize: getFontSize(0.75) }}
                    >
                      식사
                    </p>
                  </div>
                  <div
                    className="bg-blue-50 rounded-lg text-center"
                    style={{ padding: getPadding(0.75) }}
                  >
                    <Calendar
                      className="text-blue-500 mx-auto"
                      style={{
                        width: getIconSize(16),
                        height: getIconSize(16),
                        marginBottom: getGap(0.25),
                      }}
                    />
                    <p
                      className="font-bold text-blue-600"
                      style={{ fontSize: getFontSize(1.25) }}
                    >
                      {totalStats.scheduleCount}
                    </p>
                    <p
                      className="text-gray-500"
                      style={{ fontSize: getFontSize(0.75) }}
                    >
                      일정
                    </p>
                  </div>
                  <div
                    className="bg-green-50 rounded-lg text-center"
                    style={{ padding: getPadding(0.75) }}
                  >
                    <Pill
                      className="text-green-500 mx-auto"
                      style={{
                        width: getIconSize(16),
                        height: getIconSize(16),
                        marginBottom: getGap(0.25),
                      }}
                    />
                    <p
                      className="font-bold text-green-600"
                      style={{ fontSize: getFontSize(1.25) }}
                    >
                      {totalStats.medicationCount}
                    </p>
                    <p
                      className="text-gray-500"
                      style={{ fontSize: getFontSize(0.75) }}
                    >
                      투약
                    </p>
                  </div>
                  <div
                    className="bg-indigo-50 rounded-lg text-center"
                    style={{ padding: getPadding(0.75) }}
                  >
                    <Moon
                      className="text-indigo-500 mx-auto"
                      style={{
                        width: getIconSize(16),
                        height: getIconSize(16),
                        marginBottom: getGap(0.25),
                      }}
                    />
                    <p
                      className="font-bold text-indigo-600"
                      style={{ fontSize: getFontSize(1.25) }}
                    >
                      {totalStats.sleepCount}
                    </p>
                    <p
                      className="text-gray-500"
                      style={{ fontSize: getFontSize(0.75) }}
                    >
                      수면
                    </p>
                  </div>
                  <div
                    className="bg-pink-50 rounded-lg text-center"
                    style={{ padding: getPadding(0.75) }}
                  >
                    <Users
                      className="text-pink-500 mx-auto"
                      style={{
                        width: getIconSize(16),
                        height: getIconSize(16),
                        marginBottom: getGap(0.25),
                      }}
                    />
                    <p
                      className="font-bold text-pink-600"
                      style={{ fontSize: getFontSize(1.25) }}
                    >
                      {totalStats.communityCount}
                    </p>
                    <p
                      className="text-gray-500"
                      style={{ fontSize: getFontSize(0.75) }}
                    >
                      커뮤니티
                    </p>
                  </div>
                  <div
                    className="bg-purple-50 rounded-lg text-center"
                    style={{ padding: getPadding(0.75) }}
                  >
                    <Activity
                      className="text-purple-500 mx-auto"
                      style={{
                        width: getIconSize(16),
                        height: getIconSize(16),
                        marginBottom: getGap(0.25),
                      }}
                    />
                    <p
                      className="font-bold text-purple-600"
                      style={{ fontSize: getFontSize(1.25) }}
                    >
                      {grandTotal}
                    </p>
                    <p
                      className="text-gray-500"
                      style={{ fontSize: getFontSize(0.75) }}
                    >
                      총 활동
                    </p>
                  </div>
                </div>

                {/* 구성원별 기여도 막대 */}
                <div
                  className="border-t border-orange-100"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: getGap(0.5),
                    paddingTop: getGap(0.5),
                  }}
                >
                  <p
                    className="text-gray-500 font-medium"
                    style={{ fontSize: getFontSize(0.75) }}
                  >
                    구성원별 활동 기여도
                  </p>
                  {members.map((member) => {
                    const memberTotal = getTotalActivity(member.activity);
                    const percentage =
                      grandTotal > 0 ? (memberTotal / grandTotal) * 100 : 0;
                    return (
                      <div
                        key={member.id}
                        className="flex items-center"
                        style={{ gap: getGap(0.5) }}
                      >
                        <Avatar
                          style={{
                            width: getSize(1.5),
                            height: getSize(1.5),
                          }}
                        >
                          {member.avatarUrl ? (
                            <AvatarImage
                              src={member.avatarUrl}
                              alt={member.name}
                            />
                          ) : null}
                          <AvatarFallback
                            className="bg-orange-100 text-orange-600"
                            style={{ fontSize: getFontSize(0.625) }}
                          >
                            {member.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className="text-gray-600 truncate"
                          style={{
                            fontSize: getFontSize(0.75),
                            width: getSize(4),
                          }}
                        >
                          {member.name}
                        </span>
                        <div
                          className="flex-1 bg-gray-100 rounded-full overflow-hidden"
                          style={{ height: getSize(1) }}
                        >
                          <div
                            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span
                          className="font-medium text-gray-700 text-right"
                          style={{
                            fontSize: getFontSize(0.75),
                            width: getSize(3),
                          }}
                        >
                          {memberTotal}건
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 개인별 통계 */}
            {statsViewMode === "individual" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: getGap(0.5),
                }}
              >
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between border-b border-orange-50 last:border-0 cursor-pointer hover:bg-orange-50 rounded-lg transition-colors"
                    style={{
                      padding: `${0.5 * fontScale}rem ${0.5 * fontScale}rem`,
                      margin: `0 ${-0.5 * fontScale}rem`,
                    }}
                    onClick={() => handleMemberClick(member)}
                  >
                    <div
                      className="flex items-center"
                      style={{ gap: getGap(0.5) }}
                    >
                      <Avatar
                        style={{
                          width: getSize(1.5),
                          height: getSize(1.5),
                        }}
                      >
                        {member.avatarUrl ? (
                          <AvatarImage
                            src={member.avatarUrl}
                            alt={member.name}
                          />
                        ) : null}
                        <AvatarFallback
                          className="bg-orange-100 text-orange-600"
                          style={{ fontSize: getFontSize(0.625) }}
                        >
                          {member.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className="font-medium"
                        style={{ fontSize: getFontSize(0.875) }}
                      >
                        {member.name}
                      </span>
                    </div>
                    <div
                      className="flex items-center"
                      style={{
                        gap: getGap(0.5),
                        fontSize: getFontSize(0.875),
                      }}
                    >
                      <div
                        className="flex items-center"
                        style={{ gap: getGap(0.25) }}
                      >
                        <Utensils
                          className="text-orange-400"
                          style={{
                            width: getIconSize(12),
                            height: getIconSize(12),
                          }}
                        />
                        <span className="text-orange-600 font-medium">
                          {member.activity?.mealCount || 0}
                        </span>
                      </div>
                      <div
                        className="flex items-center"
                        style={{ gap: getGap(0.25) }}
                      >
                        <Calendar
                          className="text-blue-400"
                          style={{
                            width: getIconSize(12),
                            height: getIconSize(12),
                          }}
                        />
                        <span className="text-blue-600 font-medium">
                          {member.activity?.scheduleCount || 0}
                        </span>
                      </div>
                      <div
                        className="flex items-center"
                        style={{ gap: getGap(0.25) }}
                      >
                        <Pill
                          className="text-green-400"
                          style={{
                            width: getIconSize(12),
                            height: getIconSize(12),
                          }}
                        />
                        <span className="text-green-600 font-medium">
                          {member.activity?.medicationCount || 0}
                        </span>
                      </div>
                      <div
                        className="flex items-center"
                        style={{ gap: getGap(0.25) }}
                      >
                        <Moon
                          className="text-indigo-400"
                          style={{
                            width: getIconSize(12),
                            height: getIconSize(12),
                          }}
                        />
                        <span className="text-indigo-600 font-medium">
                          {member.activity?.sleepCount || 0}
                        </span>
                      </div>
                      <div
                        className="flex items-center"
                        style={{ gap: getGap(0.25) }}
                      >
                        <Users
                          className="text-pink-400"
                          style={{
                            width: getIconSize(12),
                            height: getIconSize(12),
                          }}
                        />
                        <span className="text-pink-600 font-medium">
                          {member.activity?.communityCount || 0}
                        </span>
                      </div>
                      <ChevronRight
                        className="text-gray-400"
                        style={{
                          width: getIconSize(16),
                          height: getIconSize(16),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 범례 */}
            <div
              className="flex flex-wrap items-center justify-center border-t border-orange-100"
              style={{
                gap: getGap(0.75),
                marginTop: getGap(1),
                paddingTop: getGap(0.75),
              }}
            >
              <div
                className="flex items-center text-gray-500"
                style={{ gap: getGap(0.25), fontSize: getFontSize(0.75) }}
              >
                <Utensils
                  className="text-orange-400"
                  style={{
                    width: getIconSize(12),
                    height: getIconSize(12),
                  }}
                />
                <span>식사</span>
              </div>
              <div
                className="flex items-center text-gray-500"
                style={{ gap: getGap(0.25), fontSize: getFontSize(0.75) }}
              >
                <Calendar
                  className="text-blue-400"
                  style={{
                    width: getIconSize(12),
                    height: getIconSize(12),
                  }}
                />
                <span>일정</span>
              </div>
              <div
                className="flex items-center text-gray-500"
                style={{ gap: getGap(0.25), fontSize: getFontSize(0.75) }}
              >
                <Pill
                  className="text-green-400"
                  style={{
                    width: getIconSize(12),
                    height: getIconSize(12),
                  }}
                />
                <span>투약</span>
              </div>
              <div
                className="flex items-center text-gray-500"
                style={{ gap: getGap(0.25), fontSize: getFontSize(0.75) }}
              >
                <Moon
                  className="text-indigo-400"
                  style={{
                    width: getIconSize(12),
                    height: getIconSize(12),
                  }}
                />
                <span>수면</span>
              </div>
              <div
                className="flex items-center text-gray-500"
                style={{ gap: getGap(0.25), fontSize: getFontSize(0.75) }}
              >
                <Users
                  className="text-pink-400"
                  style={{
                    width: getIconSize(12),
                    height: getIconSize(12),
                  }}
                />
                <span>커뮤니티</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
