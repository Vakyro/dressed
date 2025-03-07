"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export interface UserProfile {
  id: string;
  Name: string;
  LastName: string;
  Plan: string;
  Email: string;
}

export function useUser() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        try {
          const { data, error } = await supabase
            .from("users")
            .select("id, Name, LastName, Plan, Email")
            .eq("auth_User_Id", user.id)
            .single();
          if (error) throw error;
          setUserProfile(data);
          setUserId(data.id);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        router.push("/login");
      }
    }
    checkUser();
  }, [router]);

  return { isLoggedIn, userProfile, userId };
}
