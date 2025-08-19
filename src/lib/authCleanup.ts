/**
 * Secure authentication cleanup utilities
 * Prevents authentication limbo states and ensures clean session management
 */

/**
 * Comprehensive cleanup of all authentication-related storage
 * Removes all Supabase auth tokens and session data
 */
export const cleanupAuthState = (): void => {
  try {
    // Remove standard auth tokens from localStorage
    const keysToRemove = [
      'supabase.auth.token',
      'sb-bkxbkaggxqcsiylwcopt-auth-token'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    // Remove all Supabase auth keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-bkxbkaggxqcsiylwcopt')) {
        localStorage.removeItem(key);
      }
    });

    // Clean sessionStorage if available
    if (typeof sessionStorage !== 'undefined') {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-bkxbkaggxqcsiylwcopt')) {
          sessionStorage.removeItem(key);
        }
      });
    }
  } catch (error) {
    // Silent cleanup - errors here shouldn't block auth flow
  }
};

/**
 * Secure logout with comprehensive cleanup
 * @param supabaseClient - Supabase client instance
 */
export const secureLogout = async (supabaseClient: any): Promise<void> => {
  try {
    // Clean up auth state first
    cleanupAuthState();
    
    // Attempt global sign out (continue even if this fails)
    try {
      await supabaseClient.auth.signOut({ scope: 'global' });
    } catch (error) {
      // Continue even if sign out fails
    }
    
    // Force page reload for complete state reset
    window.location.href = '/auth';
  } catch (error) {
    // Fallback - still redirect even if cleanup fails
    window.location.href = '/auth';
  }
};

/**
 * Secure sign-in with pre-cleanup
 * @param supabaseClient - Supabase client instance
 * @param email - User email
 * @param password - User password
 */
export const secureSignIn = async (
  supabaseClient: any,
  email: string,
  password: string
): Promise<any> => {
  try {
    // Clean up existing state first
    cleanupAuthState();
    
    // Attempt to sign out any existing sessions
    try {
      await supabaseClient.auth.signOut({ scope: 'global' });
    } catch (error) {
      // Continue even if this fails
    }
    
    // Sign in with email/password
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    if (data.user) {
      // Force page reload for clean state
      window.location.href = '/';
    }
    
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};