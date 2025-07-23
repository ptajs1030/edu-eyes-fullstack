import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BadgeInfo, BookText, GraduationCap, LayoutGrid, School, Settings2, TimerReset, UserCog, UserPen, UserSearch } from 'lucide-react';
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
<<<<<<< HEAD
=======
        title: 'Hak Akses',
        href: '/roles',
        icon: UserCog,
    },
    {
>>>>>>> 6354894504f68f4a9f063d6e1b7b4b2d7fcf11af
        title: 'Pengguna',
        href: '/users',
        icon: UserPen,
    },
    {
<<<<<<< HEAD
=======
        title: 'Pengumuman',
        href: '/announcements',
        icon: BadgeInfo,
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
>>>>>>> 6354894504f68f4a9f063d6e1b7b4b2d7fcf11af
        title: 'Siswa',
        href: '/students',
        icon: UserSearch,
    },
    {
<<<<<<< HEAD
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
=======
>>>>>>> 6354894504f68f4a9f063d6e1b7b4b2d7fcf11af
        title: 'Mata Pelajaran',
        href: '/subjects',
        icon: BookText,
    },
    {
        title: 'Shiftings',
        href: '/shiftings',
        icon: TimerReset,
    },
    {
<<<<<<< HEAD
        title: 'Pengumuman',
        href: '/announcements',
        icon: BadgeInfo,
    },
    {
=======
>>>>>>> 6354894504f68f4a9f063d6e1b7b4b2d7fcf11af
        title: 'Pengaturan',
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
