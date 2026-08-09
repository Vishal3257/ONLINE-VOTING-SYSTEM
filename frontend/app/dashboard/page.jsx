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
            // Updated endpoint path to match Django urls.py ('cast-vote/')
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
            <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-700 font-sans">
                <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-lg">
                    <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm font-medium">Loading Voting Portal...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
            {/* Top Navbar */}
            <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                            MIMT <span className="text-blue-600">Voting System</span>
                        </h1>
                    </div>
                    
                    <button 
                        onClick={handleLogout}
                        className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-semibold transition-all"
                    >
                        Sign Out 🚪
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 pt-8">
                {/* Banner Header */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 rounded-full border border-blue-100 inline-block mb-2">
                            General Election 2026
                        </span>
                        <h2 className="text-2xl font-bold text-slate-900">Live Election Dashboard</h2>
                        <p className="text-xs text-slate-500 mt-1">Select candidate and click vote to cast your choice.</p>
                    </div>

                    {timeLeft && (
                        <div className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Timer</span>
                            <span className="text-sm font-bold text-amber-600">{timeLeft}</span>
                        </div>
                    )}
                </div>

                {/* Alerts */}
                {successMessage && (
                    <div className="p-4 mb-6 text-sm bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 font-medium flex items-center gap-2">
                        <span>✅</span>
                        <span>{successMessage}</span>
                    </div>
                )}

                {error && (
                    <div className="p-4 mb-6 text-sm bg-rose-50 text-rose-700 rounded-xl border border-rose-200 font-medium flex items-center gap-2">
                        <span>❌</span>
                        <span>{error}</span>
                    </div>
                )}

                {hasVoted && (
                    <div className="p-4 mb-6 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs md:text-sm font-medium text-center">
                        ℹ️ You have already cast your vote in this election. Live standings update automatically!
                    </div>
                )}

                {/* Candidate Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {candidates.map((candidate) => (
                        <div 
                            key={candidate.id} 
                            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                                        {candidate.party || 'Independent'}
                                    </span>
                                    
                                    <div className="text-right">
                                        <span className="text-2xl font-bold text-slate-900 block">{candidate.votes || 0}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Votes</span>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 mb-1">{candidate.name}</h3>
                                <p className="text-xs text-slate-500 mb-6">Official Nominee</p>
                            </div>

                            <button
                                onClick={() => handleVote(candidate.id)}
                                disabled={hasVoted || votingDisabled || votingCandidateId === candidate.id}
                                className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                    hasVoted 
                                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' 
                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
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