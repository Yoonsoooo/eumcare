"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Image as ImageIcon,
  Pill,
  Utensils,
  FileText,
  Calendar,
  X,
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
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newEntry, setNewEntry] = useState({
    type: "note" as "meal" | "medicine" | "note",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
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
    if (!newEntry.date || !newEntry.time || !newEntry.content) return;

    try {
      const { data } = await apiClient.addDiaryEntry(
        newEntry.type,
        `${newEntry.date} ${newEntry.time}`, // title을 날짜+시간으로
        newEntry.content
      );

      setEntries([data, ...entries]);
      setNewEntry({
        type: "note",
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().slice(0, 5),
        content: "",
      });
      setIsDialogOpen(false);
      toast.success("기록이 추가되었습니다!");
    } catch (error) {
      console.error("Failed to add diary entry:", error);
      toast.error("기록 추가에 실패했습니다");
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    setCustomCategories([...customCategories, newCategoryName]);
    setNewCategoryName("");
    setShowAddCategory(false);
    toast.success("카테고리가 추가되었습니다!");
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    setCustomCategories(
      customCategories.filter((cat) => cat !== categoryToRemove)
    );
    toast.success("카테고리가 삭제되었습니다");
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
                    {customCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        <div className="flex items-center justify-between w-full">
                          <span>{category}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {!showAddCategory ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setShowAddCategory(true)}
                  >
                    <Plus className="w-3 h-3 mr-1" />새 카테고리 추가
                  </Button>
                ) : (
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="카테고리 이름"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleAddCategory()
                      }
                    />
                    <Button size="sm" onClick={handleAddCategory}>
                      추가
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowAddCategory(false);
                        setNewCategoryName("");
                      }}
                    >
                      취소
                    </Button>
                  </div>
                )}

                {customCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {customCategories.map((category) => (
                      <div
                        key={category}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
                      >
                        <span>{category}</span>
                        <button
                          onClick={() => handleRemoveCategory(category)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
          <Card
            key={entry.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setSelectedEntry(entry);
              setIsDetailDialogOpen(true);
            }}
          >
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
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {entry.content}
                  </p>
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

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>기록 상세</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    selectedEntry.type === "meal"
                      ? "bg-orange-100"
                      : selectedEntry.type === "medicine"
                      ? "bg-green-100"
                      : "bg-blue-100"
                  }`}
                >
                  {getIcon(selectedEntry.type)}
                </div>
                <div>
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                    {getTypeLabel(selectedEntry.type)}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedEntry.date} {selectedEntry.time}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-2">
                  {selectedEntry.title}
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedEntry.content}
                </p>
              </div>

              {selectedEntry.imageUrl && (
                <div className="border-t pt-4">
                  <img
                    src={selectedEntry.imageUrl}
                    alt="Entry"
                    className="w-full rounded-lg"
                  />
                </div>
              )}

              <div className="border-t pt-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm text-blue-600">
                    {selectedEntry.authorName[0]}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-900">
                    {selectedEntry.authorName}
                  </p>
                  <p className="text-xs text-gray-500">작성자</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDetailDialogOpen(false)}
                >
                  닫기
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
