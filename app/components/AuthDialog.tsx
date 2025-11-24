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

      // Reload page to update state
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

      // Auto sign in
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>이음케어에 오신 것을 환영합니다</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">로그인</TabsTrigger>
            <TabsTrigger value="signup">회원가입</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>이메일</Label>
              <Input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>비밀번호</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleSignIn}
              disabled={loading || !email || !password}
            >
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>이름</Label>
              <Input
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>이메일</Label>
              <Input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>비밀번호</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleSignUp}
              disabled={loading || !email || !password || !name}
            >
              {loading ? "회원가입 중..." : "회원가입"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
