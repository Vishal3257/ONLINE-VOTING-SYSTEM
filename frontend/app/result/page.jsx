'use client'; // Next.js requirement for using hooks like useState and useEffect

import React, { useEffect, useState } from 'react';

export default function ResultDashboard() {
  const [results, setResults] = useState([]);
  const [winner, setWinner] = useState('');
  const [gapMessage, setGapMessage] = useState('');
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch live results from Django backend
  const fetchResults = async () => {
    try {
      const response = await fetch('https://online-voting-system-x4i2.onrender.com/api/results/');
      const data = await response.json();
      if (response.ok) {
        setResults(data.results);
        setWinner(data.winner);
        setGapMessage(data.gap_message);
        setTotalVotes(data.total_votes_polled);
      }
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  // Trigger Bulk Email Blast to all voters from admin side
  const handleAnnounceAndEmail = async () => {
    if (!window.confirm("Are you sure you want to announce results and send email to all voters?")) return;
    
    try {
      const response = await fetch('https://online-voting-system-x4i2.onrender.com/api/results/', {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || "Email blast started successfully!");
      } else {
        alert(data.error || "Failed to trigger email blast.");
      }
    } catch (error) {
      console.error("Error in email blast:", error);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '18px' }}>Loading Live Election Results...</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', color: '#333' }}>📊 Live Election Dashboard</h2>
      <hr style={{ border: '0', height: '1px', background: '#eee', margin: '20px 0' }} />
      
      {/* Total Votes Count */}
      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', border: '1px solid #e9ecef' }}>
        <h3 style={{ margin: 0, color: '#495057' }}>Total Votes Polled: <span style={{ color: '#0070f3', fontWeight: 'bold' }}>{totalVotes}</span></h3>
      </div>

      {/* Candidate Votes Standings */}
      <h3 style={{ color: '#495057', marginBottom: '10px' }}>Candidates Standings</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {results.map((candidate) => (
          <li key={candidate.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px', borderBottom: '1px solid #efefef', background: '#fff', marginBottom: '8px', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <strong style={{ color: '#212529' }}>{candidate.name} {candidate.party && `(${candidate.party})`}</strong>
            <span style={{ fontWeight: 'bold', color: '#0070f3' }}>{candidate.votes} Votes</span>
          </li>
        ))}
      </ul>

      {/* Winner Display & Live Margin/Gap Message */}
      <div style={{ background: '#e6f7ff', borderLeft: '5px solid #1890ff', padding: '15px', borderRadius: '6px', marginTop: '25px' }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#0050b3' }}>🎉 Current Winner: {winner}</h3>
        <p style={{ margin: 0, fontStyle: 'italic', color: '#262626', fontSize: '14px' }}><strong>Status:</strong> {gapMessage}</p>
      </div>

      {/* Trigger Bulk Winner Email Action */}
      <button 
        onClick={handleAnnounceAndEmail}
        style={{ width: '100%', marginTop: '30px', padding: '14px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', transition: 'background 0.2s' }}
        onMouseOver={(e) => e.target.style.background = '#218838'}
        onMouseOut={(e) => e.target.style.background = '#28a745'}
      >
        📢 Announce Winner & Blast Email to All Voters
      </button>
    </div>
  );
}