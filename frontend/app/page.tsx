"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Standardized token key check with Login & Dashboard components
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (token) {
      // Redirect to dashboard if user is authenticated
      router.push("/dashboard");
    } else {
      // Redirect to login if user is not authenticated
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white font-sans relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="text-center relative z-10 bg-slate-900/80 p-8 rounded-3xl border border-slate-800/80 backdrop-blur-md shadow-2xl">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-500 mx-auto"></div>
        <h3 className="mt-4 text-base font-bold tracking-tight text-slate-200">MIMT Voting System</h3>
        <p className="mt-1 text-xs text-slate-400 font-medium">Verifying authentication session...</p>
      </div>
    </div>
  );
}