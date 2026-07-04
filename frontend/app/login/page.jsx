'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../utils/api';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const data = await apiRequest('auth/login/', 'POST', { username, password });
            localStorage.setItem('accessToken', data.access);
            localStorage.setItem('refreshToken', data.refresh);
            router.push('/dashboard');
        } catch (err) {
            setError('❌ Invalid username or password.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 px-4">
            <div className="w-full max-w-md p-8 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-blue-500/20">
                <div className="text-center mb-8">
                    <span className="px-3 py-1 text-xs font-semibold uppercase bg-blue-100 text-blue-800 rounded-full">Secure Login</span>
                    <h2 className="text-3xl font-extrabold text-gray-900 mt-3">MIMT Voting</h2>
                    <p className="text-sm text-gray-500 mt-1">Sign in to access the secure election panel</p>
                </div>
                
                {error && <div className="p-3 mb-4 text-sm bg-red-100 text-red-800 rounded-xl border border-red-200 text-center font-medium">{error}</div>}
                
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Username</label>
                        <input type="text" placeholder="Enter Username" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-800 transition" value={username} onChange={e => setUsername(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Password</label>
                        <input type="password" placeholder="••••••••" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-800 transition" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition transform hover:-translate-y-0.5">
                        Log In Securely
                    </button>
                </form>
                <p className="text-center text-sm text-gray-600 mt-6">New student? <a href="/register" className="text-blue-600 font-bold hover:underline">Create an account</a></p>
            </div>
        </div>
    );
}