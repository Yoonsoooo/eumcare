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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
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

const CATEGORIES = [
  { value: "자유", label: "💬 자유", emoji: "💬" },
  { value: "팁 공유", label: "💡 팁 공유", emoji: "💡" },
  { value: "질문", label: "❓ 질문", emoji: "❓" },
];

export function Community() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    category: "자유",
  });

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
      console.error("Failed to add post:", error);
      toast.error("글 작성에 실패했습니다");
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const { data } = await apiClient.likePost(postId);

      setPosts(
        posts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              likes: data.likes,
            };
          }
          return post;
        })
      );
    } catch (error) {
      console.error("Failed to like post:", error);
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
      case "자유":
        return "bg-orange-50 text-orange-600";
      default:
        return "bg-orange-50 text-orange-600";
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">커뮤니티</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              글쓰기
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>✍️ 새 글 작성</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {/* ✨ Select 컴포넌트로 변경 */}
              <div className="space-y-2">
                <Label>카테고리</Label>
                <Select
                  value={newPost.category}
                  onValueChange={(value) =>
                    setNewPost({ ...newPost, category: value })
                  }
                >
                  <SelectTrigger className="w-full border-orange-200 focus:ring-orange-500">
                    <SelectValue placeholder="카테고리를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>제목</Label>
                <Input
                  placeholder="제목을 입력하세요"
                  value={newPost.title}
                  onChange={(e) =>
                    setNewPost({ ...newPost, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>내용</Label>
                <Textarea
                  placeholder="내용을 입력하세요"
                  value={newPost.content}
                  onChange={(e) =>
                    setNewPost({ ...newPost, content: e.target.value })
                  }
                  rows={6}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50"
                  onClick={() => setIsDialogOpen(false)}
                >
                  취소
                </Button>
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  onClick={handleAddPost}
                >
                  작성
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
        <Input
          placeholder="검색어를 입력하세요"
          className="pl-10 border-orange-100 focus:border-orange-300 focus:ring-orange-200"
        />
      </div>

      {/* Category Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full grid grid-cols-4 bg-orange-50">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
          >
            전체
          </TabsTrigger>
          <TabsTrigger
            value="tips"
            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
          >
            팁 공유
          </TabsTrigger>
          <TabsTrigger
            value="questions"
            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
          >
            질문
          </TabsTrigger>
          <TabsTrigger
            value="free"
            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
          >
            자유
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-3 mt-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
              <p className="text-gray-500">로딩 중...</p>
            </div>
          ) : posts.length === 0 ? (
            <Card className="border-orange-100">
              <CardContent className="p-8 text-center text-gray-500">
                아직 작성된 글이 없습니다.
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card
                key={post.id}
                className="hover:shadow-md hover:border-orange-200 transition-all border-orange-100"
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <span className="text-sm text-orange-600 font-medium">
                            {post.authorName[0]}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            {post.authorName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {getTimeAgo(post.createdAt)}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded font-medium ${getCategoryColor(
                          post.category
                        )}`}
                      >
                        {post.category}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-gray-900 font-semibold mb-1">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {post.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 pt-2 border-t border-orange-100">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1 text-sm ${
                          post.likedBy.includes("나")
                            ? "text-rose-500"
                            : "text-gray-500 hover:text-rose-500"
                        } transition-colors`}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            post.likedBy.includes("나") ? "fill-current" : ""
                          }`}
                        />
                        <span>{post.likes}</span>
                      </button>
                      <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-orange-600 transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments}</span>
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        <TabsContent value="tips" className="mt-4">
          <Card className="border-orange-100">
            <CardContent className="p-8 text-center text-gray-500">
              💡 팁 공유 게시글이 여기에 표시됩니다
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="questions" className="mt-4">
          <Card className="border-orange-100">
            <CardContent className="p-8 text-center text-gray-500">
              ❓ 질문 게시글이 여기에 표시됩니다
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="free" className="mt-4">
          <Card className="border-orange-100">
            <CardContent className="p-8 text-center text-gray-500">
              💬 자유 게시글이 여기에 표시됩니다
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
