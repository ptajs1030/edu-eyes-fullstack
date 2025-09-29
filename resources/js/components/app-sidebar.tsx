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

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
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
