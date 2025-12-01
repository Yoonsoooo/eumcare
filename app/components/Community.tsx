"use client";

import { useState, useEffect } from "react";
import { Plus, MessageCircle, Heart, Search } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { apiClient } from "../utils/api";
import { toast } from "sonner";

interface Post {
  id: string;
  authorName: string;
  title: string;
  content: string;
  category: string;
  likes: number;
  comments: number;
  createdAt: string;
  likedBy: string[];
}

interface CommunityProps {
  fontScale?: number; // ✨ 추가
}

export function Community({ fontScale = 1 }: CommunityProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    category: "자유",
  });

  const getFontWeight = () => {
    if (fontScale >= 1.5) return "font-semibold";
    if (fontScale >= 1.2) return "font-medium";
    return "font-normal";
  };

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      const { data } = await apiClient.getCommunityPosts();
      setPosts(data || []);
    } catch (error) {
      console.error("Failed to load community posts:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddPost = async () => {
    if (!newPost.title || !newPost.content) return;

    try {
      const { data } = await apiClient.addCommunityPost(
        newPost.title,
        newPost.content,
        newPost.category
      );

      setPosts([data, ...posts]);
      setNewPost({ title: "", content: "", category: "자유" });
      setIsDialogOpen(false);
      toast.success("글이 작성되었습니다!");
    } catch (error) {
      toast.error("글 작성에 실패했습니다");
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const { data } = await apiClient.likePost(postId);
      setPosts(
        posts.map((post) =>
          post.id === postId ? { ...post, likes: data.likes } : post
        )
      );
    } catch (error) {
      toast.error("좋아요에 실패했습니다");
    }
  };

  function getTimeAgo(createdAt: string) {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "방금 전";
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays === 1) return "어제";
    return `${diffDays}일 전`;
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "팁 공유":
        return "bg-amber-50 text-amber-600";
      case "질문":
        return "bg-rose-50 text-rose-600";
      default:
        return "bg-orange-50 text-orange-600";
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <h2
          className={`font-bold ${getFontWeight()}`}
          style={{ fontSize: `${1.25 * fontScale}rem` }}
        >
          커뮤니티
        </h2>
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
              글쓰기
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle style={{ fontSize: `${1.125 * fontScale}rem` }}>
                ✍️ 새 글 작성
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label style={{ fontSize: `${0.875 * fontScale}rem` }}>
                  카테고리
                </Label>
                <Input
                  placeholder="카테고리를 입력하세요"
                  value={newPost.category}
                  onChange={(e) =>
                    setNewPost({ ...newPost, category: e.target.value })
                  }
                  style={{ fontSize: `${1 * fontScale}rem` }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ fontSize: `${0.875 * fontScale}rem` }}>
                  제목
                </Label>
                <Input
                  placeholder="제목을 입력하세요"
                  value={newPost.title}
                  onChange={(e) =>
                    setNewPost({ ...newPost, title: e.target.value })
                  }
                  style={{ fontSize: `${1 * fontScale}rem` }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ fontSize: `${0.875 * fontScale}rem` }}>
                  내용
                </Label>
                <Textarea
                  placeholder="내용을 입력하세요"
                  value={newPost.content}
                  onChange={(e) =>
                    setNewPost({ ...newPost, content: e.target.value })
                  }
                  rows={6}
                  style={{ fontSize: `${1 * fontScale}rem` }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50"
                  onClick={() => setIsDialogOpen(false)}
                  style={{ fontSize: `${1 * fontScale}rem` }}
                >
                  취소
                </Button>
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  onClick={handleAddPost}
                  style={{ fontSize: `${1 * fontScale}rem` }}
                >
                  작성
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400"
          style={{ width: 16 * fontScale, height: 16 * fontScale }}
        />
        <Input
          placeholder="검색어를 입력하세요"
          className="border-orange-100 focus:border-orange-300"
          style={{
            paddingLeft: `${2.5 * fontScale}rem`,
            fontSize: `${1 * fontScale}rem`,
          }}
        />
      </div>

      {/* 탭 */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full grid grid-cols-4 bg-orange-50">
          {["전체", "팁 공유", "질문", "자유"].map((tab, idx) => (
            <TabsTrigger
              key={tab}
              value={
                idx === 0
                  ? "all"
                  : idx === 1
                  ? "tips"
                  : idx === 2
                  ? "questions"
                  : "free"
              }
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              style={{ fontSize: `${0.875 * fontScale}rem` }}
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
              <p className="text-gray-500">로딩 중...</p>
            </div>
          ) : posts.length === 0 ? (
            <Card className="border-orange-100">
              <CardContent
                className="text-center text-gray-500"
                style={{
                  padding: `${2 * fontScale}rem`,
                  fontSize: `${1 * fontScale}rem`,
                }}
              >
                아직 작성된 글이 없습니다.
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card
                key={post.id}
                className="hover:shadow-md hover:border-orange-200 transition-all border-orange-100"
              >
                <CardContent style={{ padding: `${1 * fontScale}rem` }}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="rounded-full bg-orange-100 flex items-center justify-center"
                          style={{
                            width: 32 * fontScale,
                            height: 32 * fontScale,
                          }}
                        >
                          <span
                            className="text-orange-600 font-medium"
                            style={{ fontSize: `${0.875 * fontScale}rem` }}
                          >
                            {post.authorName[0]}
                          </span>
                        </div>
                        <div>
                          <div
                            className={`${getFontWeight()}`}
                            style={{ fontSize: `${0.875 * fontScale}rem` }}
                          >
                            {post.authorName}
                          </div>
                          <div
                            className="text-gray-500"
                            style={{ fontSize: `${0.75 * fontScale}rem` }}
                          >
                            {getTimeAgo(post.createdAt)}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`rounded ${getFontWeight()} ${getCategoryColor(
                          post.category
                        )}`}
                        style={{
                          fontSize: `${0.75 * fontScale}rem`,
                          padding: `${0.25 * fontScale}rem ${
                            0.5 * fontScale
                          }rem`,
                        }}
                      >
                        {post.category}
                      </span>
                    </div>

                    <div>
                      <h3
                        className={`text-gray-900 mb-1 ${getFontWeight()}`}
                        style={{ fontSize: `${1 * fontScale}rem` }}
                      >
                        {post.title}
                      </h3>
                      <p
                        className="text-gray-600 line-clamp-2"
                        style={{ fontSize: `${0.875 * fontScale}rem` }}
                      >
                        {post.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 pt-2 border-t border-orange-100">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1 transition-colors ${
                          post.likedBy.includes("나")
                            ? "text-rose-500"
                            : "text-gray-500 hover:text-rose-500"
                        }`}
                        style={{ fontSize: `${0.875 * fontScale}rem` }}
                      >
                        <Heart
                          style={{
                            width: 16 * fontScale,
                            height: 16 * fontScale,
                          }}
                          className={
                            post.likedBy.includes("나") ? "fill-current" : ""
                          }
                        />
                        <span>{post.likes}</span>
                      </button>
                      <button
                        className="flex items-center gap-1 text-gray-500 hover:text-orange-600 transition-colors"
                        style={{ fontSize: `${0.875 * fontScale}rem` }}
                      >
                        <MessageCircle
                          style={{
                            width: 16 * fontScale,
                            height: 16 * fontScale,
                          }}
                        />
                        <span>{post.comments}</span>
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {["tips", "questions", "free"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <Card className="border-orange-100">
              <CardContent
                className="text-center text-gray-500"
                style={{
                  padding: `${2 * fontScale}rem`,
                  fontSize: `${1 * fontScale}rem`,
                }}
              >
                {tab === "tips"
                  ? "💡 팁 공유"
                  : tab === "questions"
                  ? "❓ 질문"
                  : "💬 자유"}{" "}
                게시글이 여기에 표시됩니다
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
