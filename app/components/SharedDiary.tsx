"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Calendar, X, ImageIcon } from "lucide-react"; // 아이콘 추가
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

// 인터페이스 정의
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

  // ✨ [추가] 상세보기용 State
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

  // ✨ [추가] 삭제 핸들러
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

  const getTypeLabel = (type: string) =>
    type === "meal"
      ? "식사"
      : type === "health"
      ? "건강"
      : type === "sleep"
      ? "수면"
      : "기타";

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">공유 다이어리</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
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
                    <SelectItem value="meal">식사</SelectItem>
                    <SelectItem value="health">건강</SelectItem>
                    <SelectItem value="sleep">수면</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>제목</Label>
                <Input
                  value={newEntry.title}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, title: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>내용</Label>
                <Textarea
                  value={newEntry.content}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, content: e.target.value })
                  }
                />
              </div>
              <Button onClick={handleAddEntry} className="w-full">
                저장
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {entries.map((entry) => (
          <Card
            key={entry.id}
            // ✨ [수정] 카드 클릭 이벤트
            className="cursor-pointer hover:shadow-md transition-all"
            onClick={() => {
              setSelectedEntry(entry);
              setIsDetailOpen(true);
            }}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {getTypeLabel(entry.type)}
                  </span>
                  <CardTitle className="text-lg mt-2">{entry.title}</CardTitle>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(entry.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 line-clamp-2">
                {entry.content}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ✨ [추가] 상세 팝업 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>일기 상세</DialogTitle>
          </DialogHeader>

          {selectedEntry && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
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
                {selectedEntry.content}
              </div>

              {selectedEntry.image_url && (
                <div className="rounded-lg overflow-hidden border">
                  {/* 이미지 표시 로직 (Supabase Storage 사용 시 src 수정 필요) */}
                  <div className="bg-gray-100 h-40 flex items-center justify-center text-gray-400">
                    <ImageIcon className="h-8 w-8 mr-2" /> 이미지
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="w-full"
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
