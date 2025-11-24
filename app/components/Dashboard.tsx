"use client";

import { Plus, Bell, Calendar, Pill, Utensils } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

export function Dashboard() {
  const upcomingSchedules = [
    {
      id: 1,
      title: "내과 정기검진",
      date: "2025-11-25",
      time: "14:00",
      type: "hospital",
    },
    {
      id: 2,
      title: "약 복용 - 혈압약",
      date: "2025-11-24",
      time: "09:00",
      type: "medicine",
    },
    {
      id: 3,
      title: "물리치료",
      date: "2025-11-26",
      time: "10:30",
      type: "hospital",
    },
  ];

  const recentActivities = [
    {
      id: 1,
      member: "큰아들",
      action: "점심 식사 기록 추가",
      time: "2시간 전",
    },
    { id: 2, member: "딸", action: "약 복용 완료 체크", time: "4시간 전" },
    { id: 3, member: "큰며느리", action: "병원 예약 등록", time: "어제" },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6">
        <h2>안녕하세요! 👋</h2>
        <p className="text-blue-50 mt-2">
          오늘도 소중한 가족과 함께 건강을 관리하세요.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button variant="outline" className="h-24 flex flex-col gap-2">
          <Utensils className="w-6 h-6 text-orange-500" />
          <span className="text-sm">식사 기록</span>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col gap-2">
          <Pill className="w-6 h-6 text-green-500" />
          <span className="text-sm">약 복용</span>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col gap-2">
          <Calendar className="w-6 h-6 text-blue-500" />
          <span className="text-sm">일정 추가</span>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col gap-2">
          <Plus className="w-6 h-6 text-purple-500" />
          <span className="text-sm">기록 추가</span>
        </Button>
      </div>

      {/* Upcoming Schedules */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>다가오는 일정</CardTitle>
          <Bell className="w-5 h-5 text-gray-500" />
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingSchedules.map((schedule) => (
            <div
              key={schedule.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  schedule.type === "hospital" ? "bg-blue-100" : "bg-green-100"
                }`}
              >
                {schedule.type === "hospital" ? (
                  <Calendar className="w-5 h-5 text-blue-600" />
                ) : (
                  <Pill className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-gray-900">{schedule.title}</p>
                <p className="text-sm text-gray-500">
                  {schedule.date} {schedule.time}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>최근 활동</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 pb-3 border-b last:border-0"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm text-blue-600">
                  {activity.member[0]}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="text-blue-600">{activity.member}</span>님이{" "}
                  {activity.action}했습니다
                </p>
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
