import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Bell, Settings, Menu } from 'lucide-react';
import AppLogoIcon from './app-logo-icon';

interface AppHeaderProps {
    breadcrumbs?: BreadcrumbItem[];
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
    const page = usePage<SharedData>();
    const { schoolLogo } = usePage().props as unknown as { schoolLogo: string };
    const { auth } = page.props;

    const getInitials = useInitials();

    return (
        <>
            <header className="h-16 bg-white/80 backdrop-blur border-b border-border flex items-center justify-between px-8 flex-shrink-0 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    {/* Mobile Menu */}
                    <div className="lg:hidden mr-2">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="bg-sidebar flex h-full w-64 flex-col items-stretch justify-between">
                                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                                <SheetHeader className="flex justify-start text-left">
                                    <AppLogoIcon logoUrl={schoolLogo} className="h-6 w-6 fill-current text-black dark:text-white" />
                                </SheetHeader>
                                <div className="flex h-full flex-1 flex-col space-y-4 p-4">
                                    <div className="flex h-full flex-col justify-between text-sm">
                                        <Link href="/dashboard" prefetch className="flex items-center space-x-2 font-medium">
                                            <span>Dashboard</span>
                                        </Link>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {breadcrumbs.map((item, index) => {
                            const isLast = index === breadcrumbs.length - 1;
                            return (
                                <span key={index} className="flex items-center gap-2">
                                    {index > 0 && (
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                        </svg>
                                    )}
                                    {isLast ? (
                                        <span className="text-foreground font-medium">{item.title}</span>
                                    ) : (
                                        <Link href={item.href} className="hover:text-foreground cursor-pointer transition-colors">
                                            {item.title}
                                        </Link>
                                    )}
                                </span>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-all">
                        <Bell className="w-[18px] h-[18px]" />
                    </button>
                    <button className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-all">
                        <Settings className="w-[18px] h-[18px]" />
                    </button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-9 w-9 rounded-lg p-1">
                                <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                                    <AvatarImage src={auth.user.avatar} alt={auth.user.full_name} />
                                    <AvatarFallback className="rounded-lg bg-slate-200 text-slate-600 text-xs font-semibold">
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
        </>
    );
}
