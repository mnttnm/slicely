import { createClient } from "@/server/services/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export type AuthUser = User;

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Error loading user:", error.message);
          setUser(null);
        } else {
          setUser(user);
        }
      } catch (error) {
        console.error("Error loading user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Initial user fetch
    getUser();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN") {
        setUser(session?.user ?? null);
        router.refresh();
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        router.refresh();
        router.push("/");
      } else if (event === "USER_UPDATED") {
        setUser(session?.user ?? null);
        router.refresh();
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, router]);

  const login = async () => {
    router.push("/login");
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error.message);
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  };
} 