"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Bell,
  Calendar,
  Pill,
  Utensils,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { apiClient } from "../utils/api";
import { getCurrentUser } from "../utils/auth";
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

export function Dashboard() {
  const [weeklyItems, setWeeklyItems] = useState<WeeklyItem[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<
    "meal" | "medicine" | "schedule"
  >("meal");
  const [newEntry, setNewEntry] = useState({
    type: "meal" as "meal" | "medicine" | "note",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    content: "",
    title: "",
  });

  useEffect(() => {
    const initDashboard = async () => {
      const { user } = await getCurrentUser();

      // 🔑 유저가 로그인되어 있을 때만 데이터를 불러옴
      if (user) {
        loadWeeklyData();
      }
    };

    initDashboard();
  }, []);

  async function loadWeeklyData() {
    try {
      // Get schedules and diary entries from the last 7 days
      const { data: schedules } = await apiClient.getSchedules();
      const { data: diaryEntries } = await apiClient.getDiaryEntries();

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const items: WeeklyItem[] = [
        ...(schedules || []).map((s: any) => ({
          id: s.id,
          title: s.title,
          date: s.date,
          time: s.time,
          type: "schedule" as const,
          category: s.category,
        })),
        ...(diaryEntries || []).map((d: any) => ({
          id: d.id,
          title: d.title,
          date: d.date,
          time: d.time,
          type: "diary" as const,
          category: d.type,
          content: d.content,
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

  const handleOpenDialog = (type: "meal" | "medicine" | "schedule") => {
    setDialogType(type);
    if (type === "schedule") {
      setNewEntry({
        type: "note",
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().slice(0, 5),
        content: "",
        title: "",
      });
    } else {
      setNewEntry({
        type: type,
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().slice(0, 5),
        content: "",
        title: "",
      });
    }
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
        setNewEntry({
          type: "note",
          date: new Date().toISOString().split("T")[0],
          time: new Date().toTimeString().slice(0, 5),
          content: "",
          title: "",
        });
      } catch (error) {
        toast.error("일정 추가에 실패했습니다");
      }
    } else {
      if (!newEntry.date || !newEntry.time || !newEntry.content) return;

      try {
        await apiClient.addDiaryEntry(
          newEntry.type,
          `${newEntry.date} ${newEntry.time}`,
          newEntry.content
        );

        setIsDialogOpen(false);
        toast.success("기록이 추가되었습니다!");
        loadWeeklyData();
        setNewEntry({
          type: "meal",
          date: new Date().toISOString().split("T")[0],
          time: new Date().toTimeString().slice(0, 5),
          content: "",
          title: "",
        });
      } catch (error) {
        toast.error("기록 추가에 실패했습니다");
      }
    }
  };

  const displayedItems = showAll ? weeklyItems : weeklyItems.slice(0, 4);

  const getCategoryLabel = (type: string, category?: string) => {
    if (type === "diary") {
      switch (category) {
        case "meal":
          return "식사";
        case "medicine":
          return "약 복용";
        default:
          return "기록";
      }
    } else {
      switch (category) {
        case "hospital":
          return "병원";
        case "medicine":
          return "약 복용";
        case "therapy":
          return "치료";
        default:
          return "일정";
      }
    }
  };

  const getIcon = (type: string, category?: string) => {
    if (type === "diary" && category === "meal")
      return <Utensils className="w-5 h-5 text-orange-600" />;
    if (category === "medicine")
      return <Pill className="w-5 h-5 text-green-600" />;
    return <Calendar className="w-5 h-5 text-blue-600" />;
  };

  const getBackgroundColor = (type: string, category?: string) => {
    if (type === "diary" && category === "meal") return "bg-orange-100";
    if (category === "medicine") return "bg-green-100";
    return "bg-blue-100";
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button
          variant="outline"
          className="h-24 flex flex-col gap-2"
          onClick={() => handleOpenDialog("meal")}
        >
          <Utensils className="w-6 h-6 text-orange-500" />
          <span className="text-sm">식사 기록</span>
        </Button>
        <Button
          variant="outline"
          className="h-24 flex flex-col gap-2"
          onClick={() => handleOpenDialog("medicine")}
        >
          <Pill className="w-6 h-6 text-green-500" />
          <span className="text-sm">약 복용</span>
        </Button>
        <Button
          variant="outline"
          className="h-24 flex flex-col gap-2"
          onClick={() => handleOpenDialog("schedule")}
        >
          <Calendar className="w-6 h-6 text-blue-500" />
          <span className="text-sm">일정 추가</span>
        </Button>
        <Button
          variant="outline"
          className="h-24 flex flex-col gap-2"
          onClick={() => handleOpenDialog("meal")}
        >
          <Plus className="w-6 h-6 text-purple-500" />
          <span className="text-sm">기록 추가</span>
        </Button>
      </div>

      {/* Weekly Schedule and Records */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>이번 주 일정 및 기록</CardTitle>
          <Bell className="w-5 h-5 text-gray-500" />
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
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${getBackgroundColor(
                      item.type,
                      item.category
                    )}`}
                  >
                    {getIcon(item.type, item.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-xs bg-white rounded border">
                        {getCategoryLabel(item.type, item.category)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {item.date} {item.time}
                      </span>
                    </div>
                    <p className="text-gray-900">{item.title}</p>
                    {item.content && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                        {item.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {weeklyItems.length > 4 && (
                <Button
                  variant="ghost"
                  className="w-full"
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
                ? "식사 기록 추가"
                : dialogType === "medicine"
                ? "약 복용 기록 추가"
                : "일정 추가"}
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
                  dialogType === "schedule"
                    ? "메모를 입력하세요"
                    : "내용을 입력하세요"
                }
                value={newEntry.content}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, content: e.target.value })
                }
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsDialogOpen(false)}
              >
                취소
              </Button>
              <Button className="flex-1" onClick={handleAddEntry}>
                저장
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
