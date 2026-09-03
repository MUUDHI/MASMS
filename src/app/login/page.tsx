'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import logoSrc from '../../../public/logo.png';
import { useAuth } from '@/context/AuthContext';

function LoginContent() {
  const router = useRouter();
  const { user, loading: authLoading, signInWithPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Redirect if user is already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await signInWithPassword(email.trim(), password);

      if (error) {
        setErrorMessage(
          error.message === 'Invalid login credentials'
            ? 'Invalid email or password. Please check your credentials.'
            : error.message
        );
      } else {
        router.replace('/');
      }
    } catch {
      setErrorMessage('Failed to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary-green animate-spin mx-auto" />
          <p className="text-sm font-medium text-gray-600">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-gray-100 via-[#f3f4f6] to-emerald-50/40 relative overflow-hidden">
      {/* Decorative Glass Blur Elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-green/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary-blue/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Login Card */}
      <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-3xl relative z-10 border border-white/80 shadow-2xl backdrop-blur-3xl my-8">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden shadow-lg border-2 border-primary-green/30 mb-4 bg-white/80 p-1">
            <div className="relative w-full h-full rounded-full overflow-hidden">
              <Image src={logoSrc} alt="Murtazim Academy Logo" fill className="object-cover" priority />
            </div>
          </div>
          
          <div className="font-extrabold leading-tight tracking-tight mb-1">
            <span className="text-xl sm:text-2xl text-primary-green">Murtazim </span>
            <span className="text-xl sm:text-2xl text-secondary-blue">Academy</span>
          </div>
          
          <p className="text-xs sm:text-sm text-gray-500 font-medium flex items-center justify-center gap-1.5 mt-1">
            <ShieldCheck className="w-4 h-4 text-primary-green inline" />
            <span>Admin Management Portal</span>
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mb-6 p-3.5 bg-red-50/90 border border-red-200 text-red-700 text-xs sm:text-sm rounded-2xl flex items-start gap-3 shadow-xs animate-shake">
            <AlertCircle className="w-5 h-5 text-status-warning shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="admin@murtazim.edu.so"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-green text-sm text-gray-900 transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-green text-sm text-gray-900 transition-all shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3.5 px-6 rounded-xl text-sm font-bold text-white bg-primary-green hover:bg-primary-green/90 active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-green/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing in to Admin Portal...</span>
              </>
            ) : (
              <>
                <span>Sign In to Admin Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <div className="mt-8 pt-4 border-t border-gray-200/60 text-center">
          <p className="text-[11px] text-gray-500 font-medium">
            Protected Murtazim Academy SMS • Authorized Staff Access Only
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary-green animate-spin mx-auto" />
          <p className="text-sm font-medium text-gray-600">Loading Login Portal...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
