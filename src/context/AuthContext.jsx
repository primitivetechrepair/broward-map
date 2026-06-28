import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    setProfileLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Profile fetch error:", error.message);
      setProfile(null);
      setProfileLoading(false);
      return null;
    }

    setProfile(data);
    setProfileLoading(false);
    return data;
  };

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Session load error:", error.message);
      }

      if (!isMounted) return;

      const currentSession = data?.session || null;
      const currentUser = currentSession?.user || null;

      setSession(currentSession);
      setUser(currentUser);

      if (currentUser?.id) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      const currentUser = currentSession?.user || null;

      setSession(currentSession);
      setUser(currentUser);

      if (currentUser?.id) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async ({ email, password }) => {
    return supabase.auth.signInWithPassword({
      email,
      password,
    });
  };

  const signUp = async ({ email, password, fullName, phone }) => {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
        },
      },
    });

    return result;
  };

  const signOut = async () => {
    await supabase.auth.signOut();

    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (!user?.id) return null;
    return fetchProfile(user.id);
  };

  const isAdmin = profile?.role === "admin";

  const isApproved =
    profile?.verification_status === "approved" &&
    profile?.age_verified === true;

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      profileLoading,
      isAdmin,
      isApproved,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [
      session,
      user,
      profile,
      loading,
      profileLoading,
      isAdmin,
      isApproved,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}