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
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>케어 다이어리 만들기</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-sm text-gray-600">
            가족들과 함께 사용할 케어 다이어리를 만들어보세요. 다이어리를 만든
            후 가족 구성원을 초대할 수 있습니다.
          </p>

          <div className="space-y-2">
            <Label>케어 대상자 이름</Label>
            <Input
              placeholder="예: 어머니, 아버지, 할머니 등"
              value={elderlyCareRecipientName}
              onChange={(e) => setElderlyCareRecipientName(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleCreate}
            disabled={loading || !elderlyCareRecipientName}
          >
            {loading ? "생성 중..." : "다이어리 만들기"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
