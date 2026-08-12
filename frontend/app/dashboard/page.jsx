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
                setHasVoted(data.has_voted || false);
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

    const totalVotes = candidates.reduce((acc, curr) => acc + (curr.votes || 0), 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-800 font-sans">
                <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-xl">
                    <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm font-semibold text-slate-700">Loading Voting Portal...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans pb-16">
            {/* Header Navbar */}
            <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-xs">
                <div className="max-w-6xl mx-auto px-6 py-3.5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20">
                            🗳️
                        </div>
                        <div>
                            <h1 className="text-base font-black tracking-tight text-slate-900 leading-none">
                                MIMT <span className="text-blue-600">Voting Portal</span>
                            </h1>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Student Union 2026</span>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleLogout}
                        className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold transition-all"
                    >
                        Sign Out 🚪
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 pt-6">
                
                {/* Visual Banner */}
                <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white rounded-3xl p-6 md:p-10 shadow-xl mb-8">
                    <div className="absolute -right-10 -bottom-10 opacity-10 text-9xl font-black select-none pointer-events-none">
                        VOTE
                    </div>

                    <div className="relative z-10 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 text-[11px] font-bold uppercase tracking-widest bg-white/10 backdrop-blur-md text-blue-100 rounded-full border border-white/20 mb-4">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Official General Election 2026
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-2">
                            Shape Your Campus Future with Your Vote
                        </h2>
                        <p className="text-xs md:text-sm text-blue-100 font-medium leading-relaxed opacity-90">
                            Cast your ballot securely and transparently. Every single vote directly reflects in real-time updates.
                        </p>
                    </div>

                    {/* Quick Stats Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-8 pt-6 border-t border-white/15">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center border border-white/10">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200 block">Total Candidates</span>
                            <span className="text-xl font-black text-white">{candidates.length}</span>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center border border-white/10">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200 block">Votes Polled</span>
                            <span className="text-xl font-black text-white">{totalVotes}</span>
                        </div>

                        <div className="col-span-2 md:col-span-1 bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center border border-white/10 flex flex-col justify-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200 block">Poll Status</span>
                            <span className="text-sm font-black text-emerald-300">
                                {timeLeft ? timeLeft : '🟢 Active & Live'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Status Messages */}
                {successMessage && (
                    <div className="p-4 mb-6 text-sm bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 font-medium flex items-center gap-3 shadow-xs">
                        <span className="text-xl">✅</span>
                        <span>{successMessage}</span>
                    </div>
                )}

                {error && (
                    <div className="p-4 mb-6 text-sm bg-rose-50 text-rose-800 rounded-2xl border border-rose-200 font-medium flex items-center gap-3 shadow-xs">
                        <span className="text-xl">❌</span>
                        <span>{error}</span>
                    </div>
                )}

                {hasVoted && (
                    <div className="p-4 mb-8 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900 text-xs md:text-sm font-semibold text-center shadow-xs flex items-center justify-center gap-2">
                        <span>🗳️</span> You have already cast your vote in this election. Standings update automatically below.
                    </div>
                )}

                {/* Section Title */}
                <div className="flex items-center justify-between mb-4 px-1">
                    <div>
                        <h3 className="text-lg font-black text-slate-900">Official Candidates</h3>
                        <p className="text-xs text-slate-500 font-medium">Review candidates and cast your vote.</p>
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-lg border border-slate-200">
                        Live Standings
                    </span>
                </div>

                {/* Candidates Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {candidates.map((candidate) => (
                        <div 
                            key={candidate.id} 
                            className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-xl font-black text-slate-600 shadow-inner">
                                            {candidate.name ? candidate.name.charAt(0) : 'C'}
                                        </div>
                                        <div>
                                            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 rounded-md border border-slate-200 inline-block mb-1">
                                                {candidate.party || 'Independent'}
                                            </span>
                                            <h4 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                                                {candidate.name}
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="text-right bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                                        <span className="text-2xl font-black text-blue-600 block leading-tight">
                                            {candidate.votes || 0}
                                        </span>
                                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Votes</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleVote(candidate.id)}
                                disabled={hasVoted || votingDisabled || votingCandidateId === candidate.id}
                                className={`w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${
                                    hasVoted || votingDisabled
                                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' 
                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-[0.99]'
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

                {/* Instructions Footer Box */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
                    <div className="flex gap-3 items-start">
                        <span className="text-2xl">🔒</span>
                        <div>
                            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Encrypted & Secure</h5>
                            <p className="text-[11px] text-slate-500 mt-0.5">Your vote is protected using JWT authentication and backend verification.</p>
                        </div>
                    </div>
                    <div className="flex gap-3 items-start">
                        <span className="text-2xl">⚡</span>
                        <div>
                            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Real-time Sync</h5>
                            <p className="text-[11px] text-slate-500 mt-0.5">Vote counts automatically refresh across all active student dashboards.</p>
                        </div>
                    </div>
                    <div className="flex gap-3 items-start">
                        <span className="text-2xl">☝️</span>
                        <div>
                            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Single Vote Policy</h5>
                            <p className="text-[11px] text-slate-500 mt-0.5">Each student can cast exactly one vote per election cycle.</p>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}