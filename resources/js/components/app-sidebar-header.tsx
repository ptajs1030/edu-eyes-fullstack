import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Bell, Settings, Menu, Sun, Moon } from 'lucide-react';
import { useState } from 'react';

export function AppSidebarHeader() {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const getInitials = useInitials();

    const [dark, setDark] = useState(() => {
        if (typeof document === 'undefined') return false;
        return document.documentElement.classList.contains('dark');
    });

    const toggleDark = () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.theme = isDark ? 'dark' : 'light';
        setDark(isDark);
    };

    return (
        <header className="h-16 glass flex items-center justify-between px-4 lg:px-8 flex-shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-3">
                <button onClick={() => {
                    const trigger = document.querySelector('[data-sidebar-trigger]') as HTMLButtonElement;
                    trigger?.click();
                }} className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                    <Menu className="w-5 h-5" />
                </button>
                <SidebarTrigger className="hidden lg:flex w-9 h-9 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" />
                <Breadcrumbs breadcrumbs={(page.props.breadcrumbs ?? []) as BreadcrumbItem[]} />
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={toggleDark}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-800 transition-all"
                    title="Toggle Dark Mode"
                >
                    <Moon className="w-[18px] h-[18px] hidden dark:block" />
                    <Sun className="w-[18px] h-[18px] block dark:hidden" />
                </button>
                <button className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all relative">
                    <Bell className="w-[18px] h-[18px]" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900"></span>
                </button>
                <button className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                    <Settings className="w-[18px] h-[18px]" />
                </button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-9 w-9 rounded-lg p-1">
                            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                                <AvatarImage src={auth.user.avatar} alt={auth.user.full_name} />
                                <AvatarFallback className="rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold shadow-md">
                                    {getInitials(auth.user.full_name)}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
