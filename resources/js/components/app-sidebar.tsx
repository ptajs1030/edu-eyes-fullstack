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
        title: 'Pengguna',
        href: '/users',
        icon: UserPen,
    },
    {
        title: 'Students',
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
        title: 'Subjects',
        href: '/subjects',
        icon: BookText,
    },
    {
        title: 'Shiftings',
        href: '/shiftings',
        icon: TimerReset,
    },
    {
        title: 'Announcements',
        href: '/announcements',
        icon: BadgeInfo,
    },
    {
        title: 'General Settings',
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
