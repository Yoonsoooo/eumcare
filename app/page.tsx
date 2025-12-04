"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Home,
  MessageCircle,
  Users,
  Menu,
  LogOut,
  Bell,
  Utensils,
  Pill,
  Moon,
  X,
  ChevronDown,
  Type,
  User,
} from "lucide-react";
import { Dashboard } from "./components/Dashboard";
import { SharedDiary } from "./components/SharedDiary";
import { ScheduleManager } from "./components/ScheduleManager";
import { MedicineReminder } from "./components/MedicineReminder";
import { Community } from "./components/Community";
import { FamilyMembers } from "./components/FamilyMembers";
import { ProfileSettings } from "./components/ProfileSettings";
import { AuthDialog } from "./components/AuthDialog";
import { OnboardingDialog } from "./components/OnboardingDialog";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "./components/ui/sheet";
import { Button } from "./components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./components/ui/popover";
import { getSession, signOut, getCurrentUser } from "./utils/auth";
import { apiClient } from "./utils/api";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";

type Tab =
  | "home"
  | "diary"
  | "schedule"
  | "reminder"
  | "community"
  | "family"
  | "profile";

type FontSize = "default" | "large" | "xlarge";

interface RecentActivity {
  id: string;
  type: "schedule" | "diary";
  category?: string;
  title: string;
  createdAt: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [diary, setDiary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    []
  );
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);

  const [fontSize, setFontSize] = useState<FontSize>("default");

  useEffect(() => {
    const saved = localStorage.getItem("fontSize") as FontSize;
    if (saved) {
      setFontSize(saved);
    }
  }, []);

  const handleFontSizeChange = (size: FontSize) => {
    setFontSize(size);
    localStorage.setItem("fontSize", size);
    toast.success(
      size === "default"
        ? "기본 크기로 변경됨"
        : size === "large"
        ? "큰 글씨로 변경됨"
        : "아주 큰 글씨로 변경됨"
    );
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case "large":
        return "text-lg font-medium";
      case "xlarge":
        return "text-xl font-semibold";
      default:
        return "text-base font-normal";
    }
  };

  const getFontScale = () => {
    switch (fontSize) {
      case "large":
        return 1.2;
      case "xlarge":
        return 1.5;
      default:
        return 1;
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { session, error } = await getSession();
    if (session?.access_token) {
      apiClient.setAccessToken(session.access_token);
      const { user } = await getCurrentUser();
      setUser(user);

      try {
        const { data } = await apiClient.getMyDiary();
        if (data) {
          setDiary(data);
          loadRecentActivities();
        } else {
          setShowOnboarding(true);
        }
      } catch (err) {
        console.error("Error fetching diary:", err);
      }
    }
    setLoading(false);
  }

  async function loadRecentActivities() {
    setActivitiesLoading(true);
    try {
      const [schedulesRes, diaryRes] = await Promise.all([
        apiClient.getSchedules(),
        apiClient.getDiaryEntries(),
      ]);

      const activities: RecentActivity[] = [];

      if (schedulesRes.data) {
        schedulesRes.data.forEach((schedule: any) => {
          activities.push({
            id: schedule.id,
            type: "schedule",
            category: schedule.category,
            title: schedule.title,
            createdAt:
              schedule.created_at || `${schedule.date}T${schedule.time}`,
          });
        });
      }

      if (diaryRes.data) {
        diaryRes.data.forEach((entry: any) => {
          activities.push({
            id: entry.id,
            type: "diary",
            category: entry.type,
            title: entry.title || entry.content,
            createdAt: entry.created_at,
          });
        });
      }

      activities.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setRecentActivities(activities.slice(0, 7));
    } catch (error) {
      console.error("Failed to load recent activities:", error);
    } finally {
      setActivitiesLoading(false);
    }
  }

  async function handleDeleteActivity(activity: RecentActivity) {
    try {
      if (activity.type === "schedule") {
        await apiClient.deleteSchedule(activity.id);
      } else {
        await apiClient.deleteDiaryEntry(activity.id);
      }

      setRecentActivities((prev) => prev.filter((a) => a.id !== activity.id));
      toast.success("삭제되었습니다");
    } catch (error) {
      console.error("Failed to delete activity:", error);
      toast.error("삭제에 실패했습니다");
    }
  }

  function handleClearAllActivities() {
    if (
      confirm(
        "모든 최근 활동 알림을 지우시겠습니까?\n(실제 데이터는 삭제되지 않습니다)"
      )
    ) {
      setRecentActivities([]);
      toast.success("알림이 모두 지워졌습니다");
    }
  }

  function getTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "방금 전";
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays === 1) return "어제";
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString();
  }

  function getActivityLabel(activity: RecentActivity): string {
    if (activity.type === "schedule") {
      switch (activity.category) {
        case "hospital":
          return "병원 일정 추가";
        case "medicine":
          return "약 복용 일정 추가";
        case "therapy":
          return "치료 일정 추가";
        default:
          return "일정 추가";
      }
    } else {
      switch (activity.category) {
        case "meal":
          return "식사 기록 추가";
        case "medicine":
          return "약 복용 기록 추가";
        case "health":
          return "건강 기록 추가";
        case "sleep":
          return "수면 기록 추가";
        default:
          return "기록 추가";
      }
    }
  }

  function getActivityIcon(activity: RecentActivity) {
    if (activity.type === "schedule") {
      return <Calendar className="w-4 h-4 text-rose-500" />;
    }
    switch (activity.category) {
      case "meal":
        return <Utensils className="w-4 h-4 text-orange-500" />;
      case "medicine":
      case "health":
        return <Pill className="w-4 h-4 text-amber-500" />;
      case "sleep":
        return <Moon className="w-4 h-4 text-purple-500" />;
      default:
        return <Calendar className="w-4 h-4 text-orange-500" />;
    }
  }

  function getActivityBgColor(activity: RecentActivity): string {
    if (activity.type === "schedule") {
      return "bg-rose-100";
    }
    switch (activity.category) {
      case "meal":
        return "bg-orange-100";
      case "medicine":
      case "health":
        return "bg-amber-100";
      case "sleep":
        return "bg-purple-100";
      default:
        return "bg-orange-100";
    }
  }

  async function handleSignOut() {
    await signOut();
    apiClient.setAccessToken(null);
    setUser(null);
    setDiary(null);
    setRecentActivities([]);
    setActiveTab("home");
    toast.success("로그아웃되었습니다");
  }

  async function handleDiaryCreated(newDiary: any) {
    setDiary(newDiary);
    setShowOnboarding(false);
    toast.success("다이어리가 생성되었습니다!");
    loadRecentActivities();
  }

  function handleAuthSuccess() {
    setShowAuthDialog(false);
    checkAuth();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // ✅ 수정된 renderContent - Community에 user 정보 전달
  const renderContent = () => {
    const fontScale = getFontScale();

    switch (activeTab) {
      case "home":
        return (
          <Dashboard
            onNavigate={(tab) => setActiveTab(tab as Tab)}
            fontScale={fontScale}
          />
        );
      case "diary":
        return <SharedDiary fontScale={fontScale} />;
      case "schedule":
        return <ScheduleManager fontScale={fontScale} />;
      case "reminder":
        return <MedicineReminder fontScale={fontScale} />;
      case "community":
        // ✅ 수정: currentUserEmail과 currentUserId 전달
        return (
          <Community
            fontScale={fontScale}
            currentUserEmail={user?.email}
            currentUserId={user?.id}
          />
        );
      case "family":
        return <FamilyMembers fontScale={fontScale} />;
      case "profile":
        return (
          <ProfileSettings fontScale={fontScale} onSignOut={handleSignOut} />
        );
      default:
        return (
          <Dashboard
            onNavigate={(tab) => setActiveTab(tab as Tab)}
            fontScale={fontScale}
          />
        );
    }
  };

  const NavButton = ({
    tab,
    icon: Icon,
    label,
  }: {
    tab: Tab;
    icon: any;
    label: string;
  }) => (
    <button
      onClick={() => {
        setActiveTab(tab);
        setIsOpen(false);
      }}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        activeTab === tab
          ? "bg-orange-50 text-orange-600"
          : "text-gray-600 hover:bg-orange-50/50"
      } ${getFontSizeClass()}`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );

  const displayedActivities = showAllActivities
    ? recentActivities
    : recentActivities.slice(0, 4);

  const hasMoreActivities = recentActivities.length > 4;

  return (
    <div className={`min-h-screen bg-orange-50/30 ${getFontSizeClass()}`}>
      {/* Header */}
      <header className="bg-white border-b border-orange-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-4">
                {/* ✅ 접근성 오류 해결: SheetTitle 추가 */}
                <SheetTitle className="sr-only">메뉴</SheetTitle>
                <div
                  className={`flex flex-col gap-2 mt-8 ${getFontSizeClass()}`}
                >
                  <NavButton tab="home" icon={Home} label="홈" />
                  <NavButton
                    tab="diary"
                    icon={Calendar}
                    label="공유 다이어리"
                  />
                  <NavButton tab="schedule" icon={Calendar} label="일정 관리" />
                  <NavButton tab="reminder" icon={Bell} label="약 알림" />
                  <NavButton
                    tab="community"
                    icon={MessageCircle}
                    label="커뮤니티"
                  />
                  <NavButton tab="family" icon={Users} label="가족 구성원" />

                  <div className="h-px bg-orange-100 my-2" />

                  <NavButton tab="profile" icon={User} label="마이페이지" />
                </div>
              </SheetContent>
            </Sheet>
            <h1
              className={`text-orange-600 font-bold ${
                fontSize === "xlarge"
                  ? "text-2xl"
                  : fontSize === "large"
                  ? "text-xl"
                  : "text-xl"
              }`}
            >
              이음케어
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* 글자 크기 조절 버튼 */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-orange-50"
                  title="글자 크기 조절"
                >
                  <Type
                    className={`${
                      fontSize === "xlarge"
                        ? "w-7 h-7"
                        : fontSize === "large"
                        ? "w-6 h-6"
                        : "w-5 h-5"
                    }`}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48" align="end">
                <div className="space-y-2">
                  <h3 className="font-medium text-sm text-gray-700 mb-3">
                    글자 크기
                  </h3>

                  <button
                    onClick={() => handleFontSizeChange("default")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      fontSize === "default"
                        ? "bg-orange-100 text-orange-700"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <Type className="w-4 h-4" />
                    <span className="text-sm">기본</span>
                  </button>

                  <button
                    onClick={() => handleFontSizeChange("large")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      fontSize === "large"
                        ? "bg-orange-100 text-orange-700 font-medium"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <Type className="w-5 h-5" />
                    <span className="text-base font-medium">크게</span>
                  </button>

                  <button
                    onClick={() => handleFontSizeChange("xlarge")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      fontSize === "xlarge"
                        ? "bg-orange-100 text-orange-700 font-semibold"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <Type className="w-6 h-6" />
                    <span className="text-lg font-semibold">아주 크게</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            {/* 알림 버튼 */}
            {user && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-orange-50 relative"
                    onClick={() => {
                      loadRecentActivities();
                      setShowAllActivities(false);
                    }}
                  >
                    <Bell className="w-5 h-5" />
                    {recentActivities.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                        {recentActivities.length > 9
                          ? "9+"
                          : recentActivities.length}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">최근 활동</h3>
                      {recentActivities.length > 0 && (
                        <button
                          onClick={handleClearAllActivities}
                          className="text-xs text-gray-500 hover:text-orange-600 transition-colors"
                        >
                          모두 지우기
                        </button>
                      )}
                    </div>

                    {activitiesLoading ? (
                      <div className="py-8 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">로딩 중...</p>
                      </div>
                    ) : recentActivities.length === 0 ? (
                      <div className="py-8 text-center text-gray-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">아직 활동이 없습니다</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2 max-h-[320px] overflow-y-auto">
                          {displayedActivities.map((activity) => (
                            <div
                              key={activity.id}
                              className="flex items-start gap-3 p-2 rounded-lg hover:bg-orange-50/50 group transition-colors"
                            >
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getActivityBgColor(
                                  activity
                                )}`}
                              >
                                {getActivityIcon(activity)}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-sm">
                                  <span className="text-orange-600 font-medium">
                                    {getActivityLabel(activity)}
                                  </span>
                                </p>
                                <p className="text-sm text-gray-700 truncate mt-0.5">
                                  {activity.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {getTimeAgo(activity.createdAt)}
                                </p>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteActivity(activity);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                                title="삭제"
                              >
                                <X className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {hasMoreActivities && (
                          <button
                            onClick={() =>
                              setShowAllActivities(!showAllActivities)
                            }
                            className="w-full py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-lg flex items-center justify-center gap-1 transition-colors"
                          >
                            {showAllActivities ? (
                              <>접기</>
                            ) : (
                              <>더보기 ({recentActivities.length - 4}개)</>
                            )}
                            <ChevronDown
                              className={`w-4 h-4 transition-transform ${
                                showAllActivities ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* 마이페이지 버튼 */}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-orange-50"
                onClick={() => setActiveTab("profile")}
              >
                <User className="w-5 h-5" />
              </Button>
            )}

            {/* 로그인/로그아웃 버튼 */}
            {!user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAuthDialog(true)}
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <span className={fontSize === "xlarge" ? "text-base" : ""}>
                  로그인
                </span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:block w-64 bg-white border-r border-orange-100 min-h-[calc(100vh-73px)] p-4">
          <nav className="flex flex-col gap-2">
            <NavButton tab="home" icon={Home} label="홈" />
            <NavButton tab="diary" icon={Calendar} label="공유 다이어리" />
            <NavButton tab="schedule" icon={Calendar} label="일정 관리" />
            <NavButton tab="reminder" icon={Bell} label="약 알림" />
            <NavButton tab="community" icon={MessageCircle} label="커뮤니티" />
            <NavButton tab="family" icon={Users} label="가족 구성원" />

            <div className="h-px bg-orange-100 my-2" />

            <NavButton tab="profile" icon={User} label="마이페이지" />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">{renderContent()}</main>
      </div>

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-orange-100 px-2 py-2 z-10">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center gap-1 p-2 ${
              activeTab === "home" ? "text-orange-600" : "text-gray-400"
            }`}
          >
            <Home className="w-5 h-5" />
            <span
              className={`${fontSize === "xlarge" ? "text-sm" : "text-xs"}`}
            >
              홈
            </span>
          </button>
          <button
            onClick={() => setActiveTab("diary")}
            className={`flex flex-col items-center gap-1 p-2 ${
              activeTab === "diary" ? "text-orange-600" : "text-gray-400"
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span
              className={`${fontSize === "xlarge" ? "text-sm" : "text-xs"}`}
            >
              다이어리
            </span>
          </button>
          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex flex-col items-center gap-1 p-2 ${
              activeTab === "schedule" ? "text-orange-600" : "text-gray-400"
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span
              className={`${fontSize === "xlarge" ? "text-sm" : "text-xs"}`}
            >
              일정
            </span>
          </button>
          <button
            onClick={() => setActiveTab("reminder")}
            className={`flex flex-col items-center gap-1 p-2 ${
              activeTab === "reminder" ? "text-orange-600" : "text-gray-400"
            }`}
          >
            <Pill className="w-5 h-5" />
            <span
              className={`${fontSize === "xlarge" ? "text-sm" : "text-xs"}`}
            >
              약 알림
            </span>
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center gap-1 p-2 ${
              activeTab === "profile" ? "text-orange-600" : "text-gray-400"
            }`}
          >
            <User className="w-5 h-5" />
            <span
              className={`${fontSize === "xlarge" ? "text-sm" : "text-xs"}`}
            >
              MY
            </span>
          </button>
        </div>
      </nav>

      {/* Auth Dialog */}
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Onboarding Dialog */}
      <OnboardingDialog
        open={showOnboarding}
        onDiaryCreated={handleDiaryCreated}
      />

      {/* Toaster */}
      <Toaster />
    </div>
  );
}
