import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

interface NavGroup {
    label: string;
    items: NavItem[];
}

export function NavMain({ groups }: { groups: NavGroup[] }) {
    const page = usePage();
    return (
        <>
            {groups.map((group) => (
                <SidebarGroup key={group.label} className="px-2 py-0">
                    <SidebarGroupLabel className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 h-auto leading-normal">
                        {group.label}
                    </SidebarGroupLabel>
                    <SidebarMenu className="space-y-0.5">
                        {group.items.map((item) => {
                            const isActive = item.href === page.url;
                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive}
                                        tooltip={{ children: item.title }}
                                        className={`group text-sm rounded-xl px-3 py-2.5 transition-all h-auto ${
                                            isActive
                                                ? 'bg-gradient-to-r from-primary/10 to-blue-50 dark:from-primary/20 dark:to-blue-900/20 text-primary dark:text-primary-400 font-semibold border border-primary/10 dark:border-primary/30 shadow-sm shadow-primary/10'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                        }`}
                                    >
                                        <Link href={item.href} prefetch className="flex items-center gap-3 w-full">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                                isActive
                                                    ? 'bg-white dark:bg-slate-800 shadow-sm'
                                                    : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:shadow-md'
                                            }`}>
                                                {item.icon && <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-primary' : ''}`} />}
                                            </div>
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </>
    );
}
