import AppLogoIcon from '@/components/app-logo-icon';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren, useEffect, useState } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    const { schoolLogo, stats } = usePage().props as unknown as { schoolLogo: string; stats?: { siswa: number; guru: number } };
    const [dark, setDark] = useState(false);

    useEffect(() => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setDark(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleDark = () => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle('dark');
        localStorage.theme = next ? 'dark' : 'light';
    };

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="mesh-bg text-slate-900 antialiased transition-colors duration-300 min-h-screen overflow-hidden">
            <div className="flex min-h-screen">
                {/* LEFT SIDE — Branding */}
                <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden items-center justify-center">
                    <div className="absolute inset-0 grid-pattern opacity-60"></div>

                    <div className="orb orb-1"></div>
                    <div className="orb orb-2"></div>
                    <div className="orb orb-3"></div>

                    <div className="decorative-ring w-[500px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-slow opacity-30"></div>
                    <div className="decorative-ring w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-slow opacity-20" style={{ animationDirection: 'reverse', animationDuration: '25s' }}></div>
                    <div className="decorative-ring w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-slow opacity-10" style={{ animationDuration: '30s' }}></div>

                    <div className="absolute top-[15%] left-[15%] w-16 h-16 border-2 border-primary-300/30 dark:border-primary-500/20 rounded-2xl rotate-12 animate-float opacity-40"></div>
                    <div className="absolute bottom-[20%] right-[10%] w-12 h-12 bg-gradient-to-br from-primary-400/20 to-purple-400/20 rounded-xl rotate-45 animate-float-delayed opacity-50"></div>
                    <div className="absolute top-[60%] left-[8%] w-8 h-8 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-lg -rotate-12 animate-float-slow opacity-40"></div>
                    <div className="absolute top-[25%] right-[20%] w-6 h-6 bg-primary-400/20 rounded-full animate-bounce-soft opacity-50"></div>

                    <div className="relative z-10 max-w-md px-8 animate-slide-in-left">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-primary-500/30">
                                {schoolLogo ? (
                                    <img src={schoolLogo} alt="" className="w-8 h-8 object-contain brightness-0 invert" />
                                ) : (
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.84 51.39 51.39 0 00-2.658.813m-15.482 0A50.55 50.55 0 0112 13.489a50.55 50.55 0 0112-3.342" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Sekolah Cemerlang</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Admin Panel v2.0</p>
                            </div>
                        </div>

                        <div className="relative animate-fade-in-up stagger-2">
                            <span className="quote-mark text-primary-400 dark:text-primary-600">"</span>
                            <blockquote className="text-2xl xl:text-3xl font-bold text-slate-800 dark:text-white leading-relaxed pl-6">
                                Pendidikan adalah <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400">kunci masa depan</span>, dan kunci tersebut ada di tangan Anda.
                            </blockquote>
                            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 font-medium pl-6">— Selamat datang kembali</p>
                        </div>

                        <div className="mt-12 flex items-center gap-6 pl-6 animate-fade-in-up stagger-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stats?.siswa || '—'} Siswa Aktif</span>
                            </div>
                            <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stats?.guru || '—'} Guru & Staff</span>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/50 dark:from-slate-900/50 to-transparent pointer-events-none"></div>
                </div>

                {/* RIGHT SIDE — Form */}
                <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 sm:p-8 lg:p-12 relative">
                    <div className="lg:hidden absolute top-0 left-0 right-0 h-48 mesh-bg opacity-50 pointer-events-none">
                        <div className="absolute top-4 left-4 w-20 h-20 bg-primary-400/10 rounded-full blur-2xl"></div>
                        <div className="absolute top-8 right-8 w-24 h-24 bg-indigo-400/10 rounded-full blur-2xl"></div>
                    </div>

                    <button
                        onClick={toggleDark}
                        className="absolute top-6 right-6 w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-amber-500 transition-all z-20"
                        title="Toggle Dark Mode"
                    >
                        <svg className={`w-5 h-5 ${dark ? 'block' : 'hidden'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                        </svg>
                        <svg className={`w-5 h-5 ${dark ? 'hidden' : 'block'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                        </svg>
                    </button>

                    <div className="w-full max-w-sm relative z-10">
                        <div className="lg:hidden flex items-center gap-3 mb-8 animate-fade-in-up">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
                                {schoolLogo ? (
                                    <img src={schoolLogo} alt="" className="w-5 h-5 object-contain brightness-0 invert" />
                                ) : (
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.84 51.39 51.39 0 00-2.658.813m-15.482 0A50.55 50.55 0 0112 13.489a50.55 50.55 0 0112-3.342" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Sekolah Cemerlang</h2>
                                <p className="text-[10px] text-slate-400">Admin Panel v2.0</p>
                            </div>
                        </div>

                        <div className="mb-8 animate-fade-in-up stagger-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 rounded-md bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-[10px] font-bold uppercase tracking-wider">Secure Login</span>
                            </div>
                            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{title || 'Selamat Datang'}</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{description}</p>
                        </div>

                        {children}

                        <div className="mt-10 text-center animate-fade-in-up stagger-6">
                            <div className="mt-6 flex items-center justify-center gap-4">
                                <span className="text-[10px] text-slate-300 dark:text-slate-600">© 2026 Sekolah Cemerlang</span>
                                <span className="text-slate-200 dark:text-slate-700">•</span>
                                <a href="#" className="text-[10px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Kebijakan Privasi</a>
                                <span className="text-slate-200 dark:text-slate-700">•</span>
                                <a href="#" className="text-[10px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Bantuan</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
