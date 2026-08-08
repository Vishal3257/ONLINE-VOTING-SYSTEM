'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '../../utils/api';

export default function Login() {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await apiRequest('login/', 'POST', formData);
            if (data.access) {
                localStorage.setItem('token', data.access);
                router.push('/dashboard');
            } else {
                setError('Invalid credentials. Please try again.');
            }
        } catch (err) {
            setError(err.message || 'Login failed. Please check your username and password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
                <div className="text-center mb-8">
                    <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 rounded-full border border-blue-100 inline-block mb-3">
                        MIMT Portal
                    </span>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
                    <p className="text-xs text-slate-500 mt-1">Sign in to access your voting dashboard</p>
                </div>

                {error && (
                    <div className="p-3 mb-6 text-xs bg-rose-50 text-rose-700 rounded-xl border border-rose-200 font-medium text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Username</label>
                        <input
                            type="text"
                            name="username"
                            required
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Enter your username"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Password</label>
                        <input
                            type="password"
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-500/20 transition-all mt-2"
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <p className="text-xs text-center text-slate-500 mt-6">
                    Don't have an account?{' '}
                    <Link href="/register" className="text-blue-600 font-bold hover:underline">
                        Register now
                    </Link>
                </p>
            </div>
        </div>
    );
}