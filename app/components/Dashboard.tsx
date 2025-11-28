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
  CheckCircle2,
  Circle,
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
  is_completed: boolean;
  completed_at?: string;
}

interface DashboardProps {
  onNavigate?: (tab: "diary" | "schedule") => void;
  fontScale?: number; // ✨ 추가
}

export function Dashboard({ onNavigate, fontScale = 1 }: DashboardProps) {
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

  // ✨ fontScale에 따른 font-weight 클래스
  const getFontWeight = () => {
    if (fontScale >= 1.5) return "font-semibold";
    if (fontScale >= 1.2) return "font-medium";
    return "font-normal";
  };

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
          content: s.notes,
          is_completed: s.is_completed || false,
          completed_at: s.completed_at,
        })),
        ...(diaryEntries || []).map((d: any) => ({
          id: d.id,
          title: d.title || d.content,
          date: new Date(d.created_at).toISOString().split("T")[0],
          time: new Date(d.created_at).toTimeString().slice(0, 5),
          type: "diary" as const,
          category: d.type,
          content: d.title === d.content ? "" : d.content,
          is_completed: d.is_completed || false,
          completed_at: d.completed_at,
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

  const handleToggleComplete = async (
    e: React.MouseEvent,
    item: WeeklyItem
  ) => {
    e.stopPropagation();
    const newStatus = !item.is_completed;
    const now = new Date().toISOString();

    setWeeklyItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              is_completed: newStatus,
              completed_at: newStatus ? now : undefined,
            }
          : i
      )
    );

    try {
      if (item.type === "schedule") {
        await apiClient.toggleScheduleComplete(item.id, newStatus);
      } else {
        await apiClient.toggleDiaryComplete(item.id, newStatus);
      }
      if (newStatus) toast.success("완료되었습니다!");
    } catch (error) {
      loadWeeklyData();
    }
  };

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
      if (!newEntry.title) return;
      try {
        await apiClient.addSchedule({
          title: newEntry.title,
          date: newEntry.date,
          time: newEntry.time,
          category: "other",
          reminder: true,
          notes: newEntry.content,
        });
        setIsDialogOpen(false);
        toast.success("추가됨!");
        loadWeeklyData();
      } catch (error) {
        toast.error("실패");
      }
    } else {
      if (!newEntry.content) return;
      try {
        await apiClient.addDiaryEntry(
          dialogType === "sleep" ? "sleep" : newEntry.type,
          newEntry.content,
          newEntry.content
        );
        setIsDialogOpen(false);
        toast.success("기록됨!");
        loadWeeklyData();
      } catch (error) {
        toast.error("실패");
      }
    }
  };

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
    const size = 24 * fontScale;
    if (type === "diary" && category === "meal")
      return (
        <Utensils
          className="text-orange-600"
          style={{ width: size, height: size }}
        />
      );
    if (category === "medicine")
      return (
        <Pill
          className="text-amber-600"
          style={{ width: size, height: size }}
        />
      );
    if (category === "sleep")
      return (
        <Moon
          className="text-purple-600"
          style={{ width: size, height: size }}
        />
      );
    return (
      <Calendar
        className="text-rose-500"
        style={{ width: size, height: size }}
      />
    );
  };

  const getBackgroundColor = (type: string, category?: string) => {
    if (type === "diary" && category === "meal") return "bg-orange-100";
    if (category === "medicine") return "bg-amber-100";
    if (category === "sleep") return "bg-purple-100";
    return "bg-rose-100";
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const displayedItems = showAll ? weeklyItems : weeklyItems.slice(0, 4);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col gap-2 hover:bg-orange-50 hover:border-orange-200"
          onClick={() => handleOpenDialog("meal")}
        >
          <Utensils
            className="text-orange-500"
            style={{ width: 24 * fontScale, height: 24 * fontScale }}
          />
          <span
            className={`text-gray-700 ${getFontWeight()}`}
            style={{ fontSize: `${0.875 * fontScale}rem` }}
          >
            식사 기록
          </span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col gap-2 hover:bg-amber-50 hover:border-amber-200"
          onClick={() => handleOpenDialog("medicine")}
        >
          <Pill
            className="text-amber-500"
            style={{ width: 24 * fontScale, height: 24 * fontScale }}
          />
          <span
            className={`text-gray-700 ${getFontWeight()}`}
            style={{ fontSize: `${0.875 * fontScale}rem` }}
          >
            약 복용
          </span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col gap-2 hover:bg-purple-50 hover:border-purple-200"
          onClick={() => handleOpenDialog("sleep")}
        >
          <Moon
            className="text-purple-500"
            style={{ width: 24 * fontScale, height: 24 * fontScale }}
          />
          <span
            className={`text-gray-700 ${getFontWeight()}`}
            style={{ fontSize: `${0.875 * fontScale}rem` }}
          >
            수면
          </span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col gap-2 hover:bg-rose-50 hover:border-rose-200"
          onClick={() => handleOpenDialog("schedule")}
        >
          <Calendar
            className="text-rose-500"
            style={{ width: 24 * fontScale, height: 24 * fontScale }}
          />
          <span
            className={`text-gray-700 ${getFontWeight()}`}
            style={{ fontSize: `${0.875 * fontScale}rem` }}
          >
            일정 추가
          </span>
        </Button>
      </div>

      {/* List */}
      <Card className="border-orange-100">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle
            className={getFontWeight()}
            style={{ fontSize: `${1.25 * fontScale}rem` }}
          >
            이번 주 일정 및 기록
          </CardTitle>
          <Bell
            className="text-orange-400"
            style={{ width: 20 * fontScale, height: 20 * fontScale }}
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {displayedItems.length === 0 ? (
            <p
              className={`text-center text-gray-500 py-8 ${getFontWeight()}`}
              style={{ fontSize: `${1 * fontScale}rem` }}
            >
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
                  className={`flex items-center gap-3 p-4 rounded-xl transition-colors cursor-pointer border ${
                    item.is_completed
                      ? "bg-green-50 border-green-100"
                      : "bg-white border-orange-100 hover:bg-orange-50/50"
                  }`}
                >
                  {/* 아이콘 */}
                  <div
                    className={`rounded-full flex items-center justify-center shrink-0 ${
                      item.is_completed
                        ? "bg-green-100"
                        : getBackgroundColor(item.type, item.category)
                    }`}
                    style={{ width: 44 * fontScale, height: 44 * fontScale }}
                  >
                    {item.is_completed ? (
                      <CheckCircle2
                        className="text-green-600"
                        style={{
                          width: 24 * fontScale,
                          height: 24 * fontScale,
                        }}
                      />
                    ) : (
                      getIcon(item.type, item.category)
                    )}
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded border whitespace-nowrap ${getFontWeight()} ${
                          item.is_completed
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-white text-orange-700 border-orange-200"
                        }`}
                        style={{ fontSize: `${0.75 * fontScale}rem` }}
                      >
                        {getCategoryLabel(item.type, item.category)}
                      </span>
                      <span
                        className="text-gray-500"
                        style={{ fontSize: `${0.75 * fontScale}rem` }}
                      >
                        {item.date}
                      </span>
                    </div>

                    <h4
                      className={`truncate ${getFontWeight()} ${
                        item.is_completed
                          ? "text-gray-400 line-through"
                          : "text-gray-900"
                      }`}
                      style={{ fontSize: `${1 * fontScale}rem` }}
                    >
                      {item.title}
                    </h4>

                    {item.content && item.content !== item.title && (
                      <p
                        className="text-gray-600 mt-1 line-clamp-1"
                        style={{ fontSize: `${0.875 * fontScale}rem` }}
                      >
                        {item.content}
                      </p>
                    )}

                    {item.is_completed && item.completed_at && (
                      <p
                        className={`text-green-600 mt-1 ${getFontWeight()}`}
                        style={{ fontSize: `${0.85 * fontScale}rem` }}
                      >
                        ✅ {formatTime(item.completed_at)} 완료함
                      </p>
                    )}
                  </div>

                  {/* 시간 및 체크 버튼 */}
                  <div className="flex flex-col items-end gap-2">
                    <div
                      className={`flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-orange-100 whitespace-nowrap shrink-0 ${getFontWeight()}`}
                      style={{ fontSize: `${0.875 * fontScale}rem` }}
                    >
                      <Clock
                        style={{
                          width: 14 * fontScale,
                          height: 14 * fontScale,
                        }}
                      />
                      {item.time}
                    </div>

                    <button
                      onClick={(e) => handleToggleComplete(e, item)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      {item.is_completed ? (
                        <CheckCircle2
                          className="text-green-500 fill-green-100"
                          style={{
                            width: 32 * fontScale,
                            height: 32 * fontScale,
                          }}
                        />
                      ) : (
                        <Circle
                          className="text-gray-300 hover:text-orange-400"
                          style={{
                            width: 32 * fontScale,
                            height: 32 * fontScale,
                          }}
                        />
                      )}
                    </button>
                  </div>
                </div>
              ))}

              {weeklyItems.length > 4 && (
                <Button
                  variant="ghost"
                  className="w-full text-orange-600 hover:bg-orange-50"
                  onClick={() => setShowAll(!showAll)}
                  style={{ fontSize: `${0.875 * fontScale}rem` }}
                >
                  {showAll ? "접기" : `더보기 (${weeklyItems.length - 4}개)`}
                  <ChevronDown
                    className={`ml-2 transition-transform ${
                      showAll ? "rotate-180" : ""
                    }`}
                    style={{ width: 16 * fontScale, height: 16 * fontScale }}
                  />
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontSize: `${1.125 * fontScale}rem` }}>
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
                <Label style={{ fontSize: `${0.875 * fontScale}rem` }}>
                  제목
                </Label>
                <Input
                  placeholder="일정 제목을 입력하세요"
                  value={newEntry.title}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, title: e.target.value })
                  }
                  style={{ fontSize: `${1 * fontScale}rem` }}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ fontSize: `${0.875 * fontScale}rem` }}>
                  날짜
                </Label>
                <Input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, date: e.target.value })
                  }
                  style={{ fontSize: `${1 * fontScale}rem` }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ fontSize: `${0.875 * fontScale}rem` }}>
                  시간
                </Label>
                <Input
                  type="time"
                  value={newEntry.time}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, time: e.target.value })
                  }
                  style={{ fontSize: `${1 * fontScale}rem` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label style={{ fontSize: `${0.875 * fontScale}rem` }}>
                {dialogType === "schedule" ? "메모" : "내용"}
              </Label>
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
                style={{ fontSize: `${1 * fontScale}rem` }}
              />
            </div>
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600"
              onClick={handleAddEntry}
              style={{ fontSize: `${1 * fontScale}rem` }}
            >
              저장
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
