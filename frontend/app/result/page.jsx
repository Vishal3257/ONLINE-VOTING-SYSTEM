'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../utils/api';

export default function ResultDashboard() {
  const [results, setResults] = useState([]);
  const [winner, setWinner] = useState('');
  const [gapMessage, setGapMessage] = useState('');
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isBlasting, setIsBlasting] = useState(false);

  // Fetch live results from Django backend using apiRequest utility
  const fetchResults = async () => {
    try {
      const data = await apiRequest('results/', 'GET');
      if (data) {
        setResults(data.results || []);
        setWinner(data.winner || '');
        setGapMessage(data.gap_message || '');
        setTotalVotes(data.total_votes_polled || 0);
      }
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 4000);
    return () => clearInterval(interval);
  }, []);

  // Trigger Bulk Email Blast to all voters from admin side
  const handleAnnounceAndEmail = async () => {
    if (!window.confirm("Are you sure you want to announce results and send email to all voters?")) return;
    
    setIsBlasting(true);
    try {
      const data = await apiRequest('results/', 'POST');
      if (data) {
        alert(data.message || "Email blast started successfully!");
      }
    } catch (error) {
      console.error("Error in email blast:", error);
      alert(error.message || "Failed to trigger email blast.");
    } finally {
      setIsBlasting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white font-sans">
        <div className="flex items-center gap-3 bg-slate-900/80 px-6 py-4 rounded-2xl border border-slate-800 backdrop-blur-md shadow-2xl">
          <svg className="animate-spin h-5 w-5 text-indigo-400" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-semibold tracking-wide">Loading Live Election Standings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-indigo-950 to-slate-950 px-4 py-12 relative overflow-hidden">
      {/* Ambient Background Decorative Blurs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphism Container */}
      <div className="w-full max-w-2xl p-8 md:p-10 bg-slate-900/80 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-800/80 relative z-10">
        
        {/* Header Badge & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-[11px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Analytics & Tally
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Election <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">Dashboard</span>
          </h2>
        </div>

        {/* Total Votes Card */}
        <div className="bg-slate-800/50 border border-slate-700/80 p-5 rounded-2xl text-center mb-8 shadow-inner">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Votes Polled</span>
          <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
            {totalVotes}
          </span>
        </div>

        {/* Candidates Standings List */}
        <div className="space-y-4 mb-8">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Candidates Standings</h3>
          {results.map((candidate, idx) => {
            const votePercentage = totalVotes > 0 ? Math.round((candidate.votes / totalVotes) * 100) : 0;
            const isEven = idx % 2 === 0;

            return (
              <div key={candidate.id || idx} className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="font-bold text-white text-base mr-2">{candidate.name}</span>
                    {candidate.party && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-700 text-slate-300 border border-slate-600 font-semibold">
                        {candidate.party}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-black text-indigo-400">{candidate.votes} Votes ({votePercentage}%)</span>
                </div>
                
                {/* Visual Vote Progress Bar */}
                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${isEven ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`} 
                    style={{ width: `${votePercentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Winner & Gap Banner */}
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 p-6 rounded-2xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <h3 className="text-xl font-extrabold text-emerald-400 flex items-center gap-2 mb-1">
            <span>🎉 Leader / Winner:</span>
            <span className="text-white underline">{winner || 'N/A'}</span>
          </h3>
          <p className="text-xs md:text-sm text-slate-300 italic font-medium">
            <span className="font-bold text-emerald-400">Status:</span> {gapMessage}
          </p>
        </div>

        {/* Bulk Winner Email Trigger Button */}
        <button 
          onClick={handleAnnounceAndEmail}
          disabled={isBlasting}
          className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider flex items-center justify-center gap-2"
        >
          {isBlasting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Broadcasting Emails...
            </>
          ) : (
            '📢 Announce Winner & Blast Email to All Voters'
          )}
        </button>

      </div>
    </div>
  );
}