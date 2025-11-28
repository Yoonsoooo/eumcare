"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
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

interface Schedule {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  notes?: string;
  category: "hospital" | "medicine" | "therapy" | "other";
  reminder: boolean;
  authorName: string;
}

// ✅ 로컬 날짜를 YYYY-MM-DD 형식으로 변환 (UTC 문제 해결)
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 커스텀 달력 컴포넌트
interface CustomCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  scheduleDates: Set<string>;
}

function CustomCalendar({
  selectedDate,
  onSelectDate,
  scheduleDates,
}: CustomCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentMonth]);

  const isToday = (date: Date) => {
    return formatLocalDate(date) === formatLocalDate(new Date());
  };

  const isSelected = (date: Date) => {
    return formatLocalDate(date) === formatLocalDate(selectedDate);
  };

  const hasSchedule = (date: Date) => {
    return scheduleDates.has(formatLocalDate(date));
  };

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        {/* ✨ 버튼 호버 색상 변경 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={prevMonth}
          className="hover:bg-orange-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-base font-semibold text-gray-800">
          {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={nextMonth}
          className="hover:bg-orange-50"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((day, idx) => (
          <div
            key={day}
            className={`text-center text-xs font-medium py-1 ${
              idx === 0
                ? "text-rose-500"
                : idx === 6
                ? "text-orange-500"
                : "text-gray-500"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 - ✨ 색상 따뜻한 톤으로 변경 */}
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((date, index) => (
          <div key={index} className="p-0.5">
            {date ? (
              <button
                onClick={() => onSelectDate(date)}
                className={`
                  w-full h-8 rounded-md flex items-center justify-center
                  text-sm transition-all relative
                  ${
                    isSelected(date)
                      ? "bg-orange-500 text-white font-bold"
                      : isToday(date)
                      ? "bg-orange-100 text-orange-700 font-semibold"
                      : hasSchedule(date)
                      ? "bg-amber-100 text-amber-700 font-medium"
                      : "hover:bg-orange-50 text-gray-700"
                  }
                  ${
                    date.getDay() === 0 &&
                    !isSelected(date) &&
                    !hasSchedule(date)
                      ? "text-rose-500"
                      : ""
                  }
                  ${
                    date.getDay() === 6 &&
                    !isSelected(date) &&
                    !hasSchedule(date)
                      ? "text-orange-500"
                      : ""
                  }
                `}
              >
                {date.getDate()}
              </button>
            ) : (
              <div className="w-full h-8" />
            )}
          </div>
        ))}
      </div>

      {/* 범례 - ✨ 색상 변경 */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-orange-500" />
          <span>선택</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-amber-100" />
          <span>일정 있음</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-orange-100" />
          <span>오늘</span>
        </div>
      </div>
    </div>
  );
}

