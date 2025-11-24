"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Home,
  MessageCircle,
  Users,
  Menu,
  LogOut,
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
import { getSession, signOut, getCurrentUser } from "./utils/auth";
import { apiClient } from "./utils/api";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";

type Tab = "home" | "diary" | "schedule" | "community" | "family";

export default function Page() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [diary, setDiary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { session, error } = await getSession();
    if (session?.access_token) {
      apiClient.setAccessToken(session.access_token);
      const { user } = await getCurrentUser();
      setUser(user);

      // Check if user has a diary
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <Dashboard />;
      case "diary":
        return <SharedDiary />;
      case "schedule":
        return <ScheduleManager />;
      case "community":
        return <Community />;
      case "family":
        return <FamilyMembers />;
      default:
        return <Dashboard />;
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
          ? "bg-blue-50 text-blue-600"
          : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
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
            <h1 className="text-blue-600">이음케어</h1>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-1" />
                로그아웃
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAuthDialog(true)}
              >
                로그인
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:block w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)] p-4">
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-10">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center gap-1 p-2 ${
              activeTab === "home" ? "text-blue-600" : "text-gray-600"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">홈</span>
          </button>
          <button
            onClick={() => setActiveTab("diary")}
            className={`flex flex-col items-center gap-1 p-2 ${
              activeTab === "diary" ? "text-blue-600" : "text-gray-600"
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-xs">다이어리</span>
          </button>
          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex flex-col items-center gap-1 p-2 ${
              activeTab === "schedule" ? "text-blue-600" : "text-gray-600"
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-xs">일정</span>
          </button>
          <button
            onClick={() => setActiveTab("community")}
            className={`flex flex-col items-center gap-1 p-2 ${
              activeTab === "community" ? "text-blue-600" : "text-gray-600"
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs">커뮤니티</span>
          </button>
          <button
            onClick={() => setActiveTab("family")}
            className={`flex flex-col items-center gap-1 p-2 ${
              activeTab === "family" ? "text-blue-600" : "text-gray-600"
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
