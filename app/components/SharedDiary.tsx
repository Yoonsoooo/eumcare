"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Calendar, X, ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import { apiClient } from "../utils/api";
import { toast } from "sonner";
import { getCurrentUser } from "../utils/auth";
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

interface DiaryEntry {
  id: string;
  type: string;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
}

export function SharedDiary() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [newEntry, setNewEntry] = useState({
    type: "meal",
    title: "",
    content: "",
    imageUrl: "",
  });

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    try {
      const { user } = await getCurrentUser();
      if (user) {
        const { data } = await apiClient.getDiaryEntries();
        if (data) setEntries(data);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAddEntry() {
    try {
      if (!newEntry.title) return toast.error("제목을 입력해주세요");
      await apiClient.addDiaryEntry(
        newEntry.type,
        newEntry.title,
        newEntry.content,
        newEntry.imageUrl
      );
      toast.success("작성되었습니다.");
      setIsDialogOpen(false);
      setNewEntry({ type: "meal", title: "", content: "", imageUrl: "" });
      loadEntries();
    } catch (err) {
      toast.error("작성 실패");
    }
  }

  const handleDelete = async () => {
    if (!selectedEntry) return;
    if (confirm("정말 이 일기를 삭제하시겠습니까?")) {
      try {
        await apiClient.deleteDiaryEntry(selectedEntry.id);
        toast.success("삭제되었습니다.");
        setIsDetailOpen(false);
        loadEntries();
      } catch (err) {
        toast.error("삭제 실패");
      }
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "meal":
        return "식사";
      case "medicine":
        return "약 복용"; // health -> medicine 으로 변경
      case "health":
        return "건강"; // 기존 데이터 호환용
      case "sleep":
        return "수면";
    }
  };

  // ✨ 타입별 색상 (따뜻한 톤으로 변경)
  const getTypeColor = (type: string) => {
    switch (type) {
      case "meal":
        return "bg-orange-100 text-orange-700";
      case "medicine": // health -> medicine 으로 변경
      case "health": // 기존 데이터 호환용
        return "bg-rose-100 text-rose-700";
      case "sleep":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">공유 다이어리</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            {/* ✨ 버튼 색상 변경 */}
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="mr-2 h-4 w-4" /> 작성하기
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 일기 작성</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>유형</Label>
                <Select
                  value={newEntry.type}
                  onValueChange={(v) => setNewEntry({ ...newEntry, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meal">🍽️ 식사</SelectItem>
                    <SelectItem value="health">💊 약 복용</SelectItem>
                    <SelectItem value="sleep">😴 수면</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>제목</Label>
                <Input
                  placeholder="제목을 입력하세요"
                  value={newEntry.title}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, title: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>내용</Label>
                <Textarea
                  placeholder="내용을 입력하세요"
                  value={newEntry.content}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, content: e.target.value })
                  }
                />
              </div>
              {/* ✨ 저장 버튼 색상 변경 */}
              <Button
                onClick={handleAddEntry}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                저장
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 일기 목록 */}
      <div className="grid gap-4 md:grid-cols-2">
        {entries.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center text-gray-500">
              아직 작성된 일기가 없습니다.
            </CardContent>
          </Card>
        ) : (
          entries.map((entry) => (
            <Card
              key={entry.id}
              className="cursor-pointer hover:shadow-md hover:border-orange-200 transition-all"
              onClick={() => {
                setSelectedEntry(entry);
                setIsDetailOpen(true);
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${getTypeColor(
                        entry.type
                      )}`}
                    >
                      {getTypeLabel(entry.type)}
                    </span>
                    <CardTitle className="text-lg mt-2">
                      {entry.title}
                    </CardTitle>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>

              {/* ✨ 구분선 추가 */}
              <div className="h-px bg-orange-100 mx-4" />

              <CardContent className="pt-3">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {entry.content}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 상세 팝업 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>일기 상세</DialogTitle>
          </DialogHeader>

          {selectedEntry && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-orange-100 pb-4">
                <div>
                  {/* ✨ 타입 뱃지 색상 동적 적용 */}
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${getTypeColor(
                      selectedEntry.type
                    )}`}
                  >
                    {getTypeLabel(selectedEntry.type)}
                  </span>
                  <h2 className="text-2xl font-bold mt-2">
                    {selectedEntry.title}
                  </h2>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />{" "}
                    {new Date(selectedEntry.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="min-h-[100px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedEntry.content || (
                  <span className="text-gray-400">내용이 없습니다.</span>
                )}
              </div>

              {selectedEntry.image_url && (
                <div className="rounded-lg overflow-hidden border border-orange-100">
                  <div className="bg-orange-50 h-40 flex items-center justify-center text-orange-300">
                    <ImageIcon className="h-8 w-8 mr-2" /> 이미지
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
                  className="flex-1"
                >
                  닫기
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex-1"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> 삭제하기
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
