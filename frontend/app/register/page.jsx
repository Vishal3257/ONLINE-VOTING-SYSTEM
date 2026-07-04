'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../utils/api';

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage(''); setError('');
        try {
            await apiRequest('auth/register/', 'POST', { username, email, password });
            setMessage('🎉 Registration successful! Redirecting to login...');
            setTimeout(() => router.push('/login'), 2000);
        } catch (err) {
            setError(err.message || 'Registration failed.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 px-4">
            <div className="w-full max-w-md p-8 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-purple-500/20">
                <div className="text-center mb-8">
                    <span className="px-3 py-1 text-xs font-semibold uppercase bg-purple-100 text-purple-800 rounded-full">MIMT Portal</span>
                    <h2 className="text-3xl font-extrabold text-gray-900 mt-3">Create Account</h2>
                    <p className="text-sm text-gray-500 mt-1">Register yourself to cast your valuable vote</p>
                </div>
                
                {message && <div className="p-3 mb-4 text-sm bg-green-100 text-green-800 rounded-xl border border-green-200 text-center font-medium animate-pulse">{message}</div>}
                {error && <div className="p-3 mb-4 text-sm bg-red-100 text-red-800 rounded-xl border border-red-200 text-center font-medium">{error}</div>}
                
                <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Username</label>
                        <input type="text" placeholder="e.g., VISHAL" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-800 transition" value={username} onChange={e => setUsername(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Email Address</label>
                        <input type="email" placeholder="student@mimt.com" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-800 transition" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Password</label>
                        <input type="password" placeholder="••••••••" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-800 transition" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition transform hover:-translate-y-0.5">
                        Register as Voter
                    </button>
                </form>
                <p className="text-center text-sm text-gray-600 mt-6">Already registered? <a href="/login" className="text-purple-600 font-bold hover:underline">Log In</a></p>
            </div>
        </div>
    );
}