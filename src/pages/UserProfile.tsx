import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Edit,
  Save,
  Camera,
  Globe,
  MapPin,
  Calendar,
  Users,
  MessageSquare,
  Heart,
  Share2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAvatar } from "@/hooks/use-avatar";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  website: string;
  location: string;
  phone: string;
  social_links: any;
  is_public: boolean;
  follower_count: number;
  following_count: number;
  post_count: number;
  created_at: string;
}

interface UserPost {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[];
  post_type: string;
  is_public: boolean;
  like_count: number;
  comment_count: number;
  share_count: number;
  created_at: string;
}

const UserProfile: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [activity, setActivity] = useState<
    { id: string; action: string; created_at: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newPost, setNewPost] = useState("");
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { uploadAvatar } = useAvatar();

  const profileSchema = z.object({
    display_name: z.string().min(1, "Display name is required"),
    bio: z.string().optional(),
    website: z.union([z.string().url("Invalid URL"), z.literal("")]).optional(),
    location: z.string().optional(),
    phone: z.string().optional(),
  });
  type ProfileForm = z.infer<typeof profileSchema>;

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: "",
      bio: "",
      website: "",
      location: "",
      phone: "",
    },
    mode: "onChange",
  });

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setUserProfile(data);
        form.reset({
          display_name: data.display_name || "",
          bio: data.bio || "",
          website: data.website || "",
          location: data.location || "",
          phone: data.phone || "",
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("user_posts")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivity = async () => {
    try {
      const { data, error } = await supabase
        .from("user_behavior_log")
        .select("id, action, created_at")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setActivity(data || []);
    } catch (error) {
      console.error("Error fetching activity:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchUserPosts();
      fetchUserActivity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAvatarUpload = async (file: File) => {
    try {
      if (!user?.id) return;
      await uploadAvatar(file);
      toast({
        title: "Avatar Updated",
        description: "Your profile photo has been updated.",
      });
      await fetchUserProfile();
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload profile photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const saveProfile = async (values: ProfileForm) => {
    try {
      // Generate username if not provided on server
      let username = values.display_name
        .toLowerCase()
        .replace(/\s+/g, ".")
        .replace(/[^a-z0-9.]/g, "");
      if (!username) {
        username = `user_${user?.id?.slice(0, 8)}`;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Not authenticated");

      const payload: any = {
        profile: {
          user_id: user?.id,
          username,
          ...values,
        },
      };

      if (profile?.two_factor_enabled) {
        const mfaCode = prompt("Enter your 2FA code");
        if (!mfaCode) {
          toast({
            title: "Verification required",
            description: "2FA code is required to update your profile.",
            variant: "destructive",
          });
          return;
        }
        payload.mfaCode = mfaCode;
      } else {
        const password = prompt("Please confirm your password");
        if (!password) {
          toast({
            title: "Verification required",
            description: "Password confirmation is required to update your profile.",
            variant: "destructive",
          });
          return;
        }
        payload.password = password;
      }

      const { error } = await supabase.functions.invoke("update-user-profile", {
        body: payload,
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });

      setEditing(false);
      fetchUserProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    }
  };

  const createPost = async () => {
    if (!newPost.trim()) return;
    try {
      const { error } = await supabase.from("user_posts").insert({
        user_id: user?.id,
        content: newPost,
        post_type: "text",
      });
      if (error) throw error;

      toast({
        title: "Post Created",
        description: "Your post has been published.",
      });

      setNewPost("");
      fetchUserPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "Failed to create post.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  if (loading) {
    return <div className="p-6">Loading profile...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Profile</h1>
        <Button
          variant={editing ? "default" : "outline"}
          onClick={() =>
            editing ? form.handleSubmit(saveProfile)() : setEditing(true)
          }
          disabled={editing && !form.formState.isValid}
        >
          {editing ? (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          ) : (
            <>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="relative mx-auto w-24 h-24 mb-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={userProfile?.avatar_url} />
                  <AvatarFallback className="text-lg">
                    {getInitials(userProfile?.display_name || user?.email || "U")}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute bottom-0 right-0 rounded-full p-1 h-8 w-8"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) await handleAvatarUpload(file);
                    };
                    input.click();
                  }}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <CardTitle>
                {editing ? (
                  <div className="space-y-1">
                    <Input
                      {...form.register("display_name")}
                      placeholder="Display name"
                    />
                    {form.formState.errors.display_name && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.display_name.message}
                      </p>
                    )}
                  </div>
                ) : (
                  userProfile?.display_name || "User"
                )}
              </CardTitle>
              <CardDescription>@{userProfile?.username}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Bio</label>
                {editing ? (
                  <div className="space-y-1">
                    <Textarea
                      {...form.register("bio")}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                    {form.formState.errors.bio && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.bio.message}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {userProfile?.bio || "No bio available"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                {(editing || userProfile?.location) && (
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {editing ? (
                      <div className="w-full space-y-1">
                        <Input {...form.register("location")} placeholder="Location" />
                        {form.formState.errors.location && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.location.message}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span>{userProfile?.location}</span>
                    )}
                  </div>
                )}

                {(editing || userProfile?.website) && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    {editing ? (
                      <div className="w-full space-y-1">
                        <Input {...form.register("website")} placeholder="Website" />
                        {form.formState.errors.website && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.website.message}
                          </p>
                        )}
                      </div>
                    ) : (
                      userProfile?.website && (
                        <a
                          href={userProfile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {userProfile.website}
                        </a>
                      )
                    )}
                  </div>
                )}

                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Joined{" "}
                    {new Date(userProfile?.created_at || "").toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-around pt-4 border-t">
                <div className="text-center">
                  <div className="font-bold">{userProfile?.post_count || 0}</div>
                  <div className="text-xs text-muted-foreground">Posts</div>
                </div>
                <div className="text-center">
                  <div className="font-bold">
                    {userProfile?.follower_count || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Followers</div>
                </div>
                <div className="text-center">
                  <div className="font-bold">
                    {userProfile?.following_count || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Following</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Posts & Activity */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-4">
              {/* Create Post */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Share your thoughts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="What's on your mind?"
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button onClick={createPost} disabled={!newPost.trim()}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Post
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Posts List */}
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={userProfile?.avatar_url} />
                          <AvatarFallback>
                            {getInitials(
                              userProfile?.display_name || user?.email || "U"
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {userProfile?.display_name || "User"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(post.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{post.content}</p>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="flex space-x-4">
                          <Button variant="ghost" size="sm">
                            <Heart className="h-4 w-4 mr-1" />
                            {post.like_count}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {post.comment_count}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share2 className="h-4 w-4 mr-1" />
                            {post.share_count}
                          </Button>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {post.post_type}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {posts.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        No posts yet. Share your first thought!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardContent className="text-center py-8">
                  <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Activity feed coming soon
                  </p>
                </CardContent>
              </Card>

              {activity.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No recent activity.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {activity.map((act) => (
                    <Card key={act.id}>
                      <CardContent className="flex items-center justify-between py-2">
                        <span>{act.action}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(act.created_at).toLocaleString()}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
