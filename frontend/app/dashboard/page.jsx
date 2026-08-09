'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../utils/api';

export default function Dashboard() {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [hasVoted, setHasVoted] = useState(false);
    const [votingDisabled, setVotingDisabled] = useState(false);
    const [votingEndsAt, setVotingEndsAt] = useState(null);
    const [timeLeft, setTimeLeft] = useState('');
    const [votingCandidateId, setVotingCandidateId] = useState(null);

    const router = useRouter();

    const fetchDashboardData = async () => {
        try {
            const data = await apiRequest('candidates/', 'GET');
            
            if (Array.isArray(data)) {
                setCandidates(data);
            } else if (data && data.candidates) {
                setCandidates(data.candidates);
                setHasVoted(data.has_voted);
                setVotingDisabled(data.voting_disabled || false);
                if (data.voting_ends_at) {
                    setVotingEndsAt(new Date(data.voting_ends_at));
                }
            }
        } catch (err) {
            if (err.message && err.message.includes('token_not_valid')) {
                localStorage.removeItem('token');
                router.push('/login');
            } else {
                setError(err.message || 'Failed to load candidates data.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 3000);
        return () => clearInterval(interval);
    }, [router]);

    useEffect(() => {
        if (!votingEndsAt) return;

        const timer = setInterval(() => {
            const now = new Date();
            const difference = votingEndsAt - now;

            if (difference <= 0) {
                setTimeLeft('Voting Ended');
                setVotingDisabled(true);
                clearInterval(timer);
            } else {
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s left`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [votingEndsAt]);

    const handleVote = async (candidateId) => {
        if (hasVoted) {
            setError('You have already cast your vote!');
            return;
        }

        setVotingCandidateId(candidateId);
        setError('');
        setSuccessMessage('');

        try {
            const data = await apiRequest('cast-vote/', 'POST', { candidate_id: candidateId });
            setSuccessMessage(data.message || '🎉 Your vote has been recorded successfully!');
            setHasVoted(true);
            fetchDashboardData();
        } catch (err) {
            setError(err.message || 'Failed to submit vote.');
        } finally {
            setVotingCandidateId(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-800 font-sans">
                <div className="flex items-center gap-3 bg-white/80 px-6 py-4 rounded-2xl border border-slate-200/80 backdrop-blur-md shadow-lg">
                    <svg className="animate-spin h-5 w-5 text-indigo-600" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm font-semibold tracking-wide text-slate-700">Loading Voting Portal...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-50/70 via-slate-50 to-blue-50/60 text-slate-800 font-sans pb-16 relative overflow-hidden">
            {/* Ambient Soft Glow Background Elements */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-10 w-72 h-72 bg-purple-300/15 rounded-full blur-3xl pointer-events-none" />

            {/* Top Navbar */}
            <header className="border-b border-slate-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-50 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <h1 className="text-lg font-black tracking-tight text-slate-900">
                            MIMT <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">Voting System</span>
                        </h1>
                    </div>
                    
                    <button 
                        onClick={handleLogout}
                        className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                        Sign Out 🚪
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 pt-10 relative z-10">
                {/* Header Banner */}
                <div className="bg-white/80 border border-slate-200/90 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-sm mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 text-[11px] font-bold uppercase tracking-widest bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 mb-3">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            General Election 2026
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Live Election Dashboard</h2>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Select a candidate and cast your vote in real-time.</p>
                    </div>

                    {timeLeft && (
                        <div className="bg-amber-50/80 border border-amber-200/80 px-5 py-3 rounded-2xl text-center shadow-sm">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700 block mb-0.5">Time Remaining</span>
                            <span className="text-base font-black text-amber-600">{timeLeft}</span>
                        </div>
                    )}
                </div>

                {/* Alerts */}
                {successMessage && (
                    <div className="p-4 mb-6 text-sm bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 font-medium flex items-center gap-3 shadow-sm">
                        <span className="text-lg">✅</span>
                        <span>{successMessage}</span>
                    </div>
                )}

                {error && (
                    <div className="p-4 mb-6 text-sm bg-rose-50 text-rose-800 rounded-2xl border border-rose-200 font-medium flex items-center gap-3 shadow-sm">
                        <span className="text-lg">❌</span>
                        <span>{error}</span>
                    </div>
                )}

                {hasVoted && (
                    <div className="p-4 mb-8 bg-indigo-50/80 border border-indigo-100 rounded-2xl text-indigo-900 text-xs md:text-sm font-medium text-center shadow-sm">
                        ℹ️ You have already cast your vote in this election. Standings update automatically!
                    </div>
                )}

                {/* Candidate Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {candidates.map((candidate) => (
                        <div 
                            key={candidate.id} 
                            className="bg-white/80 border border-slate-200/90 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between group"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <span className="px-3.5 py-1 text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 rounded-xl border border-slate-200">
                                        {candidate.party || 'Independent'}
                                    </span>
                                    
                                    <div className="text-right">
                                        <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 block">
                                            {candidate.votes || 0}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Votes</span>
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black text-slate-900 mb-1 tracking-tight group-hover:text-indigo-600 transition-colors">
                                    {candidate.name}
                                </h3>
                                <p className="text-xs text-slate-500 font-medium mb-8">Official Nominee</p>
                            </div>

                            <button
                                onClick={() => handleVote(candidate.id)}
                                disabled={hasVoted || votingDisabled || votingCandidateId === candidate.id}
                                className={`w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${
                                    hasVoted || votingDisabled
                                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' 
                                        : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md shadow-indigo-200 hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0'
                                }`}
                            >
                                {votingCandidateId === candidate.id ? (
                                    'Submitting Vote...'
                                ) : hasVoted ? (
                                    'Already Voted 🗳️'
                                ) : (
                                    `Vote For ${candidate.name}`
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}