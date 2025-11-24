"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Image as ImageIcon,
  Pill,
  Utensils,
  FileText,
  Calendar,
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
import { apiClient } from "../utils/api";
import { toast } from "sonner";

interface DiaryEntry {
  id: string;
  type: "meal" | "medicine" | "note";
  title: string;
  content: string;
  date: string;
  time: string;
  authorName: string;
  imageUrl?: string;
}

export function SharedDiary() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    type: "note" as "meal" | "medicine" | "note",
    title: "",
    content: "",
  });

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    try {
      const { data } = await apiClient.getDiaryEntries();
      setEntries(data || []);
    } catch (error) {
      console.error("Failed to load diary entries:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddEntry = async () => {
    if (!newEntry.title || !newEntry.content) return;

    try {
      const { data } = await apiClient.addDiaryEntry(
        newEntry.type,
        newEntry.title,
        newEntry.content
      );

      setEntries([data, ...entries]);
      setNewEntry({ type: "note", title: "", content: "" });
      setIsDialogOpen(false);
      toast.success("기록이 추가되었습니다!");
    } catch (error) {
      console.error("Failed to add diary entry:", error);
      toast.error("기록 추가에 실패했습니다");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "meal":
        return <Utensils className="w-5 h-5 text-orange-600" />;
      case "medicine":
        return <Pill className="w-5 h-5 text-green-600" />;
      default:
        return <FileText className="w-5 h-5 text-blue-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "meal":
        return "식사";
      case "medicine":
        return "약 복용";
      default:
        return "기록";
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <h2>공유 다이어리</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              기록 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 기록 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>기록 유형</Label>
                <Select
                  value={newEntry.type}
                  onValueChange={(value: "meal" | "medicine" | "note") =>
                    setNewEntry({ ...newEntry, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meal">식사</SelectItem>
                    <SelectItem value="medicine">약 복용</SelectItem>
                    <SelectItem value="note">일반 기록</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>제목</Label>
                <Input
                  placeholder="제목을 입력하세요"
                  value={newEntry.title}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>내용</Label>
                <Textarea
                  placeholder="내용을 입력하세요"
                  value={newEntry.content}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, content: e.target.value })
                  }
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>사진 추가 (선택)</Label>
                <Button variant="outline" className="w-full">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  사진 선택
                </Button>
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

      <div className="space-y-4">
        {entries.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    entry.type === "meal"
                      ? "bg-orange-100"
                      : entry.type === "medicine"
                      ? "bg-green-100"
                      : "bg-blue-100"
                  }`}
                >
                  {getIcon(entry.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                      {getTypeLabel(entry.type)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {entry.date} {entry.time}
                    </span>
                  </div>
                  <h3 className="text-gray-900 mb-1">{entry.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{entry.content}</p>
                  {entry.imageUrl && (
                    <img
                      src={entry.imageUrl}
                      alt="Entry"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs text-blue-600">
                        {entry.authorName[0]}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {entry.authorName}
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
