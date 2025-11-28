"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { apiClient } from "../utils/api";
import { toast } from "sonner";

interface OnboardingDialogProps {
  open: boolean;
  onDiaryCreated: (diary: any) => void;
}

export function OnboardingDialog({
  open,
  onDiaryCreated,
}: OnboardingDialogProps) {
  const [elderlyCareRecipientName, setElderlyCareRecipientName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!elderlyCareRecipientName) {
      toast.error("케어 대상자 이름을 입력해주세요");
      return;
    }

    setLoading(true);
    try {
      const { data } = await apiClient.createDiary(elderlyCareRecipientName);
      onDiaryCreated(data);
    } catch (error) {
      console.error("Create diary error:", error);
      toast.error("다이어리 생성에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md border-orange-100"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          {/* ✨ 제목에 이모지와 스타일 추가 */}
          <DialogTitle className="text-center text-xl">
            <span className="text-orange-500">📔</span> 케어 다이어리 만들기
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* ✨ 안내 카드 오렌지 톤으로 변경 */}
          <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
            <p className="text-sm text-orange-800">
              🧡 가족들과 함께 사용할 케어 다이어리를 만들어보세요. 다이어리를
              만든 후 가족 구성원을 초대할 수 있습니다.
            </p>
          </div>

          <div className="space-y-2">
            {/* ✨ Label 스타일 */}
            <Label className="text-gray-700">케어 대상자 이름</Label>
            {/* ✨ Input 오렌지 스타일 */}
            <Input
              placeholder="예: 어머니, 아버지, 할머니 등"
              value={elderlyCareRecipientName}
              onChange={(e) => setElderlyCareRecipientName(e.target.value)}
              className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
            />
          </div>

          {/* ✨ 버튼 오렌지 색상 */}
          <Button
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleCreate}
            disabled={loading || !elderlyCareRecipientName}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span> 생성 중...
              </span>
            ) : (
              "다이어리 만들기"
            )}
          </Button>

          {/* ✨ 하단 안내 텍스트 추가 */}
          <p className="text-center text-xs text-gray-400">
            다이어리는 언제든지 설정에서 수정할 수 있습니다.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
