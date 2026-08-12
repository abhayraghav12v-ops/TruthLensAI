import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { APP_NAME } from '../constants/navigation';
import { cn } from '../utils';

export function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated, signIn, signUp } = useAuth();
  const [mode, setMode] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const update = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email.trim() || !form.password.trim()) {
      setError('Email and password are required.');
      return;
    }
    if (mode === 'signup' && !form.name.trim()) {
      setError('Full name is required.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUp(form);
      } else {
        await signIn(form);
      }
      navigate('/app/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-secondary-500/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-secondary-500 shadow-glow">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">{APP_NAME}</span>
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</CardTitle>
            <CardDescription>
              {mode === 'signin'
                ? 'Sign in to access your forensic dashboard'
                : 'Get started with 500 free scans'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800/60">
              {['signin', 'signup'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setError(''); }}
                  className={cn(
                    'flex-1 rounded-lg py-2 text-sm font-medium transition-all',
                    mode === m
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
                  )}
                >
                  {m === 'signin' ? 'Sign in' : 'Sign up'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="Jane Doe"
                value={form.name}
                onChange={update('name')}
                autoComplete="name"
              />
              <Input
                label="Email"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={update('email')}
                autoComplete="email"
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={update('password')}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
              />

              {error && (
                <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                rightIcon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              >
                {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              <Link to="/" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
                ← Back to home
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
