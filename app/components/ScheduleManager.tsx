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

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface CustomCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  scheduleDates: Set<string>;
  fontScale: number; // ✨ 추가
}

function CustomCalendar({
  selectedDate,
  onSelectDate,
  scheduleDates,
  fontScale,
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

  const isToday = (date: Date) =>
    formatLocalDate(date) === formatLocalDate(new Date());
  const isSelected = (date: Date) =>
    formatLocalDate(date) === formatLocalDate(selectedDate);
  const hasSchedule = (date: Date) => scheduleDates.has(formatLocalDate(date));

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
        <Button
          variant="ghost"
          size="sm"
          onClick={prevMonth}
          className="hover:bg-orange-50"
        >
          <ChevronLeft
            style={{ width: 16 * fontScale, height: 16 * fontScale }}
          />
        </Button>
        <h3
          className="font-semibold text-gray-800"
          style={{ fontSize: `${1 * fontScale}rem` }}
        >
          {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={nextMonth}
          className="hover:bg-orange-50"
        >
          <ChevronRight
            style={{ width: 16 * fontScale, height: 16 * fontScale }}
          />
        </Button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((day, idx) => (
          <div
            key={day}
            className={`text-center font-medium py-1 ${
              idx === 0
                ? "text-rose-500"
                : idx === 6
                ? "text-orange-500"
                : "text-gray-500"
            }`}
            style={{ fontSize: `${0.75 * fontScale}rem` }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((date, index) => (
          <div key={index} className="p-0.5">
            {date ? (
              <button
                onClick={() => onSelectDate(date)}
                className={`
                  w-full rounded-md flex items-center justify-center transition-all
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
                style={{
                  height: `${2 * fontScale}rem`,
                  fontSize: `${0.875 * fontScale}rem`,
                }}
              >
                {date.getDate()}
              </button>
            ) : (
              <div style={{ height: `${2 * fontScale}rem` }} />
            )}
          </div>
        ))}
      </div>

      {/* 범례 */}
      <div
        className="flex items-center justify-center gap-4 mt-3 text-gray-500"
        style={{ fontSize: `${0.75 * fontScale}rem` }}
      >
        <div className="flex items-center gap-1">
          <div
            className="rounded-sm bg-orange-500"
            style={{ width: 12 * fontScale, height: 12 * fontScale }}
          />
          <span>선택</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="rounded-sm bg-amber-100"
            style={{ width: 12 * fontScale, height: 12 * fontScale }}
          />
          <span>일정 있음</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="rounded-sm bg-orange-100"
            style={{ width: 12 * fontScale, height: 12 * fontScale }}
          />
          <span>오늘</span>
        </div>
      </div>
    </div>
  );
}

interface ScheduleManagerProps {
  fontScale?: number; // ✨ 추가
}

export function ScheduleManager({ fontScale = 1 }: ScheduleManagerProps) {
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

  const getFontWeight = () => {
    if (fontScale >= 1.5) return "font-semibold";
    if (fontScale >= 1.2) return "font-medium";
    return "font-normal";
  };

  useEffect(() => {
    const init = async () => {
      const { user } = await getCurrentUser();
      if (user) loadSchedules();
    };
    init();
  }, []);

  const scheduleDates = useMemo(
    () => new Set(schedules.map((s) => s.date)),
    [schedules]
  );

  const filteredSchedules = useMemo(() => {
    if (showAllSchedules) return schedules;
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
        <h2
          className={`font-bold ${getFontWeight()}`}
          style={{ fontSize: `${1.25 * fontScale}rem` }}
        >
          일정 관리
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-orange-500 hover:bg-orange-600"
              style={{ fontSize: `${0.875 * fontScale}rem` }}
            >
              <Plus
                style={{
                  width: 16 * fontScale,
                  height: 16 * fontScale,
                  marginRight: 4,
                }}
              />
              일정 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle style={{ fontSize: `${1.125 * fontScale}rem` }}>
                📅 새 일정 추가
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label style={{ fontSize: `${0.875 * fontScale}rem` }}>
                  제목 *
                </Label>
                <Input
                  placeholder="일정 제목을 입력하세요"
                  value={newSchedule.title}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, title: e.target.value })
                  }
                  style={{ fontSize: `${1 * fontScale}rem` }}
                />
              </div>

              <div className="space-y-2">
                <Label style={{ fontSize: `${0.875 * fontScale}rem` }}>
                  카테고리
                </Label>
                <Select
                  value={newSchedule.category}
                  onValueChange={(value: Schedule["category"]) =>
                    setNewSchedule({ ...newSchedule, category: value })
                  }
                >
                  <SelectTrigger style={{ fontSize: `${1 * fontScale}rem` }}>
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
                  <Label style={{ fontSize: `${0.875 * fontScale}rem` }}>
                    날짜 *
                  </Label>
                  <Input
                    type="date"
                    value={newSchedule.date}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, date: e.target.value })
                    }
                    style={{ fontSize: `${1 * fontScale}rem` }}
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ fontSize: `${0.875 * fontScale}rem` }}>
                    시간 *
                  </Label>
                  <Input
                    type="time"
                    value={newSchedule.time}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, time: e.target.value })
                    }
                    style={{ fontSize: `${1 * fontScale}rem` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label style={{ fontSize: `${0.875 * fontScale}rem` }}>
                  장소
                </Label>
                <Input
                  placeholder="장소를 입력하세요"
                  value={newSchedule.location}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, location: e.target.value })
                  }
                  style={{ fontSize: `${1 * fontScale}rem` }}
                />
              </div>

              <div className="space-y-2">
                <Label style={{ fontSize: `${0.875 * fontScale}rem` }}>
                  메모
                </Label>
                <Textarea
                  placeholder="메모를 입력하세요"
                  value={newSchedule.notes}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, notes: e.target.value })
                  }
                  style={{ fontSize: `${1 * fontScale}rem` }}
                />
              </div>

              <Button
                className="w-full bg-orange-500 hover:bg-orange-600"
                onClick={handleAddSchedule}
                style={{ fontSize: `${1 * fontScale}rem` }}
              >
                저장
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 커스텀 달력 */}
      <Card className="border-orange-100">
        <CardContent style={{ padding: `${1 * fontScale}rem` }}>
          <CustomCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            scheduleDates={scheduleDates}
            fontScale={fontScale}
          />
        </CardContent>
      </Card>

      {/* 선택된 날짜 및 토글 */}
      <div className="flex items-center justify-between">
        <h3
          className={`text-gray-700 ${getFontWeight()}`}
          style={{ fontSize: `${0.875 * fontScale}rem` }}
        >
          {showAllSchedules ? "전체 일정" : formatSelectedDate()}
        </h3>
        <Button
          variant="outline"
          onClick={() => setShowAllSchedules(!showAllSchedules)}
          className="border-orange-200 text-orange-600 hover:bg-orange-50"
          style={{ fontSize: `${0.875 * fontScale}rem` }}
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
            <CardContent
              className="text-center text-gray-500"
              style={{
                padding: `${1.5 * fontScale}rem`,
                fontSize: `${1 * fontScale}rem`,
              }}
            >
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
              <CardContent style={{ padding: `${0.75 * fontScale}rem` }}>
                <div className="flex gap-3">
                  {/* 왼쪽 날짜 */}
                  <div
                    className="flex flex-col items-center justify-center border-r border-orange-100"
                    style={{
                      minWidth: `${2.5 * fontScale}rem`,
                      paddingRight: `${0.75 * fontScale}rem`,
                    }}
                  >
                    <div
                      className="text-gray-400"
                      style={{ fontSize: `${0.75 * fontScale}rem` }}
                    >
                      {schedule.date.split("-")[1]}월
                    </div>
                    <div
                      className="text-orange-600 font-bold"
                      style={{ fontSize: `${1.25 * fontScale}rem` }}
                    >
                      {schedule.date.split("-")[2]}
                    </div>
                  </div>

                  {/* 오른쪽 내용 */}
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`rounded ${getFontWeight()} ${getCategoryColor(
                          schedule.category
                        )}`}
                        style={{
                          fontSize: `${0.75 * fontScale}rem`,
                          padding: `${0.125 * fontScale}rem ${
                            0.375 * fontScale
                          }rem`,
                        }}
                      >
                        {getCategoryLabel(schedule.category)}
                      </span>
                    </div>

                    <h3
                      className={`text-gray-900 truncate ${getFontWeight()}`}
                      style={{ fontSize: `${0.875 * fontScale}rem` }}
                    >
                      {schedule.title}
                    </h3>

                    <div
                      className="h-px bg-orange-100 w-full"
                      style={{ margin: `${0.5 * fontScale}rem 0` }}
                    />

                    <div
                      className="text-gray-500 flex items-center gap-2"
                      style={{ fontSize: `${0.75 * fontScale}rem` }}
                    >
                      <div className="flex items-center gap-1">
                        <Clock
                          style={{
                            width: 12 * fontScale,
                            height: 12 * fontScale,
                          }}
                          className="text-orange-400"
                        />
                        <span>{schedule.time}</span>
                      </div>
                      {schedule.location && (
                        <div className="flex items-center gap-1 truncate">
                          <MapPin
                            style={{
                              width: 12 * fontScale,
                              height: 12 * fontScale,
                            }}
                            className="text-orange-400 flex-shrink-0"
                          />
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
            <DialogTitle style={{ fontSize: `${1.125 * fontScale}rem` }}>
              상세 정보
            </DialogTitle>
          </DialogHeader>

          {selectedSchedule && (
            <div className="space-y-4">
              <div>
                <span
                  className={`rounded ${getFontWeight()} ${getCategoryColor(
                    selectedSchedule.category
                  )}`}
                  style={{
                    fontSize: `${0.75 * fontScale}rem`,
                    padding: `${0.25 * fontScale}rem ${0.5 * fontScale}rem`,
                  }}
                >
                  {getCategoryLabel(selectedSchedule.category)}
                </span>
                <h2
                  className={`font-bold mt-2 ${getFontWeight()}`}
                  style={{ fontSize: `${1.25 * fontScale}rem` }}
                >
                  {selectedSchedule.title}
                </h2>
              </div>

              <div
                className="space-y-2 text-gray-600"
                style={{ fontSize: `${0.875 * fontScale}rem` }}
              >
                <div className="flex items-center gap-2">
                  <CalendarIcon
                    style={{ width: 16 * fontScale, height: 16 * fontScale }}
                    className="text-orange-500"
                  />
                  {selectedSchedule.date}
                </div>
                <div className="flex items-center gap-2">
                  <Clock
                    style={{ width: 16 * fontScale, height: 16 * fontScale }}
                    className="text-orange-500"
                  />
                  {selectedSchedule.time}
                </div>
                {selectedSchedule.location && (
                  <div className="flex items-center gap-2">
                    <MapPin
                      style={{ width: 16 * fontScale, height: 16 * fontScale }}
                      className="text-orange-500"
                    />
                    {selectedSchedule.location}
                  </div>
                )}
              </div>

              {selectedSchedule.notes && (
                <div
                  className="bg-orange-50 rounded-md"
                  style={{ padding: `${0.75 * fontScale}rem` }}
                >
                  <p
                    className={`text-orange-700 mb-1 ${getFontWeight()}`}
                    style={{ fontSize: `${0.875 * fontScale}rem` }}
                  >
                    메모
                  </p>
                  <p
                    className="text-gray-600 whitespace-pre-wrap"
                    style={{ fontSize: `${0.875 * fontScale}rem` }}
                  >
                    {selectedSchedule.notes}
                  </p>
                </div>
              )}

              <DialogFooter className="mt-6 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
                  className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50"
                  style={{ fontSize: `${1 * fontScale}rem` }}
                >
                  닫기
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex-1"
                  style={{ fontSize: `${1 * fontScale}rem` }}
                >
                  <Trash2
                    style={{
                      width: 16 * fontScale,
                      height: 16 * fontScale,
                      marginRight: 8,
                    }}
                  />
                  삭제
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
