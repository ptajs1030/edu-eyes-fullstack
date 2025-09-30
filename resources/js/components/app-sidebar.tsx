import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BadgeInfo, BookText, GraduationCap, LayoutGrid, School, Settings2, TimerReset, TrendingUpDown, UserPen, UserSearch, PencilRuler, LandPlot, CalendarOff, CreditCard, BookOpen } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    //TODO hide temporarily
    // {
    //     title: 'Roles',
    //     href: '/roles',
    //     icon: UserCog,
    // },
    {
        title: 'Admin',
        href: '/admins',
        icon: UserPen,
    },
    {
        title: 'Guru',
        href: '/teachers',
        icon: UserPen,
    },
    {
        title: 'Orang Tua/Wali',
        href: '/parents',
        icon: UserPen,
    },
    {
        title: 'Siswa',
        href: '/students',
        icon: UserSearch,
    },
    {
        title: 'Tahun Akademik',
        href: '/academic-years',
        icon: GraduationCap,
    },
    {
        title: 'Kelas',
        href: '/classrooms',
        icon: School,
    },
    {
        title: 'Kenaikan Kelas',
        href: '/grade-promotions',
        icon: TrendingUpDown,
    },
    {
        title: 'Mata Pelajaran',
        href: '/subjects',
        icon: BookText,
    },
    {
        title: 'Kegiatan',
        href: '/events',
        icon: LandPlot,
    },
    {
        title: 'Ujian',
        href: '/exams',
        icon: PencilRuler,
    },
    {
        title: 'Tugas',
        href: '/tasks',
        icon: BookOpen,
    },
    {
        title: 'Shiftings',
        href: '/shiftings',
        icon: TimerReset,
    },
    {
        title: 'Hari Libur',
        href: '/custom-day-offs',
        icon: CalendarOff,
    },
    {
        title: 'Tagihan',
        href: '/payments',
        icon: CreditCard,
    },
    {
        title: 'Pengumuman',
        href: '/announcements',
        icon: BadgeInfo,
    },
    {
        title: 'Pengaturan Sekolah',
        href: '/school-settings',
        icon: Settings2,
    },
];

const footerNavItems: NavItem[] = [];

import { useState, useEffect } from 'react';

export function AppSidebar() {
    // Assume Sidebar provides a class or attribute when collapsed, or you can use a state/prop if available
    // Here, we use a workaround with a CSS class on body or sidebar element
    // If your Sidebar component provides a collapsed state/prop/context, use that instead
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        // Example: check for a class on body or sidebar element
        // Replace this logic with your actual sidebar collapse detection
        const observer = new MutationObserver(() => {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar && sidebar.classList.contains('collapsed')) {
                setIsCollapsed(true);
            } else {
                setIsCollapsed(false);
            }
        });
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
        }
        return () => observer.disconnect();
    }, []);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                {!isCollapsed && <AppLogo />}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
