'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function ChangePasswordPage() {
  const supabase = createClient();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      // Update password in Supabase Auth
      const { error: passError } = await supabase.auth.updateUser({ password });
      if (passError) throw new Error(passError.message);

      // Mark must_change_password = false
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .schema('production')
          .from('user_profiles')
          .update({ must_change_password: false })
          .eq('user_id', user.id);
      }

      toast.success('Password updated! Redirecting...');
      setTimeout(() => router.replace('/dashboard'), 1000);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <span className="text-5xl">🍦</span>
          <h1 className="text-2xl font-bold text-gray-900">Set Your Password</h1>
          <p className="text-gray-500 text-sm">Welcome! Please set a secure password before continuing.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-6 space-y-4">
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
            <Lock size={16} className="text-amber-600 shrink-0" />
            <p className="text-amber-800 text-sm">Your account was created with a temporary password. Set a new one to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-text block mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="input-field pr-10"
                  required
                  autoFocus
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 touch-manipulation">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {password.length > 0 && password.length < 8 && (
                <p className="text-xs text-red-500 mt-1">At least 8 characters required</p>
              )}
            </div>

            <div>
              <label className="label-text block mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  className="input-field pr-10"
                  required
                />
                <button type="button" onClick={() => setShowConfirm(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 touch-manipulation">
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirm.length > 0 && password !== confirm && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || password.length < 8 || password !== confirm}
              className="btn-primary mt-2"
            >
              {submitting ? 'Saving...' : 'Set Password & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
