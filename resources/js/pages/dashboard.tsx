import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type User } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import React from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

interface StatsData {
    siswa: number;
    guru: number;
    admin: number;
    orangTua: number;
    kelas: number;
    mataPelajaran: number;
    tahunAkademik: string;
}

const chartDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const chartData = [
    { hadir: 85, absen: 15 },
    { hadir: 92, absen: 8 },
    { hadir: 78, absen: 22 },
    { hadir: 95, absen: 5 },
    { hadir: 88, absen: 12 },
    { hadir: 70, absen: 30 },
    { hadir: 82, absen: 18 },
];

const recentActivities = [
    {
        icon: 'user',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-600 dark:text-blue-400',
        title: 'Admin baru ditambahkan',
        desc: 'Ahmad Hidayat bergabung sebagai Operator',
        time: '2 jam yang lalu',
    },
    {
        icon: 'check',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        title: 'Absensi tervalidasi',
        desc: '1.180 dari 1.248 siswa hadir hari ini',
        time: '5 jam yang lalu',
    },
    {
        icon: 'alert',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        iconColor: 'text-amber-600 dark:text-amber-400',
        title: 'Pengumuman penting',
        desc: 'Jadwal Ujian Semester Genap dirilis',
        time: 'Kemarin',
    },
    {
        icon: 'payment',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        iconColor: 'text-purple-600 dark:text-purple-400',
        title: 'Pembayaran masuk',
        desc: 'Rp 45.2jt dari SPP bulan Juli',
        time: '2 hari yang lalu',
    },
];

const todaySchedule = [
    { time: '08:00', event: 'Upacara Bendera', location: 'Lapangan Utama', color: 'bg-blue-500' },
    { time: '10:00', event: 'Rapat Guru', location: 'Ruang Rapat', color: 'bg-emerald-500' },
    { time: '13:00', event: 'Ujian Matematika', location: 'Kelas X & XI', color: 'bg-amber-500' },
];

const announcements = [
    {
        category: 'Akademik',
        categoryColor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
        iconGrad: 'from-blue-500 to-indigo-600',
        title: 'Jadwal Ujian Semester Genap 2025/2026',
        desc: 'Ujian akan dilaksanakan mulai tanggal 5 Agustus 2026. Harap persiapkan diri dan cek jadwal masing-masing.',
        time: '2 hari lalu',
    },
    {
        category: 'Keuangan',
        categoryColor: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
        iconGrad: 'from-emerald-500 to-teal-600',
        title: 'Pembayaran SPP Bulan Juli Dibuka',
        desc: 'Batas pembayaran SPP bulan Juli hingga tanggal 31 Juli 2026. Silakan lakukan pembayaran melalui portal.',
        time: '5 hari lalu',
    },
];

const now = new Date();
const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

