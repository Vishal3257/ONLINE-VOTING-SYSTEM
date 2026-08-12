'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '../../utils/api';

export default function Register() {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirm_password: ''
    });
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Standard Registration (No OTP)
    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (formData.password !== formData.confirm_password) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            // New Backend Endpoint Call: auth/register/
            await apiRequest('auth/register/', 'POST', {
                username: formData.username,
                password: formData.password,
                confirm_password: formData.confirm_password
            });

            setMessage('Account created successfully! Redirecting to login...');
            
            setTimeout(() => {
                router.push('/login');
            }, 1500);

        } catch (err) {
            setError(err.message || 'Registration failed. Username may already exist.');
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
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Account</h1>
                    <p className="text-xs text-slate-500 mt-1">Register as a student voter</p>
                </div>

                {error && (
                    <div className="p-3 mb-6 text-xs bg-rose-50 text-rose-700 rounded-xl border border-rose-200 font-medium text-center">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="p-3 mb-6 text-xs bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 font-medium text-center">
                        {message}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            name="username"
                            required
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Choose a username"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                            Password
                        </label>
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

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            name="confirm_password"
                            required
                            value={formData.confirm_password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-500/20 transition-all mt-2 disabled:opacity-50"
                    >
                        {loading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>

                <p className="text-xs text-center text-slate-500 mt-6">
                    Already have an account?{' '}
                    <Link href="/login" className="text-blue-600 font-bold hover:underline">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}