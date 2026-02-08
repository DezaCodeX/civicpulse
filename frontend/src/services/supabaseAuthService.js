import { supabase } from "../supabaseClient";

/**
 * Synchronize Supabase authentication with Django
 * Creates/fetches user in Django and assigns roles
 *
 * Flow:
 * 1. Supabase Google OAuth login/signup
 * 2. Get session access token
 * 3. Send token/email to Django
 * 4. Django creates user if not exists
 * 5. Django returns JWT tokens + user role info
 */

export const syncSupabaseWithDjango = async (supabaseSession) => {
  if (!supabaseSession) {
    console.error("No Supabase session available");
    return null;
  }

  try {
    const email = supabaseSession.user.email;
    const supabaseAccessToken = supabaseSession.access_token;

    console.log("🔄 Syncing Supabase user with Django:", { email });

    // Call Django endpoint to create/sync user
    const response = await fetch("http://127.0.0.1:8000/api/supabase-login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        supabase_token: supabaseAccessToken,
        user_metadata: supabaseSession.user.user_metadata || {},
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Django sync failed:", errorData);
      throw new Error(errorData.detail || "Failed to sync with Django");
    }

    const data = await response.json();

    console.log("✅ Successfully synced with Django:", {
      email: data.user?.email,
      role: data.user?.role,
      is_staff: data.user?.is_staff,
    });

    // Store JWT tokens from Django
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);

    // Store user info (including roles)
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("userEmail", email);

    return data;
  } catch (error) {
    console.error("❌ Error syncing Supabase with Django:", error);
    throw error;
  }
};

/**
 * Perform Supabase Google OAuth login
 */
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          import.meta.env.VITE_SUPABASE_REDIRECT_URL ||
          "http://localhost:3000/dashboard",
      },
    });

    if (error) {
      console.error("Google OAuth error:", error);
      throw error;
    }

    console.log("🔐 Google OAuth initiated");
    return data;
  } catch (error) {
    console.error("❌ Error signing in with Google:", error);
    throw error;
  }
};

/**
 * Handle OAuth callback and sync with Django
 * Call this after user is redirected back from Google
 */
export const handleAuthCallback = async () => {
  try {
    // Get current session (should be set after OAuth redirect)
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      console.error("No session found after OAuth redirect");
      return null;
    }

    // Sync the session with Django
    const syncData = await syncSupabaseWithDjango(session);
    return syncData;
  } catch (error) {
    console.error("❌ Error handling auth callback:", error);
    throw error;
  }
};

/**
 * Sign out from both Supabase and Django
 */
export const logOut = async () => {
  try {
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Supabase sign out error:", error);
      throw error;
    }

    // Clear all local storage
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");

    console.log("✅ Successfully logged out");
  } catch (error) {
    console.error("❌ Error logging out:", error);
    throw error;
  }
};

/**
 * Listen to Supabase auth state changes and sync with Django
 */
export const setupAuthStateListener = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log("🔐 Auth state changed:", event, !!session);

      if (event === "SIGNED_IN" && session) {
        try {
          // Sync new session with Django
          const syncData = await syncSupabaseWithDjango(session);
          callback("signed_in", { user: syncData?.user, session });
        } catch (error) {
          console.error("Error syncing on sign in:", error);
          callback("error", error);
        }
      } else if (event === "SIGNED_OUT") {
        // Clear local data
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");
        localStorage.removeItem("userEmail");
        callback("signed_out", null);
      } else if (event === "TOKEN_REFRESHED") {
        // Session refreshed, might need to update Django token
        callback("token_refreshed", { session });
      } else if (event === "USER_UPDATED") {
        callback("user_updated", { user: session?.user, session });
      }
    }
  );

  return subscription;
};
