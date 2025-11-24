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

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <h2>커뮤니티</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              글쓰기
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 글 작성</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>카테고리</Label>
                <Input
                  placeholder="카테고리를 입력하세요"
                  value={newPost.category}
                  onChange={(e) =>
                    setNewPost({ ...newPost, category: e.target.value })
                  }
                />
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
                  className="flex-1"
                  onClick={() => setIsDialogOpen(false)}
                >
                  취소
                </Button>
                <Button className="flex-1" onClick={handleAddPost}>
                  작성
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="검색어를 입력하세요" className="pl-10" />
      </div>

      {/* Category Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="tips">팁 공유</TabsTrigger>
          <TabsTrigger value="questions">질문</TabsTrigger>
          <TabsTrigger value="free">자유</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-3 mt-4">
          {loading ? (
            <p className="text-center text-gray-500 py-8">로딩 중...</p>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm text-blue-600">
                            {post.authorName[0]}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm">{post.authorName}</div>
                          <div className="text-xs text-gray-500">
                            {getTimeAgo(post.createdAt)}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded">
                        {post.category}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-gray-900 mb-1">{post.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {post.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 pt-2 border-t">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1 text-sm ${
                          post.likedBy.includes("나")
                            ? "text-red-500"
                            : "text-gray-500 hover:text-red-500"
                        } transition-colors`}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            post.likedBy.includes("나") ? "fill-current" : ""
                          }`}
                        />
                        <span>{post.likes}</span>
                      </button>
                      <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors">
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
          <p className="text-center text-gray-500 py-8">
            팁 공유 게시글이 여기에 표시됩니다
          </p>
        </TabsContent>
        <TabsContent value="questions" className="mt-4">
          <p className="text-center text-gray-500 py-8">
            질문 게시글이 여기에 표시됩니다
          </p>
        </TabsContent>
        <TabsContent value="free" className="mt-4">
          <p className="text-center text-gray-500 py-8">
            자유 게시글이 여기에 표시됩니다
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
