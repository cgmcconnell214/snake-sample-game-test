import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  user_id: string;
  role?: string;
  subscription_tier?: string;
  compliance_risk?: string;
  kyc_status?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string;
  display_name?: string;
  username?: string;
  bio?: string;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
 codex/replace-any-with-correct-typescript-types
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;

  profile: Record<string, unknown> | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: unknown }>;
 codex/replace-instances-of-any-with-correct-types
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error: unknown }>;

 main
  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, unknown>
 codex/replace-any-with-correct-typescript-types
  ) => Promise<{ error: Error | null }>;

  ) => Promise<{ error: unknown }>;
 main
 main
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
 codex/replace-any-with-correct-typescript-types
  const [profile, setProfile] = useState<Profile | null>(null);

  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
 main
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const cleanupAuthState = () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      // Fetch main profile data
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      // Also fetch user_profile to merge data
      const { data: userProfileData, error: userProfileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (!userProfileError && userProfileData) {
        // Merge user_profile data with profile data, prioritizing user_profile
        const mergedProfile = {
          ...data,
          avatar_url: userProfileData.avatar_url || data.avatar_url,
          display_name: userProfileData.display_name,
          username: userProfileData.username,
          bio: userProfileData.bio
        };
        
        setProfile(mergedProfile);
      } else {
        setProfile(data);
      }
      
      // Check subscription status after profile update
      await checkSubscription();
    } catch (error) {
      console.error('Error in refreshProfile:', error);
    }
  };

  const checkSubscription = async () => {
    if (!user) return;
    
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) return;

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }

      console.log('Subscription check result:', data);
    } catch (error) {
      console.error('Error in checkSubscription:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Defer profile fetching to prevent deadlocks
          setTimeout(() => {
            refreshProfile();
          }, 0);
          
          // Log user behavior
          setTimeout(async () => {
            try {
              await supabase.from('user_behavior_log').insert({
                user_id: session.user.id,
                action: 'login',
                ip_address: null, // Will be handled by RLS
                user_agent: navigator.userAgent,
              });
            } catch (error) {
              console.error('Error logging user behavior:', error);
            }
          }, 100);
        }
        
        if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          refreshProfile();
        }, 0);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      cleanupAuthState();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "Welcome back!",
          description: "You have been successfully signed in.",
        });
        // Force page reload for clean state
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }

      return { error: null };
    } catch (error: unknown) {
 codex/replace-any-with-correct-typescript-types
      // TODO: Verify correct error type

 main
      console.error('Sign in error:', error);
      return { error: error as Error };
    }
  };

 codex/replace-any-with-correct-typescript-types

 codex/replace-instances-of-any-with-correct-types
  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {

 main
  const signUp = async (
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ) => {
 codex/replace-any-with-correct-typescript-types

 main
 main
    try {
      cleanupAuthState();
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata || {}
        }
      });

      if (error) throw error;

      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });

      return { error: null };
    } catch (error: unknown) {
 codex/replace-any-with-correct-typescript-types
      // TODO: Verify correct error type

 main
      console.error('Sign up error:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      cleanupAuthState();

      toast({
        title: "Signed out",
        description: "Redirecting to the homepage...",
      });

      // Navigate away from protected routes immediately
      window.location.replace('/');

      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Ignore errors
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    checkSubscription,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};