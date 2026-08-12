import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ScanLine, ShieldCheck, AlertTriangle, Gauge, Activity, FileText,
  TrendingUp, ArrowRight, Upload, LogIn,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Breadcrumb } from '../components/ui';
import { StatCard } from '../components/dashboard/StatCard';
import { VerificationCard } from '../components/dashboard/VerificationCard';
import { slideUp, staggerContainer } from '../animations';
import { SCAN_TREND } from '../constants/mockData';
import { mockApi } from '../services/api';
import { formatRelativeTime, formatNumber } from '../utils';
import { useAuth } from '../context/AuthContext';

const activityIcons = {
  scan: ScanLine,
  upload: Upload,
  alert: AlertTriangle,
  report: FileText,
  login: LogIn,
};

const activityTones = {
  scan: 'text-primary-500 bg-primary-50 dark:bg-primary-950/40',
  upload: 'text-secondary-500 bg-secondary-50 dark:bg-secondary-950/40',
  alert: 'text-danger-500 bg-danger-50 dark:bg-danger-950/40',
  report: 'text-success-500 bg-success-50 dark:bg-success-950/40',
  login: 'text-slate-400 bg-slate-100 dark:bg-slate-800',
};

const EMPTY_STATS = {
  totalScans: 0,
  authenticRate: 0,
  aiDetectedRate: 0,
  manipulatedRate: 0,
  avgConfidence: 0,
  activeThreats: 0,
  responseTime: 0,
  teamMembers: 1,
};

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(EMPTY_STATS);
  const [verifications, setVerifications] = useState([]);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, v, a] = await Promise.all([
          mockApi.getDashboardStats(),
          mockApi.getVerifications(),
          mockApi.getActivity(),
        ]);
        if (!cancelled) {
          setStats(s);
          setVerifications(v);
          setActivity(a);
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const mediaDistribution = useMemo(() => {
    const counts = { image: 0, video: 0, audio: 0 };
    verifications.forEach((v) => {
      if (counts[v.mediaType] !== undefined) counts[v.mediaType] += 1;
    });
    return [
      { name: 'Images', value: counts.image, color: '#4F46E5' },
      { name: 'Videos', value: counts.video, color: '#06B6D4' },
      { name: 'Audio', value: counts.audio, color: '#10B981' },
    ];
  }, [verifications]);

  const verdictDistribution = useMemo(() => {
    const counts = {
      authentic: 0,
      suspicious: 0,
      likelyManipulated: 0,
      manipulated: 0,
    };
    verifications.forEach((v) => {
      if (counts[v.verdict] !== undefined) counts[v.verdict] += 1;
    });
    return [
      { name: 'Authentic', value: counts.authentic, color: '#10B981' },
      { name: 'Suspicious', value: counts.suspicious, color: '#F59E0B' },
      { name: 'Likely Manipulated', value: counts.likelyManipulated, color: '#06B6D4' },
      { name: 'AI-Generated', value: counts.manipulated, color: '#EF4444' },
    ];
  }, [verifications]);

  const totalForPct = stats.totalScans || 1;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Breadcrumb items={[{ label: 'Dashboard' }]} />
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Here's your forensic overview for this week.</p>
        </div>
        <Link to="/app/verify">
          <Button leftIcon={<ScanLine className="h-4 w-4" />}>New Verification</Button>
        </Link>
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={slideUp}>
          <StatCard label="Total Scans" value={stats.totalScans} icon={ScanLine} trend={12} tone="primary" />
        </motion.div>
        <motion.div variants={slideUp}>
          <StatCard label="AI Detected" value={stats.aiDetectedRate} suffix="%" icon={AlertTriangle} trend={8} tone="danger" decimals={1} />
        </motion.div>
        <motion.div variants={slideUp}>
          <StatCard label="Authentic Rate" value={stats.authenticRate} suffix="%" icon={ShieldCheck} trend={-3} tone="success" decimals={1} />
        </motion.div>
        <motion.div variants={slideUp}>
          <StatCard label="Avg Confidence" value={stats.avgConfidence} suffix="%" icon={Gauge} trend={2} tone="secondary" decimals={1} />
        </motion.div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div variants={slideUp} initial="hidden" animate="show" className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Scan Activity</CardTitle>
                <CardDescription>Daily verification volume and AI detections</CardDescription>
              </div>
              <Badge tone="primary" variant="soft"><TrendingUp className="h-3 w-3" /> Live</Badge>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={SCAN_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="detectGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255,255,255,0.95)',
                      border: '1px solid rgba(148,163,184,0.2)',
                      borderRadius: '12px',
                      fontSize: '13px',
                      boxShadow: '0 8px 30px -8px rgba(15,23,42,0.12)',
                    }}
                  />
                  <Area type="monotone" dataKey="scans" stroke="#4F46E5" strokeWidth={2} fill="url(#scanGrad)" name="Total Scans" />
                  <Area type="monotone" dataKey="detected" stroke="#EF4444" strokeWidth={2} fill="url(#detectGrad)" name="AI Detected" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={slideUp} initial="hidden" animate="show">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Media Types</CardTitle>
              <CardDescription>Distribution by format</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={mediaDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                    {mediaDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255,255,255,0.95)',
                      border: '1px solid rgba(148,163,184,0.2)',
                      borderRadius: '12px',
                      fontSize: '13px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {mediaDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ background: item.color }} />
                      <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                    </div>
                    <span className="font-medium">{formatNumber(item.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div variants={slideUp} initial="hidden" animate="show" className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Verdict Breakdown</CardTitle>
              <CardDescription>Classification across all scans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {verdictDistribution.map((item) => (
                  <div key={item.name} className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                      <span className="text-xs text-slate-500 dark:text-slate-400">{item.name}</span>
                    </div>
                    <p className="mt-2 font-display text-2xl font-bold">{formatNumber(item.value)}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {((item.value / totalForPct) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={verdictDistribution} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                    contentStyle={{
                      background: 'rgba(255,255,255,0.95)',
                      border: '1px solid rgba(148,163,184,0.2)',
                      borderRadius: '12px',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {verdictDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={slideUp} initial="hidden" animate="show">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest events</CardDescription>
              </div>
              <Activity className="h-5 w-5 text-slate-400" />
            </CardHeader>
            <CardContent className="space-y-1">
              {activity.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 p-2">No activity yet — run a verification to get started.</p>
              )}
              {activity.slice(0, 8).map((item) => {
                const Icon = activityIcons[item.icon] || ScanLine;
                return (
                  <div key={item.id} className="flex items-start gap-3 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${activityTones[item.icon] || activityTones.scan}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.action}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{item.detail}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{formatRelativeTime(item.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold">Recent Verifications</h2>
          <Link to="/app/history">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>View all</Button>
          </Link>
        </div>
        {verifications.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No verifications yet. Upload media to see results here.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {verifications.slice(0, 4).map((record) => (
              <VerificationCard key={record.id} record={record} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
