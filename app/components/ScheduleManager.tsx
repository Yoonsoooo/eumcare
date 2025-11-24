"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Bell,
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
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Calendar } from "./ui/calendar";
import { apiClient } from "../utils/api";
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

export function ScheduleManager() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
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
    loadSchedules();
  }, []);

  async function loadSchedules() {
    try {
      const { data } = await apiClient.getSchedules();
      setSchedules(
        (data || []).sort(
          (a: Schedule, b: Schedule) =>
            new Date(a.date + " " + a.time).getTime() -
            new Date(b.date + " " + b.time).getTime()
        )
      );
    } catch (error) {
      console.error("Failed to load schedules:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddSchedule = async () => {
    if (!newSchedule.title || !newSchedule.date || !newSchedule.time) return;

    try {
      const { data } = await apiClient.addSchedule(newSchedule);

      const updatedSchedules = [...schedules, data].sort(
        (a, b) =>
          new Date(a.date + " " + a.time).getTime() -
          new Date(b.date + " " + b.time).getTime()
      );

      setSchedules(updatedSchedules);
      setNewSchedule({
        title: "",
        date: "",
        time: "",
        location: "",
        notes: "",
        category: "other",
        reminder: true,
      });
      setIsDialogOpen(false);
      toast.success("일정이 추가되었습니다!");
    } catch (error) {
      console.error("Failed to add schedule:", error);
      toast.error("일정 추가에 실패했습니다");
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "hospital":
        return "병원";
      case "medicine":
        return "약 복용";
      case "therapy":
        return "치료";
      default:
        return "기타";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "hospital":
        return "bg-blue-100 text-blue-700";
      case "medicine":
        return "bg-green-100 text-green-700";
      case "therapy":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <h2>일정 관리</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              일정 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>새 일정 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>일정 유형</Label>
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
                    <SelectItem value="hospital">병원</SelectItem>
                    <SelectItem value="medicine">약 복용</SelectItem>
                    <SelectItem value="therapy">치료</SelectItem>
                    <SelectItem value="other">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>제목</Label>
                <Input
                  placeholder="일정 제목을 입력하세요"
                  value={newSchedule.title}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, title: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>날짜</Label>
                  <Input
                    type="date"
                    value={newSchedule.date}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>시간</Label>
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
                <Label>장소 (선택)</Label>
                <Input
                  placeholder="장소를 입력하세요"
                  value={newSchedule.location}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, location: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>메모 (선택)</Label>
                <Textarea
                  placeholder="메모를 입력하세요"
                  value={newSchedule.notes}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="reminder"
                  checked={newSchedule.reminder}
                  onChange={(e) =>
                    setNewSchedule({
                      ...newSchedule,
                      reminder: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <Label htmlFor="reminder" className="cursor-pointer">
                  알림 받기
                </Label>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDialogOpen(false)}
                >
                  취소
                </Button>
                <Button className="flex-1" onClick={handleAddSchedule}>
                  저장
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar View */}
      <Card>
        <CardContent className="p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md"
          />
        </CardContent>
      </Card>

      {/* Schedule List */}
      <div className="space-y-3">
        <h3 className="text-gray-700">예정된 일정</h3>
        {schedules.map((schedule) => (
          <Card key={schedule.id}>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="flex flex-col items-center pt-1">
                  <div className="text-blue-600">
                    {schedule.date.split("-")[2]}
                  </div>
                  <div className="text-xs text-gray-500">
                    {schedule.date.split("-")[1]}월
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${getCategoryColor(
                        schedule.category
                      )}`}
                    >
                      {getCategoryLabel(schedule.category)}
                    </span>
                    {schedule.reminder && (
                      <Bell className="w-3 h-3 text-gray-400" />
                    )}
                  </div>
                  <h3 className="text-gray-900 mb-1">{schedule.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{schedule.time}</span>
                    </div>
                    {schedule.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{schedule.location}</span>
                      </div>
                    )}
                  </div>
                  {schedule.notes && (
                    <p className="text-sm text-gray-500 mt-2">
                      {schedule.notes}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs text-blue-600">
                        {schedule.authorName[0]}
                      </span>
                    </div>
                    <span className="text-xs text-gray-600">
                      {schedule.authorName}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
