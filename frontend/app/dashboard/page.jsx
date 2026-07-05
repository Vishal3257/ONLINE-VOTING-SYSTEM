'use client';
import { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';

export default function Dashboard() {
    const [candidates, setCandidates] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const fetchCandidates = async () => {
        try {
            const data = await apiRequest('candidates/', 'GET');
            setCandidates(data);
        } catch (err) {
            console.error("Failed to fetch candidates", err);
        }
    };

    useEffect(() => {
        fetchCandidates();
        const interval = setInterval(fetchCandidates, 4000);
        return () => clearInterval(interval);
    }, []);

    const handleVote = async (candidateId) => {
        setMessage(''); setError('');
        try {
            // API पर रिक्वेस्ट भेजी
            const response = await apiRequest('cast-vote/', 'POST', { candidate_id: candidateId });
            
            setMessage(`🎉 ${response.message || 'Vote casted successfully!'}`);
            fetchCandidates(); 

            // ─── AUTO LOGOUT LOGIC FOR MULTI-USER BOOTH ───
            // 1. ब्राउज़र से तुरंत टोकन हटाओ ताकि सेशन क्लोज हो जाए
            localStorage.removeItem('token'); 
            
            // 2. थोड़ा सा डिले (800ms) दिया है ताकि यूजर को "Success Message" दिख जाए, फिर लॉगिन पर भेज दो
            setTimeout(() => {
                window.location.href = '/login';
            }, 800);

        } catch (err) {
            setError(`❌ ${err.message || 'Something went wrong'}`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 font-sans pb-12">
            {/* College Banner Header */}
            <header className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white text-center py-8 px-4 shadow-xl border-b-4 border-amber-500">
                <h1 className="text-2xl md:text-4xl font-black tracking-wide uppercase">Modi Institute of Management & Technology</h1>
                <p className="text-amber-400 font-semibold tracking-widest text-xs md:text-sm mt-2">DEPARTMENT OF COMPUTER APPLICATIONS</p>
                <div className="mt-4 inline-block bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-medium border border-white/20">
                    🔴 Live General Election Panel 2026
                </div>
            </header>

            <main className="max-w-5xl mx-auto mt-10 px-4">
                {message && <div className="p-4 mb-6 bg-emerald-100 border-l-4 border-emerald-500 text-emerald-900 font-semibold rounded-r-xl shadow-sm transition animate-bounce">{message}</div>}
                {error && <div className="p-4 mb-6 bg-rose-100 border-l-4 border-rose-500 text-rose-900 font-semibold rounded-r-xl shadow-sm">{error}</div>}

                {/* Candidate Selection Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                    {candidates.map((candidate) => {
                        const isBJP = candidate.party === 'BJP';
                        return (
                            <div key={candidate.id} className={`bg-white rounded-2xl overflow-hidden shadow-md border-t-8 transition transform hover:scale-[1.01] hover:shadow-xl ${isBJP ? 'border-orange-500' : 'border-blue-500'}`}>
                                <div className="p-8 text-center">
                                    <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isBJP ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {isBJP ? 'Bharatiya Janata Party' : 'Congress (CNG)'}
                                    </span>
                                    
                                    <h2 className="text-3xl font-extrabold text-gray-800 mt-4 tracking-tight">{candidate.name}</h2>
                                    <p className="text-gray-400 text-sm mt-1">Official Nominee</p>
                                    
                                    {/* Vote Counter Badge */}
                                    <div className="my-6 inline-flex flex-col items-center justify-center w-28 h-28 rounded-full bg-slate-50 border border-gray-100 shadow-inner">
                                        <span className="text-3xl font-black text-slate-800">{candidate.votes || candidate.vote_count || 0}</span>
                                        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1">Live Votes</span>
                                    </div>
                                    
                                    {/* Supporters/Voters List Area */}
                                    <div className="mb-6 text-left bg-slate-50 p-4 rounded-xl border border-gray-100 min-h-[90px]">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Supporters Area ({candidate.voters?.length || 0})</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {candidate.voters && candidate.voters.length > 0 ? (
                                                candidate.voters.map((voterName, index) => (
                                                    <span key={index} className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${isBJP ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                                        👤 {voterName}
                                                    </span>
                                                ))
                                            ) : (
                                                <p className="text-xs text-gray-400 italic">No votes yet. Be the first to vote!</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleVote(candidate.id)}
                                        className={`w-full py-4 text-white font-bold rounded-xl text-lg shadow-lg tracking-wide transition ${isBJP ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/20' : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-blue-500/20'}`}
                                    >
                                        Vote for {candidate.party || 'Candidate'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}