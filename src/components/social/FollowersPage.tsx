import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, UserMinus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  follower_count: number | null;
  following_count: number | null;
  is_following?: boolean;
  mutual_connections?: number;
}

interface FollowRelation {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  follower_profile?: UserProfile | null;
  following_profile?: UserProfile | null;
}

export default function FollowersPage() {
  const [followers, setFollowers] = useState<FollowRelation[]>([]);
  const [following, setFollowing] = useState<FollowRelation[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('followers');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchFollowData();
      fetchSuggestedUsers();
    }
  }, [user]);

  const fetchFollowData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch followers with manual joins
      const { data: followersData, error: followersError } = await supabase
        .from('user_follows')
        .select('*')
        .eq('following_id', user.id);

      if (followersError) throw followersError;

      // Get follower profiles
      const followerIds = followersData?.map(f => f.follower_id) || [];
      const { data: followerProfiles } = await supabase
        .from('user_profiles')
        .select('*')
        .in('user_id', followerIds);

      // Fetch following with manual joins
      const { data: followingData, error: followingError } = await supabase
        .from('user_follows')
        .select('*')
        .eq('follower_id', user.id);

      if (followingError) throw followingError;

      // Get following profiles
      const followingIds = followingData?.map(f => f.following_id) || [];
      const { data: followingProfiles } = await supabase
        .from('user_profiles')
        .select('*')
        .in('user_id', followingIds);

      // Combine data
      const followersWithProfiles = followersData?.map(f => ({
        ...f,
        follower_profile: followerProfiles?.find(p => p.user_id === f.follower_id)
      })) || [];

      const followingWithProfiles = followingData?.map(f => ({
        ...f,
        following_profile: followingProfiles?.find(p => p.user_id === f.following_id)
      })) || [];

      setFollowers(followersWithProfiles);
      setFollowing(followingWithProfiles);
    } catch (error) {
      console.error('Error fetching follow data:', error);
      toast({
        title: "Error",
        description: "Failed to load followers and following data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestedUsers = async () => {
    if (!user) return;

    try {
      // Get users that current user is not following and exclude self
      const { data: allUsers, error } = await supabase
        .from('user_profiles')
        .select('*')
        .neq('user_id', user.id)
        .limit(20);

      if (error) throw error;

      // Filter out users that are already being followed
      const followingIds = new Set(following.map(f => f.following_id));
      const suggested = (allUsers || [])
        .filter(u => !followingIds.has(u.user_id))
        .slice(0, 10);

      // Check follow status for suggested users
      const suggestedWithStatus = await Promise.all(
        suggested.map(async (suggestedUser) => {
          const { data: followStatus } = await supabase
            .from('user_follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', suggestedUser.user_id)
            .single();

          return {
            ...suggestedUser,
            is_following: !!followStatus,
            mutual_connections: Math.floor(Math.random() * 10) // Mock mutual connections
          };
        })
      );

      setSuggestedUsers(suggestedWithStatus);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    }
  };

  const followUser = async (targetUserId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          following_id: targetUserId
        });

      if (error) throw error;

      // Update suggested users
      setSuggestedUsers(prev => 
        prev.map(u => 
          u.user_id === targetUserId 
            ? { ...u, is_following: true, follower_count: u.follower_count + 1 }
            : u
        )
      );

      // Refresh data
      fetchFollowData();

      toast({
        title: "Following",
        description: "You are now following this user",
      });
    } catch (error) {
      console.error('Error following user:', error);
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    }
  };

  const unfollowUser = async (targetUserId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (error) throw error;

      // Update suggested users
      setSuggestedUsers(prev => 
        prev.map(u => 
          u.user_id === targetUserId 
            ? { ...u, is_following: false, follower_count: Math.max(0, u.follower_count - 1) }
            : u
        )
      );

      // Update following list
      setFollowing(prev => prev.filter(f => f.following_id !== targetUserId));

      toast({
        title: "Unfollowed",
        description: "You are no longer following this user",
      });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast({
        title: "Error",
        description: "Failed to unfollow user",
        variant: "destructive",
      });
    }
  };

  const removeFollower = async (followerUserId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', followerUserId)
        .eq('following_id', user.id);

      if (error) throw error;

      setFollowers(prev => prev.filter(f => f.follower_id !== followerUserId));

      toast({
        title: "Follower Removed",
        description: "Follower has been removed",
      });
    } catch (error) {
      console.error('Error removing follower:', error);
      toast({
        title: "Error",
        description: "Failed to remove follower",
        variant: "destructive",
      });
    }
  };

  const filteredFollowers = followers.filter(f =>
    f.follower_profile?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.follower_profile?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFollowing = following.filter(f =>
    f.following_profile?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.following_profile?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSuggested = suggestedUsers.filter(u =>
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please sign in to view followers and following</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Social Connections</h1>
          <p className="text-muted-foreground">
            Manage your followers and discover new people to follow
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            <Users className="h-4 w-4 mr-1" />
            {followers.length} followers
          </Badge>
          <Badge variant="outline">
            {following.length} following
          </Badge>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="followers">
            Followers ({followers.length})
          </TabsTrigger>
          <TabsTrigger value="following">
            Following ({following.length})
          </TabsTrigger>
          <TabsTrigger value="suggested">
            Suggested
          </TabsTrigger>
        </TabsList>

        <TabsContent value="followers" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading followers...</div>
          ) : filteredFollowers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No followers found matching your search' : 'No followers yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFollowers.map((relation) => (
                <Card key={relation.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar>
                        <AvatarImage src={relation.follower_profile?.avatar_url} />
                        <AvatarFallback>
                          {relation.follower_profile?.display_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {relation.follower_profile?.display_name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          @{relation.follower_profile?.username}
                        </p>
                      </div>
                    </div>
                    
                    {relation.follower_profile?.bio && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {relation.follower_profile.bio}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span>{relation.follower_profile?.follower_count} followers</span>
                      <span>{relation.follower_profile?.following_count} following</span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => followUser(relation.follower_id)}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Follow Back
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFollower(relation.follower_id)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="following" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading following...</div>
          ) : filteredFollowing.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No following found matching your search' : 'Not following anyone yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFollowing.map((relation) => (
                <Card key={relation.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar>
                        <AvatarImage src={relation.following_profile?.avatar_url} />
                        <AvatarFallback>
                          {relation.following_profile?.display_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {relation.following_profile?.display_name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          @{relation.following_profile?.username}
                        </p>
                      </div>
                    </div>
                    
                    {relation.following_profile?.bio && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {relation.following_profile.bio}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span>{relation.following_profile?.follower_count} followers</span>
                      <span>{relation.following_profile?.following_count} following</span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => unfollowUser(relation.following_id)}
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      Unfollow
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="suggested" className="space-y-4">
          {filteredSuggested.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No suggested users found matching your search' : 'No suggestions available'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuggested.map((userProfile) => (
                <Card key={userProfile.user_id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar>
                        <AvatarImage src={userProfile.avatar_url} />
                        <AvatarFallback>
                          {userProfile.display_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {userProfile.display_name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          @{userProfile.username}
                        </p>
                      </div>
                    </div>
                    
                    {userProfile.bio && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {userProfile.bio}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span>{userProfile.follower_count} followers</span>
                      <span>{userProfile.mutual_connections} mutual</span>
                    </div>

                    <Button
                      variant={userProfile.is_following ? "outline" : "default"}
                      size="sm"
                      className="w-full"
                      onClick={() => 
                        userProfile.is_following 
                          ? unfollowUser(userProfile.user_id)
                          : followUser(userProfile.user_id)
                      }
                    >
                      {userProfile.is_following ? (
                        <>
                          <UserMinus className="h-4 w-4 mr-1" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-1" />
                          Follow
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}