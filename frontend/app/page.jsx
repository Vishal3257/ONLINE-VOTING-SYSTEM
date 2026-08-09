'use client';

import Link from 'next/link';

export default function Home() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
            {/* Top Navigation Bar */}
            <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20">
                            🗳️
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">
                                MIMT <span className="text-blue-600">Vote</span>
                            </h1>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Digital Election Portal</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/register"
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                        >
                            Register
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-16 pb-20 bg-gradient-to-b from-blue-50/50 via-slate-50 to-slate-50">
                <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-widest bg-blue-100/80 text-blue-700 rounded-full border border-blue-200/80 mb-6">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Next-Gen Campus Voting
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight mb-6">
                        Empowering Student Voices with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Secure Digital Voting</span>
                    </h1>

                    <p className="text-base md:text-lg text-slate-600 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
                        A transparent, real-time, and encrypted online voting system designed specifically for MIMT elections. Cast your vote seamlessly from any device.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/register"
                            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5"
                        >
                            Cast Your Vote Now 🗳️
                        </Link>
                        <Link
                            href="/login"
                            className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs uppercase tracking-wider border border-slate-200 rounded-2xl shadow-xs transition-all"
                        >
                            Already Registered? Login
                        </Link>
                    </div>
                </div>
            </section>

            {/* Live Stats Preview */}
            <section className="max-w-6xl mx-auto px-6 -mt-6 mb-16">
                <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div className="border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0">
                        <span className="text-3xl md:text-4xl font-black text-blue-600 block mb-1">100%</span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Encrypted Ballot</span>
                    </div>
                    <div className="border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0">
                        <span className="text-3xl md:text-4xl font-black text-indigo-600 block mb-1">Real-Time</span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Results Sync</span>
                    </div>
                    <div>
                        <span className="text-3xl md:text-4xl font-black text-emerald-600 block mb-1">Single Vote</span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Authentication</span>
                    </div>
                </div>
            </section>

            {/* Platform Features Section */}
            <section className="max-w-6xl mx-auto px-6 mb-20">
                <div className="text-center mb-12">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">How It Works</h2>
                    <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">Simple 3-step voting process</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xs hover:border-blue-300 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 font-black text-lg flex items-center justify-center mb-6">
                            01
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-2">Create Account</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Register with your student details. Secure authentication ensures eligible voters participate once.
                        </p>
                    </div>

                    <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xs hover:border-blue-300 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 font-black text-lg flex items-center justify-center mb-6">
                            02
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-2">Choose Candidate</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Review candidate profiles and political nominees on your personalized election dashboard.
                        </p>
                    </div>

                    <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xs hover:border-blue-300 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 font-black text-lg flex items-center justify-center mb-6">
                            03
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-2">Cast Vote</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Submit your ballot instantly. Your choice is securely stored and live standings are updated.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
                <p>© 2026 MIMT Voting Portal. Built for secure & transparent campus elections.</p>
            </footer>
        </div>
    );
}