"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { signIn } from "../utils/auth";
import { apiClient } from "../utils/api";
import { toast } from "sonner";

interface AuthDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAuthSuccess?: () => void;
}

export function AuthDialog({
  open,
  onOpenChange,
  onAuthSuccess,
}: AuthDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    try {
      const { session, error } = await signIn(email, password);
      if (error || !session) {
        toast.error("로그인에 실패했습니다");
        return;
      }

      apiClient.setAccessToken(session.access_token);
      toast.success("로그인되었습니다!");

      if (onAuthSuccess) {
        onAuthSuccess();
      }

      window.location.reload();
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("로그인에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp() {
    setLoading(true);
    try {
      await apiClient.signup(email, password, name);
      toast.success("회원가입이 완료되었습니다! 로그인해주세요.");

      setTimeout(async () => {
        const { session } = await signIn(email, password);
        if (session) {
          apiClient.setAccessToken(session.access_token);
          if (onAuthSuccess) {
            onAuthSuccess();
          }
          window.location.reload();
        }
      }, 500);
    } catch (error) {
      console.error("Sign up error:", error);
      toast.error("회원가입에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-orange-100">
        <DialogHeader>
          {/* ✨ 제목에 이모지와 색상 추가 */}
          <DialogTitle className="text-center text-xl">
            <span className="text-orange-500">🧡</span> 이음케어에 오신 것을
            환영합니다
          </DialogTitle>
          <p className="text-center text-sm text-gray-500 mt-1">
            따뜻한 돌봄의 시작
          </p>
        </DialogHeader>

        <Tabs defaultValue="signin" className="w-full mt-2">
          {/* ✨ 탭 스타일 오렌지 톤으로 변경 */}
          <TabsList className="grid w-full grid-cols-2 bg-orange-50">
            <TabsTrigger
              value="signin"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              로그인
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              회원가입
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-gray-700">이메일</Label>
              {/* ✨ Input 스타일 오렌지 톤으로 변경 */}
              <Input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">비밀번호</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
              />
            </div>
            {/* ✨ 버튼 스타일 오렌지 톤으로 변경 */}
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleSignIn}
              disabled={loading || !email || !password}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> 로그인 중...
                </span>
              ) : (
                "로그인"
              )}
            </Button>
            {/* ✨ 비밀번호 찾기 링크 추가 */}
            <p className="text-center text-sm text-gray-500">
              비밀번호를 잊으셨나요?{" "}
              <button className="text-orange-500 hover:text-orange-600 hover:underline">
                비밀번호 찾기
              </button>
            </p>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-gray-700">이름</Label>
              <Input
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">이메일</Label>
              <Input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">비밀번호</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-orange-200 focus:border-orange-400 focus:ring-orange-200"
              />
            </div>
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleSignUp}
              disabled={loading || !email || !password || !name}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> 회원가입 중...
                </span>
              ) : (
                "회원가입"
              )}
            </Button>
            {/* ✨ 이용약관 안내 추가 */}
            <p className="text-center text-xs text-gray-400">
              회원가입 시{" "}
              <button className="text-orange-500 hover:underline">
                이용약관
              </button>{" "}
              및{" "}
              <button className="text-orange-500 hover:underline">
                개인정보처리방침
              </button>
              에 동의하게 됩니다.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
