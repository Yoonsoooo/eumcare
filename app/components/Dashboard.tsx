"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Bell,
  Calendar,
  Pill,
  Utensils,
  ChevronDown,
  Clock,
  Moon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { apiClient } from "../utils/api";
import { toast } from "sonner";

interface WeeklyItem {
  id: string;
  title: string;
  date: string;
  time: string;
  type: "schedule" | "diary";
  category?: string;
  content?: string;
}

interface DashboardProps {
  onNavigate?: (tab: "diary" | "schedule") => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [weeklyItems, setWeeklyItems] = useState<WeeklyItem[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<
    "meal" | "medicine" | "schedule" | "sleep"
  >("meal");
  const [newEntry, setNewEntry] = useState({
    type: "meal" as "meal" | "medicine" | "note" | "sleep",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    content: "",
    title: "",
  });

  useEffect(() => {
    loadWeeklyData();
  }, []);

  async function loadWeeklyData() {
    try {
      const { data: schedules } = await apiClient.getSchedules();
      const { data: diaryEntries } = await apiClient.getDiaryEntries();

      const items: WeeklyItem[] = [
        ...(schedules || []).map((s: any) => ({
          id: s.id,
          title: s.title,
          date: s.date,
          time: s.time,
          type: "schedule" as const,
          category: s.category,
          content: s.notes || s.title, // ✨ 메모가 없으면 제목을 내용으로 사용
        })),
        ...(diaryEntries || []).map((d: any) => ({
          id: d.id,
          title: d.title,
          date: new Date(d.created_at).toISOString().split("T")[0],
          time: new Date(d.created_at).toTimeString().slice(0, 5),
          type: "diary" as const,
          category: d.type,
          content: d.content || d.title, // ✨ 내용이 없으면 제목을 내용으로 사용
        })),
      ].sort((a, b) => {
        const dateA = new Date(a.date + " " + a.time);
        const dateB = new Date(b.date + " " + b.time);
        return dateB.getTime() - dateA.getTime();
      });

      setWeeklyItems(items);
    } catch (error) {
      console.error("Failed to load weekly data:", error);
    }
  }

  const handleOpenDialog = (
    type: "meal" | "medicine" | "schedule" | "sleep"
  ) => {
    setDialogType(type);
    setNewEntry({
      type: type === "schedule" ? "note" : type,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
      content: "",
      title: "",
    });
    setIsDialogOpen(true);
  };

  const handleAddEntry = async () => {
    if (dialogType === "schedule") {
      if (!newEntry.title || !newEntry.date || !newEntry.time) return;
      try {
        await apiClient.addSchedule({
          title: newEntry.title,
          date: newEntry.date,
          time: newEntry.time,
          category: "other",
          reminder: true,
          location: "",
          notes: newEntry.content,
        });
        setIsDialogOpen(false);
        toast.success("일정이 추가되었습니다!");
        loadWeeklyData();
      } catch (error) {
        toast.error("실패했습니다");
      }
    } else {
      if (!newEntry.date || !newEntry.time || !newEntry.content) return;
      try {
        const titleToSave = newEntry.content;
        await apiClient.addDiaryEntry(
          dialogType === "sleep" ? "sleep" : newEntry.type,
          titleToSave,
          newEntry.content
        );
        setIsDialogOpen(false);
        toast.success("기록되었습니다!");
        loadWeeklyData();
      } catch (error) {
        toast.error("실패했습니다");
      }
    }
  };

  const displayedItems = showAll ? weeklyItems : weeklyItems.slice(0, 4);

  const getCategoryLabel = (type: string, category?: string) => {
    if (type === "diary") {
      if (category === "meal") return "식사";
      if (category === "medicine") return "약 복용";
      if (category === "sleep") return "수면";
      return "기록";
    } else {
      if (category === "hospital") return "병원";
      if (category === "medicine") return "약 복용";
      if (category === "therapy") return "치료";
      return "일정";
    }
  };

  const getIcon = (type: string, category?: string) => {
    if (type === "diary" && category === "meal")
      return <Utensils className="w-5 h-5 text-orange-600" />;
    if (category === "medicine")
      return <Pill className="w-5 h-5 text-amber-600" />;
    if (category === "sleep")
      return <Moon className="w-5 h-5 text-purple-600" />;
    return <Calendar className="w-5 h-5 text-rose-500" />;
  };

  const getBackgroundColor = (type: string, category?: string) => {
    if (type === "diary" && category === "meal") return "bg-orange-100";
    if (category === "medicine") return "bg-amber-100";
    if (category === "sleep") return "bg-purple-100";
    return "bg-rose-100";
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button
          variant="outline"
          className="h-24 flex flex-col gap-2 hover:bg-orange-50 hover:border-orange-200"
          onClick={() => handleOpenDialog("meal")}
        >
          <Utensils className="w-6 h-6 text-orange-500" />
          <span className="text-sm">식사 기록</span>
        </Button>
        <Button
          variant="outline"
          className="h-24 flex flex-col gap-2 hover:bg-amber-50 hover:border-amber-200"
          onClick={() => handleOpenDialog("medicine")}
        >
          <Pill className="w-6 h-6 text-amber-500" />
          <span className="text-sm">약 복용</span>
        </Button>
        <Button
          variant="outline"
          className="h-24 flex flex-col gap-2 hover:bg-purple-50 hover:border-purple-200"
          onClick={() => handleOpenDialog("sleep")}
        >
          <Moon className="w-6 h-6 text-purple-500" />
          <span className="text-sm">수면</span>
        </Button>
        <Button
          variant="outline"
          className="h-24 flex flex-col gap-2 hover:bg-rose-50 hover:border-rose-200"
          onClick={() => handleOpenDialog("schedule")}
        >
          <Calendar className="w-6 h-6 text-rose-500" />
          <span className="text-sm">일정 추가</span>
        </Button>
      </div>

      {/* Weekly Schedule and Records */}
      <Card className="border-orange-100">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>이번 주 일정 및 기록</CardTitle>
          <Bell className="w-5 h-5 text-orange-400" />
        </CardHeader>
        <CardContent className="space-y-3">
          {displayedItems.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              아직 일정이나 기록이 없습니다
            </p>
          ) : (
            <>
              {displayedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() =>
                    onNavigate?.(item.type === "diary" ? "diary" : "schedule")
                  }
                  className="flex items-start gap-3 p-4 bg-orange-50/50 rounded-xl hover:bg-orange-100/50 transition-colors cursor-pointer"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-1 ${getBackgroundColor(
                      item.type,
                      item.category
                    )}`}
                  >
                    {getIcon(item.type, item.category)}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* 카테고리 & 날짜 */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 text-xs bg-white rounded border border-orange-200 text-orange-700 whitespace-nowrap">
                        {getCategoryLabel(item.type, item.category)}
                      </span>
                      <span className="text-xs text-gray-500">{item.date}</span>
                    </div>

                    {/* ✨ 내용만 표시 (제목 제거) */}
                    <p className="text-gray-900 line-clamp-2 break-words">
                      {item.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-gray-500 font-medium bg-white px-2 py-1 rounded-lg border border-orange-100 whitespace-nowrap shrink-0">
                    <Clock className="w-3 h-3" />
                    {item.time}
                  </div>
                </div>
              ))}

              {weeklyItems.length > 4 && (
                <Button
                  variant="ghost"
                  className="w-full text-orange-600 hover:bg-orange-50"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? "접기" : `더보기 (${weeklyItems.length - 4}개)`}
                  <ChevronDown
                    className={`w-4 h-4 ml-2 transition-transform ${
                      showAll ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Entry Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === "meal"
                ? "🍽️ 식사 기록"
                : dialogType === "medicine"
                ? "💊 약 복용 기록"
                : dialogType === "sleep"
                ? "😴 수면 기록"
                : "📅 일정 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {dialogType === "schedule" && (
              <div className="space-y-2">
                <Label>제목</Label>
                <Input
                  placeholder="일정 제목을 입력하세요"
                  value={newEntry.title}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, title: e.target.value })
                  }
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>날짜</Label>
                <Input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>시간</Label>
                <Input
                  type="time"
                  value={newEntry.time}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, time: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{dialogType === "schedule" ? "메모" : "내용"}</Label>
              <Textarea
                placeholder={
                  dialogType === "meal"
                    ? "오늘 드신 음식을 기록해주세요"
                    : dialogType === "medicine"
                    ? "복용한 약을 기록해주세요"
                    : dialogType === "sleep"
                    ? "수면 상태를 기록해주세요"
                    : "메모를 입력하세요"
                }
                rows={4}
                value={newEntry.content}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, content: e.target.value })
                }
              />
            </div>
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600"
              onClick={handleAddEntry}
            >
              저장
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
