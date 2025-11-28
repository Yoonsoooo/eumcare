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
} from "lucide-react";
import { Dashboard } from "./components/Dashboard";
import { SharedDiary } from "./components/SharedDiary";
import { ScheduleManager } from "./components/ScheduleManager";
import { Community } from "./components/Community";
import { FamilyMembers } from "./components/FamilyMembers";
import { AuthDialog } from "./components/AuthDialog";
import { OnboardingDialog } from "./components/OnboardingDialog";
import { Sheet, SheetContent, SheetTrigger } from "./components/ui/sheet";
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

type Tab = "home" | "diary" | "schedule" | "community" | "family";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [diary, setDiary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [recentActivities, setRecentActivities] = useState([
    {
      id: 1,
      member: "큰아들",
      action: "점심 식사 기록 추가",
      time: "2시간 전",
    },
    { id: 2, member: "딸", action: "약 복용 완료 체크", time: "4시간 전" },
    { id: 3, member: "큰며느리", action: "병원 예약 등록", time: "어제" },
  ]);

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
        } else {
          setShowOnboarding(true);
        }
      } catch (err) {
        console.error("Error fetching diary:", err);
      }
    }
    setLoading(false);
  }

  async function handleSignOut() {
    await signOut();
    apiClient.setAccessToken(null);
    setUser(null);
    setDiary(null);
    toast.success("로그아웃되었습니다");
  }

  async function handleDiaryCreated(newDiary: any) {
    setDiary(newDiary);
    setShowOnboarding(false);
    toast.success("다이어리가 생성되었습니다!");
  }

  function handleAuthSuccess() {
    setShowAuthDialog(false);
    checkAuth();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50/30 flex items-center justify-center">
        <div className="text-center">
          {/* ✨ 로딩 스피너 색상 변경 */}
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case "diary":
        return <SharedDiary />;
      case "schedule":
        return <ScheduleManager />;
      case "community":
        return <Community />;
      case "family":
        return <FamilyMembers />;
      default:
        return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
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
          ? "bg-orange-50 text-orange-600" // ✨ 활성 탭 색상 변경
          : "text-gray-600 hover:bg-orange-50/50" // ✨ 호버 색상 변경
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-orange-50/30">
      {" "}
      {/* ✨ 배경색 변경 */}
      {/* Header */}
      <header className="bg-white border-b border-orange-100 sticky top-0 z-10">
        {" "}
        {/* ✨ 테두리 색상 변경 */}
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-4">
                <div className="flex flex-col gap-2 mt-8">
                  <NavButton tab="home" icon={Home} label="홈" />
                  <NavButton
                    tab="diary"
                    icon={Calendar}
                    label="공유 다이어리"
                  />
                  <NavButton tab="schedule" icon={Calendar} label="일정 관리" />
                  <NavButton
                    tab="community"
                    icon={MessageCircle}
                    label="커뮤니티"
                  />
                  <NavButton tab="family" icon={Users} label="가족 구성원" />
                </div>
              </SheetContent>
            </Sheet>
            {/* ✨ 로고 색상 변경 */}
            <h1 className="text-orange-600 font-bold text-xl">이음케어</h1>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-orange-50"
                  >
                    <Bell className="w-5 h-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-3">
                    <h3 className="font-medium">최근 활동</h3>
                    <div className="space-y-3">
                      {recentActivities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 pb-3 border-b last:border-0"
                        >
                          {/* ✨ 아바타 배경색 변경 */}
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                            <span className="text-sm text-orange-600">
                              {activity.member[0]}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">
                              {/* ✨ 멤버 이름 색상 변경 */}
                              <span className="text-orange-600 font-medium">
                                {activity.member}
                              </span>
                              님이 {activity.action}했습니다
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {activity.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {user ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <LogOut className="w-4 h-4 mr-1" />
                로그아웃
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAuthDialog(true)}
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                로그인
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
            <NavButton tab="community" icon={MessageCircle} label="커뮤니티" />
            <NavButton tab="family" icon={Users} label="가족 구성원" />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">{renderContent()}</main>
      </div>
      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-orange-100 px-4 py-2 z-10">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center gap-1 p-2 ${
              activeTab === "home" ? "text-orange-600" : "text-gray-400"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">홈</span>
          </button>
          <button
            onClick={() => setActiveTab("diary")}
            className={`flex flex-col items-center gap-1 p-2 ${
              activeTab === "diary" ? "text-orange-600" : "text-gray-400"
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-xs">다이어리</span>
          </button>
          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex flex-col items-center gap-1 p-2 ${
              activeTab === "schedule" ? "text-orange-600" : "text-gray-400"
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-xs">일정</span>
          </button>
          <button
            onClick={() => setActiveTab("community")}
            className={`flex flex-col items-center gap-1 p-2 ${
              activeTab === "community" ? "text-orange-600" : "text-gray-400"
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs">커뮤니티</span>
          </button>
          <button
            onClick={() => setActiveTab("family")}
            className={`flex flex-col items-center gap-1 p-2 ${
              activeTab === "family" ? "text-orange-600" : "text-gray-400"
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-xs">가족</span>
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