export default function Dashboard() {
    const { auth } = usePage().props as unknown as { auth: { user: User } };
    const user = auth?.user;
    const [stats, setStats] = React.useState<StatsData | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        fetch('/api/school-stats')
            .then((res) => res.json())
            .then((data) => {
                setStats(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const SvgIcon = ({ name, className = 'w-5 h-5' }: { name: string; className?: string }) => {
        const paths: Record<string, string> = {
            students: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
            teachers: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
            classes: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z',
            subjects: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
            user: 'M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766z',
            check: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            alert: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z',
            payment: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z',
        };
        return (
            <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={paths[name] || paths.students} />
            </svg>
        );
    };

    const ActivityIcon = ({ name, className }: { name: string; className?: string }) => {
        const icons: Record<string, string> = {
            user: 'M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766z',
            check: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            alert: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z',
            payment: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z',
        };
        return (
            <svg className={className || 'w-4 h-4'} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={icons[name] || icons.user} />
            </svg>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scroll">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8">

                    {/* Welcome Hero Banner */}
                    <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 hero-pattern rounded-3xl p-6 lg:p-8 mb-8 text-white relative overflow-hidden animate-fade-in-up shadow-xl shadow-blue-500/20">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3 blur-2xl"></div>
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <p className="text-white/70 text-sm font-medium mb-1">Selamat Datang Kembali 👋</p>
                                <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
                                    {user?.full_name || 'User'}
                                </h1>
                                <p className="text-white/60 text-sm mt-1">
                                    {stats ? `Semester ${stats.tahunAkademik}` : 'Memuat...'}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/10">
                                <div className="text-right">
                                    <p className="text-xs text-white/60 font-medium">Hari Ini</p>
                                    <p className="text-lg font-bold">{dateStr}</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Row */}
                    {loading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm animate-pulse">
                                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
                                    <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : stats ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {[
                                { label: 'Total Siswa', value: stats.siswa, icon: 'students', grad: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/25' },
                                { label: 'Total Guru', value: stats.guru, icon: 'teachers', grad: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/25' },
                                { label: 'Total Kelas', value: stats.kelas, icon: 'classes', grad: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/25' },
                                { label: 'Mata Pelajaran', value: stats.mataPelajaran, icon: 'subjects', grad: 'from-orange-500 to-amber-600', shadow: 'shadow-orange-500/25' },
                            ].map((item, idx) => (
                                <div key={item.label} className={`stat-card bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/40 shadow-sm animate-fade-in-up stagger-${idx + 2}`}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
                                            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{item.value}</p>
                                        </div>
                                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.grad} flex items-center justify-center shadow-lg ${item.shadow}`}>
                                            <SvgIcon name={item.icon} className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-red-500 text-sm mb-8">Gagal memuat data statistik.</div>
                    )}

                    {/* Chart + Activity Timeline */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Bar Chart */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 shadow-sm p-6 animate-fade-in-up stagger-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Statistik Kehadiran Siswa</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">7 hari terakhir — Semua Kelas</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                                        Hadir
                                    </span>
                                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                                        Absen
                                    </span>
                                </div>
                            </div>
                            <div className="h-48 flex items-end justify-between gap-3 px-2">
                                {chartData.map((day, idx) => (
                                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                                        <div className="w-full flex items-end justify-center gap-1 h-36">
                                            <div className="chart-bar w-full bg-blue-500 rounded-t-lg" style={{ height: `${day.hadir}%` }}></div>
                                            <div className="chart-bar w-full bg-rose-400 rounded-t-lg" style={{ height: `${day.absen}%` }}></div>
                                        </div>
                                        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{chartDays[idx]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Activity Timeline */}
                        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 shadow-sm p-6 animate-fade-in-up stagger-7">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">Aktivitas Terbaru</h3>
                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Lihat Semua</span>
                            </div>
                            <div className="space-y-0 relative">
                                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>
                                {recentActivities.map((act, idx) => (
                                    <div key={idx} className={`flex gap-4 ${idx < recentActivities.length - 1 ? 'pb-5' : ''} relative`}>
                                        <div className={`w-10 h-10 rounded-full ${act.bgColor} flex items-center justify-center flex-shrink-0 z-10 border-2 border-white dark:border-slate-800`}>
                                            <ActivityIcon name={act.icon} className={`w-4 h-4 ${act.iconColor}`} />
                                        </div>
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{act.title}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{act.desc}</p>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{act.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 shadow-sm p-6 animate-fade-in-up stagger-8 mb-8">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5">Quick Actions</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {[
                                { label: 'Event', href: '/events/create', icon: 'event', grad: 'from-blue-500 to-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', color: 'text-blue-600 dark:text-blue-400', hoverColor: 'hover:border-blue-300 dark:hover:border-blue-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20' },
                                { label: 'Ujian', href: '/exams/create', icon: 'exam', grad: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', color: 'text-emerald-600 dark:text-emerald-400', hoverColor: 'hover:border-emerald-300 dark:hover:border-emerald-700/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' },
                                { label: 'Tugas', href: '/tasks/create', icon: 'task', grad: 'from-violet-500 to-violet-600', bg: 'bg-violet-100 dark:bg-violet-900/30', color: 'text-violet-600 dark:text-violet-400', hoverColor: 'hover:border-violet-300 dark:hover:border-violet-700/50 hover:bg-violet-50 dark:hover:bg-violet-900/20' },
                                { label: 'Tagihan', href: '/payments/create', icon: 'bill', grad: 'from-amber-500 to-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400', hoverColor: 'hover:border-amber-300 dark:hover:border-amber-700/50 hover:bg-amber-50 dark:hover:bg-amber-900/20' },
                                { label: 'Pengumuman', href: '/announcements/create', icon: 'announce', grad: 'from-rose-500 to-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30', color: 'text-rose-600 dark:text-rose-400', hoverColor: 'hover:border-rose-300 dark:hover:border-rose-700/50 hover:bg-rose-50 dark:hover:bg-rose-900/20' },
                                { label: 'Siswa Baru', href: '/students/create', icon: 'newstudent', grad: 'from-sky-500 to-sky-600', bg: 'bg-sky-100 dark:bg-sky-900/30', color: 'text-sky-600 dark:text-sky-400', hoverColor: 'hover:border-sky-300 dark:hover:border-sky-700/50 hover:bg-sky-50 dark:hover:bg-sky-900/20' },
                            ].map((action) => (
                                <Link
                                    key={action.label}
                                    href={action.href}
                                    className={`action-btn group flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-600/30 ${action.hoverColor} transition-all text-center`}
                                >
                                    <div className={`w-11 h-11 rounded-xl ${action.bg} flex items-center justify-center group-hover:bg-gradient-to-br group-hover:${action.grad} group-hover:shadow-lg transition-all`}>
                                        <SvgIcon name={action.icon === 'event' ? 'students' : action.icon === 'exam' ? 'classes' : action.icon === 'task' ? 'subjects' : action.icon === 'bill' ? 'payment' : action.icon === 'announce' ? 'alert' : 'user'} className={`w-5 h-5 ${action.color} group-hover:text-white transition-colors`} />
                                    </div>
                                    <span className={`text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:${action.color} transition-colors`}>{action.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Bottom Row: Schedule + Announcements */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Schedule */}
                        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 shadow-sm p-6 animate-fade-in-up">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">Jadwal Hari Ini</h3>
                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-lg">{dateStr}</span>
                            </div>
                            <div className="space-y-3">
                                {todaySchedule.map((item, idx) => (
                                    <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl ${
                                        idx === 0 ? 'bg-blue-50 dark:bg-blue-900/15 border border-blue-100/50 dark:border-blue-800/20' :
                                        idx === 1 ? 'bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-100/50 dark:border-emerald-800/20' :
                                        'bg-amber-50 dark:bg-amber-900/15 border border-amber-100/50 dark:border-amber-800/20'
                                    }`}>
                                        <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                                            {item.time}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{item.event}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{item.location}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Announcements */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 shadow-sm p-6 animate-fade-in-up">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">Pengumuman Terbaru</h3>
                                <Link href={route('announcements.index')} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                                    Lihat Semua
                                </Link>
                            </div>
                            <div className="space-y-3">
                                {announcements.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-600/20 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all cursor-pointer group">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.iconGrad} flex items-center justify-center text-white flex-shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded-md ${item.categoryColor} text-[10px] font-bold uppercase`}>{item.category}</span>
                                                <span className="text-[11px] text-slate-400">{item.time}</span>
                                            </div>
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.title}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}
