'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '../../utils/api';

export default function Register() {
    const [step, setStep] = useState(1); // Step 1: Send OTP, Step 2: Verify & Register
    const [formData, setFormData] = useState({
        email: '',
        otp: '',
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // STEP 1: Send OTP to Gmail
    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!formData.email) {
            setError('Please enter a valid email address.');
            return;
        }

        setLoading(true);

        try {
            // URL path formatted properly for backend routes
            await apiRequest('/auth/send-otp/', 'POST', { email: formData.email });
            setMessage('OTP sent to your email successfully!');
            setStep(2); // Move to OTP & Register form
        } catch (err) {
            setError(err.message || 'Failed to send OTP. Check your email or backend connection.');
        } finally {
            setLoading(false);
        }
    };

    // STEP 2: Verify OTP & Complete Registration
    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            // URL path formatted properly for backend routes
            await apiRequest('/auth/register/', 'POST', {
                email: formData.email,
                otp: formData.otp,
                username: formData.username,
                password: formData.password,
            });

            setMessage('Account created successfully! Redirecting...');
            setTimeout(() => {
                router.push('/login');
            }, 1500);
        } catch (err) {
            setError(err.message || 'Registration failed. Check your OTP or Username.');
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

                {/* STEP 1: Email for OTP */}
                {step === 1 && (
                    <form onSubmit={handleSendOTP} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                                Email Address (Gmail)
                            </label>
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="student@gmail.com"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-500/20 transition-all mt-2 disabled:opacity-50"
                        >
                            {loading ? 'Sending OTP...' : 'Send OTP'}
                        </button>
                    </form>
                )}

                {/* STEP 2: OTP, Username & Password */}
                {step === 2 && (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                disabled
                                value={formData.email}
                                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                                6-Digit OTP
                            </label>
                            <input
                                type="text"
                                name="otp"
                                required
                                maxLength="6"
                                value={formData.otp}
                                onChange={handleChange}
                                placeholder="Enter OTP"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition-all text-center tracking-widest font-bold"
                            />
                        </div>

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
                                name="confirmPassword"
                                required
                                value={formData.confirmPassword}
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

                        <button
                            type="button"
                            onClick={() => { setStep(1); setError(''); setMessage(''); }}
                            className="w-full text-xs text-slate-500 hover:underline text-center block mt-2"
                        >
                            Change Email
                        </button>
                    </form>
                )}

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