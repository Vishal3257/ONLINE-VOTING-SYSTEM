"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if the access token exists in localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    if (token) {
      // 1. If user is already logged in, redirect straight to the dashboard
      router.push("/dashboard");
    } else {
      // 2. If new user or not logged in, redirect straight to the login page
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-black">
      {/* Show a clean spinner/loader while the redirection logic processes */}
      <div className="text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-300 border-t-black dark:border-zinc-700 dark:border-t-white mx-auto"></div>
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 font-sans">Loading Voting System...</p>
      </div>
    </div>
  );
}