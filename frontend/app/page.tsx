"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if the access token exists in localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    if (token) {
      // Redirect to dashboard if user is authenticated
      router.push("/dashboard");
    } else {
      // Redirect to login if user is not authenticated
      router.push("/login");
    }
  }, [router]);

  // CRITICAL FIX: Next.js needs a return statement to render a valid component root
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-300 border-t-black dark:border-zinc-700 dark:border-t-white mx-auto"></div>
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 font-sans">Loading Voting System...</p>
      </div>
    </div>
  );
}