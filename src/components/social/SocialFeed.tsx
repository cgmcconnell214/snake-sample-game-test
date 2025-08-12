import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Heart,
  MessageCircle,
  Share,
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  X,
  Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Post {
  id: string;
  content: string;
  media_urls: string[] | null;
  post_type: string | null;
  like_count: number | null;
  comment_count: number | null;
  share_count: number | null;
  created_at: string | null;
  user_id: string;
  user_profiles?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  is_liked?: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_profiles?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export default function SocialFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set(),
  );
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({});
  const [newComment, setNewComment] = useState<{ [postId: string]: string }>(
    {},
  );
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    fetchFeed();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [user]);

  const setupRealtimeSubscription = () => {
    if (!user) return;

    // Subscribe to new posts
    const postsChannel = supabase
      .channel("public-posts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_posts",
          filter: "is_public=eq.true",
        },
        async (payload) => {
          const newPost = payload.new as any;

          // Get user profile for the new post
          const { data: userProfile } = await (supabase as any)
            .from("public_user_profiles")
            .select("user_id, display_name, username, avatar_url")
            .eq("user_id", newPost.user_id)
            .maybeSingle();

          const postWithProfile = {
            ...newPost,
            user_profiles: userProfile,
            is_liked: false,
          };

          setPosts((prev) => [postWithProfile, ...prev]);
        },
      )
      .subscribe();

    // Subscribe to like updates
    const likesChannel = supabase
      .channel("post-likes-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "post_likes",
        },
        async (payload) => {
          const likeData = (payload.new || payload.old) as any;
          if (!likeData?.post_id) return;

          setPosts((prev) =>
            prev.map((post) => {
              if (post.id === likeData.post_id) {
                if (payload.eventType === "INSERT") {
                  return {
                    ...post,
                    like_count: (post.like_count || 0) + 1,
                    is_liked:
                      likeData.user_id === user.id ? true : post.is_liked,
                  };
                } else if (payload.eventType === "DELETE") {
                  return {
                    ...post,
                    like_count: Math.max(0, (post.like_count || 0) - 1),
                    is_liked:
                      likeData.user_id === user.id ? false : post.is_liked,
                  };
                }
              }
              return post;
            }),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(likesChannel);
    };
  };

  const fetchFeed = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from("user_posts")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      if (postsData && user) {
        // Get user profiles for posts
        const userIds = [...new Set(postsData.map((post) => post.user_id))];
        const { data: profiles } = await (supabase as any)
          .from("public_user_profiles")
          .select("user_id, display_name, username, avatar_url")
          .in("user_id", userIds);

        // Check which posts the user has liked
        const postIds = postsData.map((post) => post.id);
        const { data: likes } = await supabase
          .from("post_likes")
          .select("post_id")
          .eq("user_id", user.id)
          .in("post_id", postIds);

        const likedPostIds = new Set(likes?.map((like) => like.post_id) || []);

        const postsWithProfiles = postsData.map((post) => ({
          ...post,
          user_profiles:
            profiles?.find((p) => p.user_id === post.user_id) || null,
          is_liked: likedPostIds.has(post.id),
        }));

        setPosts(postsWithProfiles);
      }
    } catch (error) {
      console.error("Error fetching feed:", error);
      toast({
        title: "Error",
        description: "Failed to load social feed",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles((prev) => [...prev, ...files].slice(0, 5)); // Max 5 files
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const createPost = async () => {
    if (!user || (!newPostContent.trim() && uploadedFiles.length === 0)) {
      return;
    }

    setIsCreatingPost(true);
    try {
      let mediaUrls: string[] = [];

      // Upload files if any
      if (uploadedFiles.length > 0) {
        const uploadPromises = uploadedFiles.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("userId", user.id);

          const { data } = await supabase.functions.invoke("sanitize-media", {
            body: formData,
          });

          if (data?.success && data?.sanitizedPath) {
            const { data: urlData } = supabase.storage
              .from("post-media")
              .getPublicUrl(data.sanitizedPath);
            return urlData.publicUrl;
          }
          return null;
        });

        const uploadResults = await Promise.all(uploadPromises);
        mediaUrls = uploadResults.filter(Boolean) as string[];
      }

      // Create post
      const { data, error } = await supabase
        .from("user_posts")
        .insert({
          user_id: user.id,
          content: newPostContent.trim(),
          media_urls: mediaUrls,
          post_type: mediaUrls.length > 0 ? "media" : "text",
          is_public: true,
        })
        .select("*")
        .single();

      if (error) throw error;

      // Get user profile for the new post
      const { data: userProfile } = await (supabase as any)
        .from("public_user_profiles")
        .select("user_id, display_name, username, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      const newPost = {
        ...data,
        user_profiles: userProfile,
        is_liked: false,
      };

      setPosts((prev) => [newPost, ...prev]);
      setNewPostContent("");
      setUploadedFiles([]);

      toast({
        title: "Post Created",
        description: "Your post has been shared successfully",
      });
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    } finally {
      setIsCreatingPost(false);
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;

    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      if (post.is_liked) {
        // Unlike
        await supabase
          .from("post_likes")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", postId);
      } else {
        // Like
        await supabase.from("post_likes").insert({
          user_id: user.id,
          post_id: postId,
        });
      }

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                is_liked: !p.is_liked,
                like_count: p.is_liked ? p.like_count - 1 : p.like_count + 1,
              }
            : p,
        ),
      );
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data: commentsData, error } = await supabase
        .from("post_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (commentsData) {
        // Get user profiles for comments
        const userIds = [
          ...new Set(commentsData.map((comment) => comment.user_id)),
        ];
        const { data: profiles } = await (supabase as any)
          .from("public_user_profiles")
          .select("user_id, display_name, username, avatar_url")
          .in("user_id", userIds);

        const commentsWithProfiles = commentsData.map((comment) => ({
          ...comment,
          user_profiles:
            profiles?.find((p) => p.user_id === comment.user_id) || null,
        }));

        setComments((prev) => ({ ...prev, [postId]: commentsWithProfiles }));
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const toggleComments = (postId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
      fetchComments(postId);
    }
    setExpandedComments(newExpanded);
  };

  const addComment = async (postId: string) => {
    if (!user || !newComment[postId]?.trim()) return;

    try {
      const { data, error } = await supabase
        .from("post_comments")
        .insert({
          user_id: user.id,
          post_id: postId,
          content: newComment[postId].trim(),
        })
        .select("*")
        .single();

      if (error) throw error;

      // Get user profile for the new comment
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("user_id, display_name, username, avatar_url")
        .eq("user_id", user.id)
        .single();

      const newCommentData = {
        ...data,
        user_profiles: userProfile,
      };

      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newCommentData],
      }));

      setNewComment((prev) => ({ ...prev, [postId]: "" }));

      // Update post comment count
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, comment_count: (p.comment_count || 0) + 1 }
            : p,
        ),
      );
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Please sign in to view your social feed
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Create Post */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback>
                {user.user_metadata?.full_name?.[0] ||
                  user.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">Share something...</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            className="min-h-[100px] resize-none"
          />

          {/* File uploads preview */}
          {uploadedFiles.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="border rounded-lg p-2 bg-muted">
                    <div className="flex items-center gap-2">
                      {file.type.startsWith("image/") && (
                        <ImageIcon className="h-4 w-4" />
                      )}
                      {file.type.startsWith("video/") && (
                        <Video className="h-4 w-4" />
                      )}
                      {!file.type.startsWith("image/") &&
                        !file.type.startsWith("video/") && (
                          <FileText className="h-4 w-4" />
                        )}
                      <span className="text-xs truncate">{file.name}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute -top-1 -right-1 h-6 w-6 rounded-full"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Input
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" size="sm" asChild>
                  <span className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Add Media
                  </span>
                </Button>
              </label>
            </div>

            <Button
              onClick={createPost}
              disabled={
                isCreatingPost ||
                (!newPostContent.trim() && uploadedFiles.length === 0)
              }
            >
              {isCreatingPost ? "Posting..." : "Post"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={post.user_profiles?.avatar_url} />
                <AvatarFallback>
                  {post.user_profiles?.display_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {post.user_profiles?.display_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  @{post.user_profiles?.username} •{" "}
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {post.content && (
              <p className="text-sm leading-relaxed">{post.content}</p>
            )}

            {/* Media */}
            {post.media_urls && post.media_urls.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-lg overflow-hidden">
                {post.media_urls.map((url, index) => (
                  <div key={index} className="relative">
                    {url.includes(".mp4") || url.includes(".webm") ? (
                      <video
                        src={url}
                        controls
                        className="w-full h-auto rounded-lg"
                      />
                    ) : (
                      <img
                        src={url}
                        alt="Post media"
                        className="w-full h-auto rounded-lg object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Post Actions */}
            <div className="flex items-center gap-4 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleLike(post.id)}
                className={post.is_liked ? "text-red-500" : ""}
              >
                <Heart
                  className={`h-4 w-4 mr-1 ${post.is_liked ? "fill-current" : ""}`}
                />
                {post.like_count}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleComments(post.id)}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                {post.comment_count}
              </Button>

              <Button variant="ghost" size="sm">
                <Share className="h-4 w-4 mr-1" />
                {post.share_count}
              </Button>
            </div>

            {/* Comments Section */}
            {expandedComments.has(post.id) && (
              <div className="space-y-3 pt-4 border-t">
                {/* Add Comment */}
                <div className="flex gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {user.user_metadata?.full_name?.[0] ||
                        user.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder="Write a comment..."
                      value={newComment[post.id] || ""}
                      onChange={(e) =>
                        setNewComment((prev) => ({
                          ...prev,
                          [post.id]: e.target.value,
                        }))
                      }
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          addComment(post.id);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => addComment(post.id)}
                      disabled={!newComment[post.id]?.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Comments List */}
                {comments[post.id]?.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user_profiles?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {comment.user_profiles?.display_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg p-3">
                        <p className="text-sm font-medium">
                          {comment.user_profiles?.display_name}
                        </p>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
