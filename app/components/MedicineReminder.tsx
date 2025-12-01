"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Plus,
  Trash2,
  Clock,
  Pill,
  Check,
  Volume2,
  BellRing,
  Users,
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
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";

interface MedicineReminder {
  id: string;
  medicineName: string;
  time: string;
  days: string[];
  notifyFamily: boolean;
  familyDelayMinutes: number;
  isActive: boolean;
  lastConfirmed?: string;
}

interface MedicineReminderProps {
  fontScale?: number; // ✨ 추가
}

// 알림 권한 요청
async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    toast.error("이 브라우저는 알림을 지원하지 않습니다");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

// 브라우저 알림 보내기
function sendBrowserNotification(
  title: string,
  body: string,
  requireInteraction: boolean = true
) {
  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      body,
      icon: "/pill-icon.png",
      badge: "/badge-icon.png",
      tag: "medicine-reminder",
      requireInteraction,
      vibrate: [200, 100, 200],
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  }
}

// 알림음 재생
function playAlarmSound() {
  const audio = new Audio("/alarm-sound.mp3");
  audio.loop = true;
  audio.play();
  return audio;
}

export function MedicineReminder({ fontScale = 1 }: MedicineReminderProps) {
  const [reminders, setReminders] = useState<MedicineReminder[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState<{
    reminder: MedicineReminder;
    audio: HTMLAudioElement | null;
  } | null>(null);

  const [newReminder, setNewReminder] = useState({
    medicineName: "",
    time: "09:00",
    days: ["월", "화", "수", "목", "금", "토", "일"],
    notifyFamily: true,
    familyDelayMinutes: 5,
  });

  // ✨ fontScale에 따른 font-weight
  const getFontWeight = () => {
    if (fontScale >= 1.5) return "font-semibold";
    if (fontScale >= 1.2) return "font-medium";
    return "font-normal";
  };

  // 로컬 스토리지에서 알림 불러오기
  useEffect(() => {
    const saved = localStorage.getItem("medicineReminders");
    if (saved) {
      setReminders(JSON.parse(saved));
    }

    if ("Notification" in window && Notification.permission === "granted") {
      setNotificationEnabled(true);
    }

    const interval = setInterval(checkReminders, 60000);
    checkReminders();

    return () => clearInterval(interval);
  }, []);

  // 알림 저장
  useEffect(() => {
    localStorage.setItem("medicineReminders", JSON.stringify(reminders));
  }, [reminders]);

  // 현재 시간에 알림이 있는지 체크
  function checkReminders() {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const currentDay = ["일", "월", "화", "수", "목", "금", "토"][now.getDay()];

    reminders.forEach((reminder) => {
      if (
        reminder.isActive &&
        reminder.time === currentTime &&
        reminder.days.includes(currentDay)
      ) {
        const today = now.toDateString();
        if (reminder.lastConfirmed !== today) {
          triggerAlarm(reminder);
        }
      }
    });
  }

  // 알람 트리거
  function triggerAlarm(reminder: MedicineReminder) {
    sendBrowserNotification(
      "💊 약 복용 시간이에요!",
      `${reminder.medicineName}을(를) 복용할 시간입니다.`,
      true
    );

    const audio = playAlarmSound();
    setActiveAlarm({ reminder, audio });

    if (reminder.notifyFamily) {
      setTimeout(() => {
        const stillActive = document.querySelector(
          '[data-alarm-active="true"]'
        );
        if (stillActive) {
          notifyFamily(reminder);
        }
      }, reminder.familyDelayMinutes * 60 * 1000);
    }
  }

  // 가족에게 알림
  function notifyFamily(reminder: MedicineReminder) {
    toast.error(
      `⚠️ 가족 알림: ${reminder.medicineName} 복용이 확인되지 않았습니다!`,
      { duration: 10000 }
    );

    sendBrowserNotification(
      "⚠️ 약 복용 미확인",
      `${reminder.medicineName} 복용이 ${reminder.familyDelayMinutes}분 동안 확인되지 않았습니다.`,
      true
    );
  }

  // 알람 확인 (끄기)
  function confirmAlarm() {
    if (activeAlarm) {
      if (activeAlarm.audio) {
        activeAlarm.audio.pause();
        activeAlarm.audio.currentTime = 0;
      }

      setReminders((prev) =>
        prev.map((r) =>
          r.id === activeAlarm.reminder.id
            ? { ...r, lastConfirmed: new Date().toDateString() }
            : r
        )
      );

      setActiveAlarm(null);
      toast.success("✅ 약 복용이 확인되었습니다!");
    }
  }

  // 알림 권한 요청
  async function handleEnableNotification() {
    const granted = await requestNotificationPermission();
    setNotificationEnabled(granted);
    if (granted) {
      toast.success("알림이 활성화되었습니다!");
      sendBrowserNotification(
        "알림 테스트",
        "알림이 정상적으로 작동합니다!",
        false
      );
    } else {
      toast.error(
        "알림 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요."
      );
    }
  }

  // 알림 추가
  function handleAddReminder() {
    if (!newReminder.medicineName || !newReminder.time) {
      toast.error("약 이름과 시간을 입력해주세요");
      return;
    }

    const reminder: MedicineReminder = {
      id: Date.now().toString(),
      ...newReminder,
      isActive: true,
    };

    setReminders((prev) => [...prev, reminder]);
    setIsDialogOpen(false);
    setNewReminder({
      medicineName: "",
      time: "09:00",
      days: ["월", "화", "수", "목", "금", "토", "일"],
      notifyFamily: true,
      familyDelayMinutes: 5,
    });
    toast.success("알림이 설정되었습니다!");
  }

  // 알림 삭제
  function handleDeleteReminder(id: string) {
    if (confirm("이 알림을 삭제하시겠습니까?")) {
      setReminders((prev) => prev.filter((r) => r.id !== id));
      toast.success("알림이 삭제되었습니다");
    }
  }

  // 알림 토글
  function toggleReminder(id: string) {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
  }

  // 요일 토글
  function toggleDay(day: string) {
    setNewReminder((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  }

  const weekDays = ["월", "화", "수", "목", "금", "토", "일"];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* 활성화된 알람 팝업 */}
      {activeAlarm && (
        <div
          data-alarm-active="true"
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <Card className="w-full max-w-sm animate-pulse border-orange-500 border-2">
            <CardContent
              style={{ padding: `${1.5 * fontScale}rem` }}
              className="text-center"
            >
              <div
                className="rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4 animate-bounce"
                style={{ width: 80 * fontScale, height: 80 * fontScale }}
              >
                <BellRing
                  className="text-orange-600"
                  style={{ width: 40 * fontScale, height: 40 * fontScale }}
                />
              </div>
              <h2
                className={`text-gray-900 mb-2 ${getFontWeight()}`}
                style={{ fontSize: `${1.5 * fontScale}rem` }}
              >
                💊 약 복용 시간!
              </h2>
              <p
                className={`text-orange-600 mb-4 ${getFontWeight()}`}
                style={{ fontSize: `${1.125 * fontScale}rem` }}
              >
                {activeAlarm.reminder.medicineName}
              </p>
              <p
                className="text-gray-500 mb-6"
                style={{ fontSize: `${0.875 * fontScale}rem` }}
              >
                {activeAlarm.reminder.notifyFamily && (
                  <>
                    {activeAlarm.reminder.familyDelayMinutes}분 내 확인하지
                    않으면
                    <br />
                    가족에게 알림이 갑니다
                  </>
                )}
              </p>
              <Button
                className="w-full bg-green-500 hover:bg-green-600"
                onClick={confirmAlarm}
                style={{
                  fontSize: `${1.125 * fontScale}rem`,
                  padding: `${1.5 * fontScale}rem`,
                }}
              >
                <Check
                  style={{
                    width: 24 * fontScale,
                    height: 24 * fontScale,
                    marginRight: 8,
                  }}
                />
                복용 완료
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className={`font-bold ${getFontWeight()}`}
            style={{ fontSize: `${1.25 * fontScale}rem` }}
          >
            💊 약 복용 알림
          </h2>
          <p
            className="text-gray-500 mt-1"
            style={{ fontSize: `${0.875 * fontScale}rem` }}
          >
            설정한 시간에 알림을 받으세요
          </p>
        </div>
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
                  marginRight: 8,
                }}
              />
              알림 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle style={{ fontSize: `${1.125 * fontScale}rem` }}>
                🔔 새 약 복용 알림
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {/* 약 이름 */}
              <div className="space-y-2">
                <Label style={{ fontSize: `${0.875 * fontScale}rem` }}>
                  약 이름 *
                </Label>
                <Input
                  placeholder="예: 혈압약, 당뇨약"
                  value={newReminder.medicineName}
                  onChange={(e) =>
                    setNewReminder({
                      ...newReminder,
                      medicineName: e.target.value,
                    })
                  }
                  style={{ fontSize: `${1 * fontScale}rem` }}
                />
              </div>

              {/* 시간 */}
              <div className="space-y-2">
                <Label style={{ fontSize: `${0.875 * fontScale}rem` }}>
                  알림 시간 *
                </Label>
                <Input
                  type="time"
                  value={newReminder.time}
                  onChange={(e) =>
                    setNewReminder({ ...newReminder, time: e.target.value })
                  }
                  style={{ fontSize: `${1.125 * fontScale}rem` }}
                />
              </div>

              {/* 요일 선택 */}
              <div className="space-y-2">
                <Label style={{ fontSize: `${0.875 * fontScale}rem` }}>
                  반복 요일
                </Label>
                <div className="flex gap-1">
                  {weekDays.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`rounded-full font-medium transition-colors ${
                        newReminder.days.includes(day)
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      style={{
                        width: 40 * fontScale,
                        height: 40 * fontScale,
                        fontSize: `${0.875 * fontScale}rem`,
                      }}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* 구분선 */}
              <div className="h-px bg-orange-100 my-4" />

              {/* 가족 알림 설정 */}
              <div
                className="space-y-4 bg-orange-50 rounded-lg"
                style={{ padding: `${1 * fontScale}rem` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users
                      className="text-orange-600"
                      style={{ width: 20 * fontScale, height: 20 * fontScale }}
                    />
                    <Label
                      className={getFontWeight()}
                      style={{ fontSize: `${0.875 * fontScale}rem` }}
                    >
                      미확인 시 가족에게 알림
                    </Label>
                  </div>
                  <Switch
                    checked={newReminder.notifyFamily}
                    onCheckedChange={(checked) =>
                      setNewReminder({ ...newReminder, notifyFamily: checked })
                    }
                  />
                </div>

                {newReminder.notifyFamily && (
                  <div className="space-y-2">
                    <Label style={{ fontSize: `${0.875 * fontScale}rem` }}>
                      알림 대기 시간
                    </Label>
                    <Select
                      value={String(newReminder.familyDelayMinutes)}
                      onValueChange={(v) =>
                        setNewReminder({
                          ...newReminder,
                          familyDelayMinutes: Number(v),
                        })
                      }
                    >
                      <SelectTrigger
                        style={{ fontSize: `${1 * fontScale}rem` }}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3분 후</SelectItem>
                        <SelectItem value="5">5분 후</SelectItem>
                        <SelectItem value="10">10분 후</SelectItem>
                        <SelectItem value="15">15분 후</SelectItem>
                        <SelectItem value="30">30분 후</SelectItem>
                      </SelectContent>
                    </Select>
                    <p
                      className="text-gray-500"
                      style={{ fontSize: `${0.75 * fontScale}rem` }}
                    >
                      이 시간 동안 확인이 없으면 가족에게 알림이 갑니다
                    </p>
                  </div>
                )}
              </div>

              <Button
                className="w-full bg-orange-500 hover:bg-orange-600"
                onClick={handleAddReminder}
                style={{ fontSize: `${1 * fontScale}rem` }}
              >
                알림 설정하기
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 알림 권한 배너 */}
      {!notificationEnabled && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent style={{ padding: `${1 * fontScale}rem` }}>
            <div className="flex items-center gap-3">
              <div
                className="rounded-full bg-amber-100 flex items-center justify-center shrink-0"
                style={{ width: 40 * fontScale, height: 40 * fontScale }}
              >
                <Bell
                  className="text-amber-600"
                  style={{ width: 20 * fontScale, height: 20 * fontScale }}
                />
              </div>
              <div className="flex-1">
                <p
                  className={`text-amber-800 ${getFontWeight()}`}
                  style={{ fontSize: `${0.875 * fontScale}rem` }}
                >
                  알림을 허용해주세요
                </p>
                <p
                  className="text-amber-600"
                  style={{ fontSize: `${0.75 * fontScale}rem` }}
                >
                  약 복용 시간에 알림을 받으려면 권한이 필요합니다
                </p>
              </div>
              <Button
                className="bg-amber-500 hover:bg-amber-600"
                onClick={handleEnableNotification}
                style={{ fontSize: `${0.875 * fontScale}rem` }}
              >
                허용하기
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 테스트 버튼 */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => {
            sendBrowserNotification(
              "테스트 알림",
              "알림이 정상 작동합니다!",
              false
            );
          }}
          className="text-orange-600 border-orange-200"
          style={{ fontSize: `${0.875 * fontScale}rem` }}
        >
          <Bell
            style={{
              width: 16 * fontScale,
              height: 16 * fontScale,
              marginRight: 8,
            }}
          />
          알림 테스트
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (reminders.length > 0) {
              triggerAlarm(reminders[0]);
            } else {
              toast.error("먼저 알림을 추가해주세요");
            }
          }}
          className="text-orange-600 border-orange-200"
          style={{ fontSize: `${0.875 * fontScale}rem` }}
        >
          <Volume2
            style={{
              width: 16 * fontScale,
              height: 16 * fontScale,
              marginRight: 8,
            }}
          />
          알람 테스트
        </Button>
      </div>

      {/* 알림 목록 */}
      <div className="space-y-3">
        {reminders.length === 0 ? (
          <Card className="border-orange-100">
            <CardContent
              className="text-center text-gray-500"
              style={{ padding: `${2 * fontScale}rem` }}
            >
              <Pill
                className="mx-auto mb-3 text-gray-300"
                style={{ width: 48 * fontScale, height: 48 * fontScale }}
              />
              <p style={{ fontSize: `${1 * fontScale}rem` }}>
                설정된 약 복용 알림이 없습니다
              </p>
              <p
                style={{ fontSize: `${0.875 * fontScale}rem` }}
                className="mt-1"
              >
                알림을 추가해보세요!
              </p>
            </CardContent>
          </Card>
        ) : (
          reminders.map((reminder) => (
            <Card
              key={reminder.id}
              className={`border-orange-100 transition-all ${
                !reminder.isActive ? "opacity-50" : ""
              }`}
            >
              <CardContent style={{ padding: `${1 * fontScale}rem` }}>
                <div className="flex items-start gap-4">
                  {/* 아이콘 */}
                  <div
                    className="rounded-full bg-orange-100 flex items-center justify-center shrink-0"
                    style={{ width: 48 * fontScale, height: 48 * fontScale }}
                  >
                    <Pill
                      className="text-orange-600"
                      style={{ width: 24 * fontScale, height: 24 * fontScale }}
                    />
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={`text-gray-900 ${getFontWeight()}`}
                        style={{ fontSize: `${1 * fontScale}rem` }}
                      >
                        {reminder.medicineName}
                      </h3>
                      {reminder.notifyFamily && (
                        <span
                          className="bg-orange-100 text-orange-600 rounded-full flex items-center gap-1"
                          style={{
                            fontSize: `${0.75 * fontScale}rem`,
                            padding: `${0.125 * fontScale}rem ${
                              0.5 * fontScale
                            }rem`,
                          }}
                        >
                          <Users
                            style={{
                              width: 12 * fontScale,
                              height: 12 * fontScale,
                            }}
                          />
                          가족알림
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock
                        style={{
                          width: 16 * fontScale,
                          height: 16 * fontScale,
                        }}
                      />
                      <span
                        className={`text-orange-600 ${getFontWeight()}`}
                        style={{ fontSize: `${1.25 * fontScale}rem` }}
                      >
                        {reminder.time}
                      </span>
                    </div>

                    <div className="flex gap-1 mt-2">
                      {weekDays.map((day) => (
                        <span
                          key={day}
                          className={`rounded-full flex items-center justify-center ${
                            reminder.days.includes(day)
                              ? "bg-orange-500 text-white"
                              : "bg-gray-100 text-gray-400"
                          }`}
                          style={{
                            width: 24 * fontScale,
                            height: 24 * fontScale,
                            fontSize: `${0.75 * fontScale}rem`,
                          }}
                        >
                          {day}
                        </span>
                      ))}
                    </div>

                    {reminder.notifyFamily && (
                      <p
                        className="text-gray-500 mt-2"
                        style={{ fontSize: `${0.75 * fontScale}rem` }}
                      >
                        ⏰ {reminder.familyDelayMinutes}분 미확인 시 가족에게
                        알림
                      </p>
                    )}

                    {reminder.lastConfirmed && (
                      <p
                        className="text-green-600 mt-1"
                        style={{ fontSize: `${0.75 * fontScale}rem` }}
                      >
                        ✅ 마지막 확인: {reminder.lastConfirmed}
                      </p>
                    )}
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="flex flex-col gap-2 items-end">
                    <Switch
                      checked={reminder.isActive}
                      onCheckedChange={() => toggleReminder(reminder.id)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:bg-red-50"
                      onClick={() => handleDeleteReminder(reminder.id)}
                    >
                      <Trash2
                        style={{
                          width: 16 * fontScale,
                          height: 16 * fontScale,
                        }}
                      />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
