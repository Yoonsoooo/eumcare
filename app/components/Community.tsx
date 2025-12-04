"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  MessageCircle,
  Heart,
  Search,
  Send,
  Trash2,
  MoreVertical,
  AlertTriangle,
  Edit3,
  X,
  Check,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { apiClient } from "../utils/api";
import { toast } from "sonner";

interface Post {
  id: string;
  authorName?: string;
  author_name?: string;
  author_email?: string;
  authorAvatar?: string | null;
  user_id?: string;
  title: string;
  content: string;
  category: string;
  likes?: number;
  likes_count?: number;
  comments?: number;
  comments_count?: number;
  createdAt?: string;
  created_at?: string;
  isLikedByMe?: boolean;
}

interface Comment {
  id: string;
  post_id: string;
  authorName?: string;
  author_name?: string;
  author_email?: string;
  authorAvatar?: string | null;
  user_id?: string;
  content: string;
  created_at: string;
}

interface CommunityProps {
  fontScale?: number;
  currentUserEmail?: string;
  currentUserId?: string;
}

export function Community({
  fontScale = 1,
  currentUserEmail,
  currentUserId,
}: CommunityProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    category: "자유",
  });

  // 게시글 상세 보기 및 댓글 관련 상태
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPostDetailOpen, setIsPostDetailOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // 삭제 확인 다이얼로그
  const [isDeletePostDialogOpen, setIsDeletePostDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  // 댓글 삭제 확인
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const [isDeleteCommentDialogOpen, setIsDeleteCommentDialogOpen] =
    useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

  // ✅ 게시글 수정 관련 상태
  const [isEditPostDialogOpen, setIsEditPostDialogOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  const [editPostData, setEditPostData] = useState({
    title: "",
    content: "",
    category: "",
  });
  const [isUpdatingPost, setIsUpdatingPost] = useState(false);

  // ✅ 댓글 수정 관련 상태
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);

  const getFontWeight = () => {
    if (fontScale >= 1.5) return "font-semibold";
    if (fontScale >= 1.2) return "font-medium";
    return "font-normal";
  };

  // 작성자 이름 가져오기
  const getAuthorName = (item: Post | Comment): string => {
    return (
      (item as any).authorName ||
      item.author_name ||
      item.author_email?.split("@")[0] ||
      "익명"
    );
  };

  // 작성자 이니셜 가져오기
  const getAuthorInitial = (item: Post | Comment): string => {
    const name = getAuthorName(item);
    return name[0]?.toUpperCase() || "?";
  };

  // 작성자 아바타 URL 가져오기
  const getAuthorAvatar = (item: Post | Comment): string | null => {
    return (item as any).authorAvatar || null;
  };

  // 생성 시간 가져오기
  const getCreatedAt = (item: Post | Comment): string => {
    return (
      (item as any).createdAt || item.created_at || new Date().toISOString()
    );
  };

  // 좋아요 수 가져오기
  const getLikesCount = (post: Post): number => {
    return post.likes ?? post.likes_count ?? 0;
  };

  // 댓글 수 가져오기
  const getCommentsCount = (post: Post): number => {
    return post.comments ?? post.comments_count ?? 0;
  };

  // 좋아요 여부 확인
  const isLikedByMe = (post: Post): boolean => {
    return post.isLikedByMe || false;
  };

  // 본인 게시글인지 확인
  const isMyPost = (post: Post): boolean => {
    if (!currentUserEmail && !currentUserId) return false;
    return (
      post.author_email === currentUserEmail || post.user_id === currentUserId
    );
  };

  // 본인 댓글인지 확인
  const isMyComment = (comment: Comment): boolean => {
    if (!currentUserEmail && !currentUserId) return false;
    return (
      comment.author_email === currentUserEmail ||
      comment.user_id === currentUserId
    );
  };

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    try {
      const { data } = await apiClient.getCommunityPosts();
      setPosts(data || []);
    } catch (error) {
      console.error("Failed to load community posts:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadComments(postId: string) {
    setLoadingComments(true);
    try {
      const { data } = await apiClient.getPostComments(postId);
      setComments(data || []);
    } catch (error) {
      console.error("Failed to load comments:", error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setIsPostDetailOpen(true);
    loadComments(post.id);
  };

  // ✅ 게시글 수정 다이얼로그 열기
  const handleOpenEditPostDialog = (post: Post, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPostToEdit(post);
    setEditPostData({
      title: post.title,
      content: post.content,
      category: post.category || "자유",
    });
    setIsEditPostDialogOpen(true);
  };

  // ✅ 게시글 수정 저장
  const handleUpdatePost = async () => {
    if (!postToEdit || !editPostData.title || !editPostData.content) {
      toast.error("제목과 내용을 입력해주세요");
      return;
    }

    setIsUpdatingPost(true);
    try {
      await apiClient.updatePost(postToEdit.id, {
        title: editPostData.title,
        content: editPostData.content,
        category: editPostData.category,
      });

      // 게시글 목록 업데이트
      setPosts(
        posts.map((p) =>
          p.id === postToEdit.id ? { ...p, ...editPostData } : p
        )
      );

      // 선택된 게시글도 업데이트
      if (selectedPost?.id === postToEdit.id) {
        setSelectedPost({ ...selectedPost, ...editPostData });
      }

      setIsEditPostDialogOpen(false);
      setPostToEdit(null);
      toast.success("게시글이 수정되었습니다");
    } catch (error: any) {
      toast.error(error.message || "게시글 수정에 실패했습니다");
    } finally {
      setIsUpdatingPost(false);
    }
  };

  // 게시글 삭제 다이얼로그 열기
  const handleOpenDeletePostDialog = (post: Post, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPostToDelete(post);
    setIsDeletePostDialogOpen(true);
  };

  // 게시글 삭제
  const handleDeletePost = async () => {
    if (!postToDelete) return;

    setIsDeletingPost(true);
    try {
      await apiClient.deletePost(postToDelete.id);
      setPosts(posts.filter((p) => p.id !== postToDelete.id));
      setIsDeletePostDialogOpen(false);
      setIsPostDetailOpen(false);
      setPostToDelete(null);
      setSelectedPost(null);
      toast.success("게시글이 삭제되었습니다");
    } catch (error: any) {
      toast.error(error.message || "게시글 삭제에 실패했습니다");
    } finally {
      setIsDeletingPost(false);
    }
  };

  // ✅ 댓글 수정 시작
  const handleStartEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditCommentContent(comment.content);
  };

  // ✅ 댓글 수정 취소
  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentContent("");
  };

  // ✅ 댓글 수정 저장
  const handleUpdateComment = async (commentId: string) => {
    if (!editCommentContent.trim() || !selectedPost) return;

    setIsUpdatingComment(true);
    try {
      await apiClient.updateComment(commentId, editCommentContent.trim());

      setComments(
        comments.map((c) =>
          c.id === commentId ? { ...c, content: editCommentContent.trim() } : c
        )
      );

      setEditingCommentId(null);
      setEditCommentContent("");
      toast.success("댓글이 수정되었습니다");
    } catch (error: any) {
      toast.error(error.message || "댓글 수정에 실패했습니다");
    } finally {
      setIsUpdatingComment(false);
    }
  };

  // 댓글 삭제 다이얼로그 열기
  const handleOpenDeleteCommentDialog = (comment: Comment) => {
    setCommentToDelete(comment);
    setIsDeleteCommentDialogOpen(true);
  };

  // 댓글 삭제
  const handleDeleteComment = async () => {
    if (!commentToDelete || !selectedPost) return;

    setIsDeletingComment(true);
    try {
      await apiClient.deleteComment(commentToDelete.id, selectedPost.id);
      setComments(comments.filter((c) => c.id !== commentToDelete.id));

      const newCount = Math.max(getCommentsCount(selectedPost) - 1, 0);
      setPosts(
        posts.map((p) =>
          p.id === selectedPost.id
            ? { ...p, comments: newCount, comments_count: newCount }
            : p
        )
      );

      setSelectedPost({
        ...selectedPost,
        comments: newCount,
        comments_count: newCount,
      });

      setIsDeleteCommentDialogOpen(false);
      setCommentToDelete(null);
      toast.success("댓글이 삭제되었습니다");
    } catch (error: any) {
      toast.error(error.message || "댓글 삭제에 실패했습니다");
    } finally {
      setIsDeletingComment(false);
    }
  };

  // 댓글 작성
  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost) return;

    setSubmittingComment(true);
    try {
      const { data } = await apiClient.addComment(
        selectedPost.id,
        newComment.trim()
      );
      setComments([...comments, data]);
      setNewComment("");

      const newCount = getCommentsCount(selectedPost) + 1;
      setPosts(
        posts.map((p) =>
          p.id === selectedPost.id
            ? { ...p, comments: newCount, comments_count: newCount }
            : p
        )
      );

      setSelectedPost({
        ...selectedPost,
        comments: newCount,
        comments_count: newCount,
      });

      toast.success("댓글이 작성되었습니다!");
    } catch (error) {
      toast.error("댓글 작성에 실패했습니다");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAddPost = async () => {
    if (!newPost.title || !newPost.content) {
      toast.error("제목과 내용을 입력해주세요");
      return;
    }

    try {
      const { data } = await apiClient.addCommunityPost(
        newPost.title,
        newPost.content,
        newPost.category
      );

      const newPostData = {
        ...data,
        isLikedByMe: false,
        likes: 0,
        comments: 0,
      };

      setPosts([newPostData, ...posts]);
      setNewPost({ title: "", content: "", category: "자유" });
      setIsDialogOpen(false);
      toast.success("글이 작성되었습니다!");
    } catch (error) {
      toast.error("글 작성에 실패했습니다");
    }
  };

  const handleLike = async (postId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const { data } = await apiClient.likePost(postId);
      const newLikes = data.likes;
      const newIsLiked = data.isLiked;

      setPosts(
        posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: newLikes,
                likes_count: newLikes,
                isLikedByMe: newIsLiked,
              }
            : post
        )
      );

      if (selectedPost?.id === postId) {
        setSelectedPost({
          ...selectedPost,
          likes: newLikes,
          likes_count: newLikes,
          isLikedByMe: newIsLiked,
        });
      }
    } catch (error: any) {
      toast.error(error.message || "좋아요에 실패했습니다");
    }
  };

  function getTimeAgo(createdAt: string) {
    if (!createdAt) return "방금 전";

    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
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

  const getFilteredPosts = (category: string) => {
    let filtered = posts;

    if (category !== "all") {
      const categoryMap: { [key: string]: string } = {
        tips: "팁 공유",
        questions: "질문",
        free: "자유",
      };
      filtered = filtered.filter(
        (post) => post.category === categoryMap[category]
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title?.toLowerCase().includes(query) ||
          post.content?.toLowerCase().includes(query) ||
          getAuthorName(post).toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  // 아바타 렌더링
  const renderAvatar = (
    item: Post | Comment,
    size: "sm" | "md" | "lg" = "md"
  ) => {
    const sizeClasses = { sm: "w-8 h-8", md: "w-10 h-10", lg: "w-12 h-12" };
    const textSizes = { sm: "text-sm", md: "text-base", lg: "text-lg" };

    const avatarUrl = getAuthorAvatar(item);
    const initial = getAuthorInitial(item);

    return (
      <Avatar className={sizeClasses[size]}>
        {avatarUrl && <AvatarImage src={avatarUrl} alt={getAuthorName(item)} />}
        <AvatarFallback
          className={`bg-orange-100 text-orange-600 font-medium ${textSizes[size]}`}
        >
          {initial}
        </AvatarFallback>
      </Avatar>
    );
  };

  // 게시글 카드 렌더링
  const renderPostCard = (post: Post) => (
    <Card
      key={post.id}
      className="hover:shadow-md hover:border-orange-200 transition-all border-orange-100 cursor-pointer"
      onClick={() => handlePostClick(post)}
    >
      <CardContent style={{ padding: `${1 * fontScale}rem` }}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {renderAvatar(post, "md")}
              <div>
                <div
                  className={`text-gray-900 ${getFontWeight()}`}
                  style={{ fontSize: `${0.875 * fontScale}rem` }}
                >
                  {getAuthorName(post)}
                </div>
                <div
                  className="text-gray-500"
                  style={{ fontSize: `${0.75 * fontScale}rem` }}
                >
                  {getTimeAgo(getCreatedAt(post))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded ${getFontWeight()} ${getCategoryColor(
                  post.category || "자유"
                )}`}
                style={{
                  fontSize: `${0.75 * fontScale}rem`,
                  padding: `${0.25 * fontScale}rem ${0.5 * fontScale}rem`,
                }}
              >
                {post.category || "자유"}
              </span>
              {isMyPost(post) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditPostDialog(post);
                      }}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      수정하기
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDeletePostDialog(post);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      삭제하기
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
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
              onClick={(e) => handleLike(post.id, e)}
              className={`flex items-center gap-1 transition-colors ${
                isLikedByMe(post)
                  ? "text-rose-500"
                  : "text-gray-500 hover:text-rose-500"
              }`}
              style={{ fontSize: `${0.875 * fontScale}rem` }}
            >
              <Heart
                style={{ width: 16 * fontScale, height: 16 * fontScale }}
                className={isLikedByMe(post) ? "fill-current" : ""}
              />
              <span>{getLikesCount(post)}</span>
            </button>
            <span
              className="flex items-center gap-1 text-gray-500"
              style={{ fontSize: `${0.875 * fontScale}rem` }}
            >
              <MessageCircle
                style={{ width: 16 * fontScale, height: 16 * fontScale }}
              />
              <span>{getCommentsCount(post)}</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderEmptyState = (message: string) => (
    <Card className="border-orange-100">
      <CardContent
        className="text-center text-gray-500"
        style={{
          padding: `${2 * fontScale}rem`,
          fontSize: `${1 * fontScale}rem`,
        }}
      >
        {message}
      </CardContent>
    </Card>
  );

  const renderTabContent = (tabValue: string) => {
    const filteredPosts = getFilteredPosts(tabValue);

    if (loading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      );
    }

    if (filteredPosts.length === 0) {
      const emptyMessages: { [key: string]: string } = {
        all: "아직 작성된 글이 없습니다.",
        tips: "💡 팁 공유 게시글이 없습니다.",
        questions: "❓ 질문 게시글이 없습니다.",
        free: "💬 자유 게시글이 없습니다.",
      };
      return renderEmptyState(emptyMessages[tabValue] || "게시글이 없습니다.");
    }

    return <div className="space-y-3">{filteredPosts.map(renderPostCard)}</div>;
  };

  // ✅ 댓글 렌더링 (수정 모드 포함)
  const renderComment = (comment: Comment) => {
    const isEditing = editingCommentId === comment.id;

    return (
      <div
        key={comment.id}
        className="flex gap-3 p-3 bg-gray-50 rounded-lg group"
      >
        {renderAvatar(comment, "sm")}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-gray-900">
              {getAuthorName(comment)}
            </span>
            <span className="text-xs text-gray-400">
              {getTimeAgo(getCreatedAt(comment))}
            </span>
          </div>

          {isEditing ? (
            // 수정 모드
            <div className="mt-2 space-y-2">
              <Textarea
                value={editCommentContent}
                onChange={(e) => setEditCommentContent(e.target.value)}
                className="min-h-[60px] text-sm border-orange-200 focus:border-orange-400"
                placeholder="댓글을 입력하세요..."
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-200"
                  onClick={handleCancelEditComment}
                  disabled={isUpdatingComment}
                >
                  <X className="w-3 h-3 mr-1" />
                  취소
                </Button>
                <Button
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={() => handleUpdateComment(comment.id)}
                  disabled={!editCommentContent.trim() || isUpdatingComment}
                >
                  {isUpdatingComment ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1" />
                  ) : (
                    <Check className="w-3 h-3 mr-1" />
                  )}
                  저장
                </Button>
              </div>
            </div>
          ) : (
            // 일반 모드
            <p className="text-sm text-gray-700 mt-1 break-words">
              {comment.content}
            </p>
          )}
        </div>

        {/* 본인 댓글이면 수정/삭제 버튼 */}
        {isMyComment(comment) && !isEditing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600">
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleStartEditComment(comment)}>
                <Edit3 className="w-4 h-4 mr-2" />
                수정
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => handleOpenDeleteCommentDialog(comment)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* 헤더 */}
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
          <DialogContent className="border-orange-100">
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
                <div className="flex gap-2">
                  {["자유", "팁 공유", "질문"].map((cat) => (
                    <Button
                      key={cat}
                      type="button"
                      variant={newPost.category === cat ? "default" : "outline"}
                      size="sm"
                      className={
                        newPost.category === cat
                          ? "bg-orange-500 hover:bg-orange-600"
                          : "border-orange-200 text-orange-600 hover:bg-orange-50"
                      }
                      onClick={() => setNewPost({ ...newPost, category: cat })}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>제목</Label>
                <Input
                  placeholder="제목을 입력하세요"
                  value={newPost.title}
                  onChange={(e) =>
                    setNewPost({ ...newPost, title: e.target.value })
                  }
                  className="border-orange-200"
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
                  className="border-orange-200"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-orange-200 text-orange-600"
                  onClick={() => setIsDialogOpen(false)}
                >
                  취소
                </Button>
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  onClick={handleAddPost}
                  disabled={!newPost.title || !newPost.content}
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
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-orange-100"
          style={{ paddingLeft: `${2.5 * fontScale}rem` }}
        />
      </div>

      {/* 탭 */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full grid grid-cols-4 bg-orange-50">
          {[
            { value: "all", label: "전체" },
            { value: "tips", label: "팁 공유" },
            { value: "questions", label: "질문" },
            { value: "free", label: "자유" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {["all", "tips", "questions", "free"].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="mt-4">
            {renderTabContent(tabValue)}
          </TabsContent>
        ))}
      </Tabs>

      {/* 게시글 상세 보기 모달 */}
      <Dialog open={isPostDetailOpen} onOpenChange={setIsPostDetailOpen}>
        <DialogContent className="border-orange-100 max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
          {selectedPost && (
            <>
              <DialogHeader className="p-4 border-b border-orange-100">
                <DialogTitle className="sr-only">게시글 상세</DialogTitle>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {renderAvatar(selectedPost, "md")}
                    <div>
                      <p className="font-medium text-gray-900">
                        {getAuthorName(selectedPost)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getTimeAgo(getCreatedAt(selectedPost))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${getCategoryColor(
                        selectedPost.category || "자유"
                      )}`}
                    >
                      {selectedPost.category || "자유"}
                    </span>
                    {isMyPost(selectedPost) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              handleOpenEditPostDialog(selectedPost)
                            }
                          >
                            <Edit3 className="w-4 h-4 mr-2" />
                            수정하기
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() =>
                              handleOpenDeletePostDialog(selectedPost)
                            }
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            삭제하기
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto">
                <div className="p-4 border-b border-orange-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {selectedPost.title}
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedPost.content}
                  </p>
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleLike(selectedPost.id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        isLikedByMe(selectedPost)
                          ? "text-rose-500"
                          : "text-gray-500 hover:text-rose-500"
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          isLikedByMe(selectedPost) ? "fill-current" : ""
                        }`}
                      />
                      <span className="font-medium">
                        {getLikesCount(selectedPost)}
                      </span>
                    </button>
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-medium">
                        {getCommentsCount(selectedPost)}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    💬 댓글 {comments.length}개
                  </h4>
                  {loadingComments ? (
                    <div className="text-center py-6">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">
                        댓글 불러오는 중...
                      </p>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-6 text-gray-400">
                      <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">아직 댓글이 없습니다</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {comments.map(renderComment)}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-orange-100 bg-white">
                <div className="flex gap-2">
                  <Input
                    ref={commentInputRef}
                    placeholder="댓글을 입력하세요..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                    className="flex-1 border-orange-200"
                    disabled={submittingComment}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || submittingComment}
                    className="bg-orange-500 hover:bg-orange-600 px-3"
                  >
                    {submittingComment ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ✅ 게시글 수정 다이얼로그 */}
      <Dialog
        open={isEditPostDialogOpen}
        onOpenChange={setIsEditPostDialogOpen}
      >
        <DialogContent className="border-orange-100">
          <DialogHeader>
            <DialogTitle>✏️ 게시글 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>카테고리</Label>
              <div className="flex gap-2">
                {["자유", "팁 공유", "질문"].map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant={
                      editPostData.category === cat ? "default" : "outline"
                    }
                    size="sm"
                    className={
                      editPostData.category === cat
                        ? "bg-orange-500 hover:bg-orange-600"
                        : "border-orange-200 text-orange-600"
                    }
                    onClick={() =>
                      setEditPostData({ ...editPostData, category: cat })
                    }
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>제목</Label>
              <Input
                value={editPostData.title}
                onChange={(e) =>
                  setEditPostData({ ...editPostData, title: e.target.value })
                }
                className="border-orange-200"
              />
            </div>
            <div className="space-y-2">
              <Label>내용</Label>
              <Textarea
                value={editPostData.content}
                onChange={(e) =>
                  setEditPostData({ ...editPostData, content: e.target.value })
                }
                rows={6}
                className="border-orange-200"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-gray-200"
                onClick={() => {
                  setIsEditPostDialogOpen(false);
                  setPostToEdit(null);
                }}
                disabled={isUpdatingPost}
              >
                취소
              </Button>
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600"
                onClick={handleUpdatePost}
                disabled={
                  !editPostData.title || !editPostData.content || isUpdatingPost
                }
              >
                {isUpdatingPost ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                저장
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 게시글 삭제 확인 다이얼로그 */}
      <Dialog
        open={isDeletePostDialogOpen}
        onOpenChange={setIsDeletePostDialogOpen}
      >
        <DialogContent className="border-red-100 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              게시글 삭제
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <p className="font-medium text-gray-900 line-clamp-1">
                {postToDelete?.title}
              </p>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {postToDelete?.content}
              </p>
            </div>
            <p className="text-sm text-gray-600">
              이 게시글을 삭제하시겠습니까? 삭제된 게시글과 댓글은 복구할 수
              없습니다.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsDeletePostDialogOpen(false);
                  setPostToDelete(null);
                }}
                disabled={isDeletingPost}
              >
                취소
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                onClick={handleDeletePost}
                disabled={isDeletingPost}
              >
                {isDeletingPost ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                삭제
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 댓글 삭제 확인 다이얼로그 */}
      <Dialog
        open={isDeleteCommentDialogOpen}
        onOpenChange={setIsDeleteCommentDialogOpen}
      >
        <DialogContent className="border-red-100 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              댓글 삭제
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <p className="text-sm text-gray-700">
                {commentToDelete?.content}
              </p>
            </div>
            <p className="text-sm text-gray-600">이 댓글을 삭제하시겠습니까?</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsDeleteCommentDialogOpen(false);
                  setCommentToDelete(null);
                }}
                disabled={isDeletingComment}
              >
                취소
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                onClick={handleDeleteComment}
                disabled={isDeletingComment}
              >
                {isDeletingComment ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                삭제
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
