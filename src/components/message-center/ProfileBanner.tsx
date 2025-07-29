import React from 'react';
import { User } from '@supabase/supabase-js';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Settings,
  Bell,
  Shield,
  Crown,
  MessageSquare,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { User } from '@supabase/supabase-js';

import { User } from '@supabase/supabase-js';

interface ProfileBannerProps {
 codex/replace-all-instances-of-any-in-codebase
  user: User | null;
  profile: Record<string, unknown> | null;

 codex/replace-any-with-correct-typescript-types
  user: {
    email?: string;
  } | null;
  profile: {
    avatar_url?: string;
    display_name?: string;
    first_name?: string;
    username?: string;
    role?: string;
    subscription_tier?: string;
    bio?: string;
  } | null;

  user: User | null;
  profile: Record<string, unknown> | null;
 main
 main
  unreadCount: number;
}

const ProfileBanner: React.FC<ProfileBannerProps> = ({ user, profile, unreadCount }) => {
  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n?.[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'compliance': return <Shield className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  const getSubscriptionColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'pro': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-600';
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className={`h-24 ${getSubscriptionColor(profile?.subscription_tier || 'free')} relative`}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-4 right-4 flex gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-white/20 hover:bg-white/30 border-white/20"
            onClick={() => window.location.href = '/settings'}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <CardContent className="pt-0 pb-4">
        <div className="flex items-start space-x-4 -mt-8 relative z-10">
          <div className="relative">
            <Avatar className="w-16 h-16 border-4 border-background">
              <AvatarImage src={profile?.avatar_url} alt={profile?.display_name || user?.email} />
              <AvatarFallback className="text-lg font-semibold">
                {getInitials(profile?.display_name || profile?.first_name || user?.email || 'U')}
              </AvatarFallback>
            </Avatar>
            {profile?.role && profile.role !== 'basic' && (
              <div className="absolute -bottom-1 -right-1 p-1 bg-background rounded-full border-2 border-background">
                {getRoleIcon(profile.role)}
              </div>
            )}
          </div>
          
          <div className="flex-1 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {profile?.display_name || profile?.first_name || 'User'}
                </h2>
                <p className="text-muted-foreground text-sm">
                  @{profile?.username || user?.email?.split('@')[0]}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Badge variant="default" className="animate-pulse">
                    <Bell className="h-3 w-3 mr-1" />
                    {unreadCount}
                  </Badge>
                )}
                
                <Badge variant="outline" className="text-xs">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Messages
                </Badge>

                <Badge variant="outline" className="text-xs cursor-pointer" onClick={() => window.location.href = '/settings'}>
                  <Wallet className="h-3 w-3 mr-1" />
                  Wallet
                </Badge>
                
                {profile?.subscription_tier && profile.subscription_tier !== 'free' && (
                  <Badge variant="secondary" className="text-xs capitalize">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {profile.subscription_tier}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {profile?.bio && (
          <div className="mt-4 text-sm text-muted-foreground">
            {profile.bio}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileBanner;