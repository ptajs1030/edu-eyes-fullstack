import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BadgeInfo, BookText, GraduationCap, LayoutGrid, School, Settings2, TimerReset, TrendingUpDown, UserPen, UserSearch, PencilRuler, LandPlot, CalendarOff, CreditCard, BookOpen } from 'lucide-react';
import AppLogo from './app-logo';

const navGroups = [
    {
        label: 'Menu Utama',
        items: [
            {
                title: 'Dashboard',
                href: '/dashboard',
                icon: LayoutGrid,
            },
        ],
    },
    {
        label: 'Data Pengguna',
        items: [
            {
                title: 'Data Siswa',
                href: '/students',
                icon: UserSearch,
            },
            {
                title: 'Data Guru',
                href: '/teachers',
                icon: UserPen,
            },
            {
                title: 'Data Orang Tua',
                href: '/parents',
                icon: UserPen,
            },
            {
                title: 'Data Admin',
                href: '/admins',
                icon: UserPen,
            },
        ],
    },
    {
        label: 'Akademik',
        items: [
            {
                title: 'Tahun Ajaran',
                href: '/academic-years',
                icon: GraduationCap,
            },
            {
                title: 'Kelas',
                href: '/classrooms',
                icon: School,
            },
            {
                title: 'Mata Pelajaran',
                href: '/subjects',
                icon: BookText,
            },
        ],
    },
    {
        label: 'Operasional',
        items: [
            {
                title: 'Shifting / Jam',
                href: '/shiftings',
                icon: TimerReset,
            },
            {
                title: 'Pembayaran',
                href: '/payments',
                icon: CreditCard,
            },
            {
                title: 'Pengumuman',
                href: '/announcements',
                icon: BadgeInfo,
            },
            {
                title: 'Event',
                href: '/events',
                icon: LandPlot,
            },
            {
                title: 'Tugas',
                href: '/tasks',
                icon: BookOpen,
            },
            {
                title: 'Ujian',
                href: '/exams',
                icon: PencilRuler,
            },
            {
                title: 'Hari Libur',
                href: '/custom-day-offs',
                icon: CalendarOff,
            },
            {
                title: 'Kenaikan Kelas',
                href: '/grade-promotions',
                icon: TrendingUpDown,
            },
            {
                title: 'Pengaturan Sekolah',
                href: '/school-settings',
                icon: Settings2,
            },
        ],
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { state } = useSidebar();

    return (
        <Sidebar collapsible="icon" variant="sidebar" className="border-r border-border">
            <SidebarHeader className="h-16 px-6 border-b border-slate-100">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="p-0 hover:bg-transparent">
                            <Link href="/dashboard" prefetch>
                                <AppLogo small={state === 'collapsed'} />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="py-5 px-3">
                <NavMain groups={navGroups} />
            </SidebarContent>

            <SidebarFooter className="p-3 border-t border-slate-100">
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