export function ScheduleManager() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAllSchedules, setShowAllSchedules] = useState(false);

  const [newSchedule, setNewSchedule] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    notes: "",
    category: "other" as Schedule["category"],
    reminder: true,
  });

  useEffect(() => {
    const init = async () => {
      const { user } = await getCurrentUser();
      if (user) loadSchedules();
    };
    init();
  }, []);

  // 일정이 있는 날짜들의 Set
  const scheduleDates = useMemo(() => {
    return new Set(schedules.map((s) => s.date));
  }, [schedules]);

  // 선택된 날짜의 일정들
  const filteredSchedules = useMemo(() => {
    if (showAllSchedules) {
      return schedules;
    }
    const dateStr = formatLocalDate(selectedDate);
    return schedules.filter((s) => s.date === dateStr);
  }, [schedules, selectedDate, showAllSchedules]);

  async function loadSchedules() {
    try {
      const { data } = await apiClient.getSchedules();
      if (data) {
        setSchedules(
          data.sort(
            (a: Schedule, b: Schedule) =>
              new Date(a.date + " " + a.time).getTime() -
              new Date(b.date + " " + b.time).getTime()
          )
        );
      }
    } catch (error) {
      console.error("Failed to load schedules:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddSchedule = async () => {
    if (!newSchedule.title || !newSchedule.date || !newSchedule.time) {
      toast.error("제목, 날짜, 시간을 모두 입력해주세요");
      return;
    }
    try {
      const { user } = await getCurrentUser();
      if (!user) {
        toast.error("로그인이 필요합니다.");
        return;
      }
      const { data } = await apiClient.addSchedule(newSchedule);
      if (data) {
        toast.success("일정이 추가되었습니다!");
        setIsDialogOpen(false);
        setNewSchedule({
          title: "",
          date: "",
          time: "",
          location: "",
          notes: "",
          category: "other",
          reminder: true,
        });
        loadSchedules();
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("저장에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!selectedSchedule) return;

    if (confirm("정말 이 일정을 삭제하시겠습니까?")) {
      try {
        await apiClient.deleteSchedule(selectedSchedule.id);
        toast.success("일정이 삭제되었습니다.");
        setIsDetailOpen(false);
        setSelectedSchedule(null);
        loadSchedules();
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("삭제에 실패했습니다.");
      }
    }
  };

  const getCategoryLabel = (c: string) =>
    c === "hospital"
      ? "🏥 병원"
      : c === "medicine"
      ? "💊 약 복용"
      : c === "therapy"
      ? "🩺 치료"
      : "📌 기타";

  // ✨ 카테고리 색상 따뜻한 톤으로 변경
  const getCategoryColor = (c: string) =>
    c === "hospital"
      ? "bg-rose-100 text-rose-700"
      : c === "medicine"
      ? "bg-amber-100 text-amber-700"
      : c === "therapy"
      ? "bg-orange-100 text-orange-700"
      : "bg-gray-100 text-gray-700";

  const formatSelectedDate = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const weekDay = ["일", "월", "화", "수", "목", "금", "토"][
      selectedDate.getDay()
    ];
    return `${year}년 ${month}월 ${day}일 (${weekDay})`;
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">일정 관리</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            {/* ✨ 버튼 색상 변경 */}
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-1" />
              일정 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>📅 새 일정 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>제목 *</Label>
                <Input
                  placeholder="일정 제목을 입력하세요"
                  value={newSchedule.title}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>카테고리</Label>
                <Select
                  value={newSchedule.category}
                  onValueChange={(value: Schedule["category"]) =>
                    setNewSchedule({ ...newSchedule, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hospital">🏥 병원</SelectItem>
                    <SelectItem value="medicine">💊 약 복용</SelectItem>
                    <SelectItem value="therapy">🩺 치료</SelectItem>
                    <SelectItem value="other">📌 기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>날짜 *</Label>
                  <Input
                    type="date"
                    value={newSchedule.date}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>시간 *</Label>
                  <Input
                    type="time"
                    value={newSchedule.time}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, time: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>장소</Label>
                <Input
                  placeholder="장소를 입력하세요"
                  value={newSchedule.location}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, location: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>메모</Label>
                <Textarea
                  placeholder="메모를 입력하세요"
                  value={newSchedule.notes}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, notes: e.target.value })
                  }
                />
              </div>

              {/* ✨ 저장 버튼 색상 변경 */}
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600"
                onClick={handleAddSchedule}
              >
                저장
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 커스텀 달력 - ✨ 테두리 색상 변경 */}
      <Card className="border-orange-100">
        <CardContent className="p-4">
          <CustomCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            scheduleDates={scheduleDates}
          />
        </CardContent>
      </Card>

      {/* 선택된 날짜 및 토글 */}
      <div className="flex items-center justify-between">
        <h3 className="text-gray-700 font-medium text-sm">
          {showAllSchedules ? "전체 일정" : formatSelectedDate()}
        </h3>
        {/* ✨ 토글 버튼 색상 변경 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAllSchedules(!showAllSchedules)}
          className="border-orange-200 text-orange-600 hover:bg-orange-50"
        >
          {showAllSchedules ? "선택한 날짜만" : "전체 보기"}
        </Button>
      </div>

      {/* 일정 목록 */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
            로딩 중...
          </div>
        ) : filteredSchedules.length === 0 ? (
          <Card className="border-orange-100">
            <CardContent className="p-6 text-center text-gray-500">
              {showAllSchedules
                ? "등록된 일정이 없습니다."
                : "선택한 날짜에 일정이 없습니다."}
            </CardContent>
          </Card>
        ) : (
          filteredSchedules.map((schedule) => (
            <Card
              key={schedule.id}
              className="cursor-pointer hover:bg-orange-50/50 hover:border-orange-200 transition-colors border border-orange-100 shadow-sm"
              onClick={() => {
                setSelectedSchedule(schedule);
                setIsDetailOpen(true);
              }}
            >
              <CardContent className="p-3">
                <div className="flex gap-3">
                  {/* 왼쪽 날짜 - ✨ 색상 변경 */}
                  <div className="flex flex-col items-center justify-center min-w-[2.5rem] border-r border-orange-100 pr-3">
                    <div className="text-xs text-gray-400">
                      {schedule.date.split("-")[1]}월
                    </div>
                    <div className="text-orange-600 font-bold text-xl">
                      {schedule.date.split("-")[2]}
                    </div>
                  </div>

                  {/* 오른쪽 내용 */}
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-1.5 py-0.5 text-xs rounded font-medium ${getCategoryColor(
                          schedule.category
                        )}`}
                      >
                        {getCategoryLabel(schedule.category)}
                      </span>
                    </div>

                    <h3 className="font-semibold text-sm text-gray-900 truncate">
                      {schedule.title}
                    </h3>

                    {/* ✨ 구분선 색상 변경 */}
                    <div className="h-px bg-orange-100 my-2 w-full" />

                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-orange-400" />
                        <span>{schedule.time}</span>
                      </div>
                      {schedule.location && (
                        <div className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0 text-orange-400" />
                          <span className="truncate">{schedule.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 상세보기 팝업 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>상세 정보</DialogTitle>
          </DialogHeader>

          {selectedSchedule && (
            <div className="space-y-4">
              <div>
                <span
                  className={`px-2 py-1 text-xs rounded font-medium ${getCategoryColor(
                    selectedSchedule.category
                  )}`}
                >
                  {getCategoryLabel(selectedSchedule.category)}
                </span>
                <h2 className="text-xl font-bold mt-2">
                  {selectedSchedule.title}
                </h2>
              </div>

              {/* ✨ 아이콘 색상 변경 */}
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-orange-500" />{" "}
                  {selectedSchedule.date}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />{" "}
                  {selectedSchedule.time}
                </div>
                {selectedSchedule.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-500" />{" "}
                    {selectedSchedule.location}
                  </div>
                )}
              </div>

              {selectedSchedule.notes && (
                <div className="bg-orange-50 p-3 rounded-md text-sm">
                  <p className="font-medium mb-1 text-orange-700">메모</p>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {selectedSchedule.notes}
                  </p>
                </div>
              )}

              <DialogFooter className="mt-6 gap-2">
                {/* ✨ 닫기 버튼 색상 변경 */}
                <Button
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
                  className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50"
                >
                  닫기
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> 삭제
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
