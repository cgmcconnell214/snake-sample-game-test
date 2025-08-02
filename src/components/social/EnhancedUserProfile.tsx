import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Settings, 
  Camera, 
  Globe,
  Lock,
  Bell,
  Palette,
  Upload,
  Eye,
  EyeOff,
  MapPin,
  Link as LinkIcon,
  Calendar,
  Users,
  Heart,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfileData {
  user_id: string;
  display_name: string;
  username: string;
  bio: string;
  avatar_url: string;
  profile_banner_url: string;
  website: string;
  location: string;
  phone: string;
  follower_count: number;
  following_count: number;
  post_count: number;
  theme_preferences: {
    theme: string;
    accent_color: string;
  } | null;
  privacy_settings: {
    profile_visibility: string;
    show_followers: boolean;
    show_following: boolean;
  } | null;
  notification_settings: {
    email_notifications: boolean;
    push_notifications: boolean;
    follow_notifications: boolean;
  } | null;
  social_links: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  } | null;
}

export default function EnhancedUserProfile() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'avatar' | 'banner') => {
    if (!user || !file) return;

    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const updateField = type === 'avatar' ? 'avatar_url' : 'profile_banner_url';
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ [updateField]: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, [updateField]: publicUrl } : null);
      
      toast({
        title: "Success",
        description: `${type === 'avatar' ? 'Avatar' : 'Banner'} updated successfully`,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfileData>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleBasicInfoSave = (formData: FormData) => {
    const updates = {
      display_name: formData.get('display_name') as string,
      username: formData.get('username') as string,
      bio: formData.get('bio') as string,
      website: formData.get('website') as string,
      location: formData.get('location') as string,
      phone: formData.get('phone') as string,
      social_links: {
        twitter: formData.get('twitter') as string,
        linkedin: formData.get('linkedin') as string,
        github: formData.get('github') as string,
      }
    };
    updateProfile(updates);
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please sign in to view your profile</p>
      </div>
    );
  }

  if (loading || !profile) {
    return <div className="text-center py-8">Loading profile...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-0">
          {/* Banner */}
          <div className="relative h-48 bg-gradient-to-r from-primary to-primary/80 rounded-t-lg overflow-hidden">
            {profile.profile_banner_url && (
              <img 
                src={profile.profile_banner_url} 
                alt="Profile banner" 
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute bottom-4 right-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'banner');
                }}
                className="hidden"
                id="banner-upload"
              />
              <label htmlFor="banner-upload">
                <Button variant="secondary" size="sm" disabled={uploading} asChild>
                  <span className="cursor-pointer">
                    <Camera className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Change Banner'}
                  </span>
                </Button>
              </label>
            </div>
          </div>

          {/* Profile Info */}
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="relative -mt-16">
                <Avatar className="h-32 w-32 border-4 border-background">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-2xl">
                    {profile.display_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'avatar');
                    }}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label htmlFor="avatar-upload">
                    <Button variant="secondary" size="icon" disabled={uploading} asChild>
                      <span className="cursor-pointer">
                        <Camera className="h-4 w-4" />
                      </span>
                    </Button>
                  </label>
                </div>
              </div>

              {/* Basic Info */}
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{profile.display_name}</h1>
                    <p className="text-muted-foreground">@{profile.username}</p>
                    {profile.bio && (
                      <p className="mt-2 text-sm leading-relaxed">{profile.bio}</p>
                    )}
                  </div>
                  <Dialog open={isEditing} onOpenChange={setIsEditing}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        handleBasicInfoSave(formData);
                      }} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="display_name">Display Name</Label>
                            <Input name="display_name" defaultValue={profile.display_name} />
                          </div>
                          <div>
                            <Label htmlFor="username">Username</Label>
                            <Input name="username" defaultValue={profile.username} />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea name="bio" defaultValue={profile.bio} className="min-h-[80px]" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="website">Website</Label>
                            <Input name="website" defaultValue={profile.website} />
                          </div>
                          <div>
                            <Label htmlFor="location">Location</Label>
                            <Input name="location" defaultValue={profile.location} />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input name="phone" defaultValue={profile.phone} />
                        </div>
                        <Separator />
                        <h3 className="font-medium">Social Links</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="twitter">Twitter</Label>
                            <Input name="twitter" defaultValue={profile.social_links?.twitter} />
                          </div>
                          <div>
                            <Label htmlFor="linkedin">LinkedIn</Label>
                            <Input name="linkedin" defaultValue={profile.social_links?.linkedin} />
                          </div>
                          <div>
                            <Label htmlFor="github">GitHub</Label>
                            <Input name="github" defaultValue={profile.social_links?.github} />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button type="submit">Save Changes</Button>
                          <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Profile Details */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center gap-1">
                      <LinkIcon className="h-4 w-4" />
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                        {profile.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined December 2024
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">{profile.following_count}</span>
                    <span className="text-muted-foreground">Following</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    <span className="font-medium">{profile.follower_count}</span>
                    <span className="text-muted-foreground">Followers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span className="font-medium">{profile.post_count}</span>
                    <span className="text-muted-foreground">Posts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Public Profile</p>
                  <p className="text-sm text-muted-foreground">
                    Make your profile visible to everyone
                  </p>
                </div>
                <Switch 
                  checked={profile.privacy_settings?.profile_visibility === 'public'}
                  onCheckedChange={(checked) => 
                    updateProfile({
                      privacy_settings: {
                        ...profile.privacy_settings,
                        profile_visibility: checked ? 'public' : 'private'
                      }
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Followers</p>
                  <p className="text-sm text-muted-foreground">
                    Let others see who follows you
                  </p>
                </div>
                <Switch 
                  checked={profile.privacy_settings?.show_followers}
                  onCheckedChange={(checked) => 
                    updateProfile({
                      privacy_settings: {
                        ...profile.privacy_settings,
                        show_followers: checked
                      }
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Following</p>
                  <p className="text-sm text-muted-foreground">
                    Let others see who you follow
                  </p>
                </div>
                <Switch 
                  checked={profile.privacy_settings?.show_following}
                  onCheckedChange={(checked) => 
                    updateProfile({
                      privacy_settings: {
                        ...profile.privacy_settings,
                        show_following: checked
                      }
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch 
                  checked={profile.notification_settings?.email_notifications}
                  onCheckedChange={(checked) => 
                    updateProfile({
                      notification_settings: {
                        ...profile.notification_settings,
                        email_notifications: checked
                      }
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications in your browser
                  </p>
                </div>
                <Switch 
                  checked={profile.notification_settings?.push_notifications}
                  onCheckedChange={(checked) => 
                    updateProfile({
                      notification_settings: {
                        ...profile.notification_settings,
                        push_notifications: checked
                      }
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Follow Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone follows you
                  </p>
                </div>
                <Switch 
                  checked={profile.notification_settings?.follow_notifications}
                  onCheckedChange={(checked) => 
                    updateProfile({
                      notification_settings: {
                        ...profile.notification_settings,
                        follow_notifications: checked
                      }
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Theme & Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select 
                  value={profile.theme_preferences?.theme}
                  onValueChange={(value) =>
                    updateProfile({
                      theme_preferences: {
                        ...profile.theme_preferences,
                        theme: value
                      }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Accent Color</Label>
                <div className="flex gap-2">
                  {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        profile.theme_preferences?.accent_color === color ? 'border-foreground' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() =>
                        updateProfile({
                          theme_preferences: {
                            ...profile.theme_preferences,
                            accent_color: color
                          }
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}