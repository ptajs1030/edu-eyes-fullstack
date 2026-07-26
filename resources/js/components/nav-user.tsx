import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { ChevronsUpDown } from 'lucide-react';

export function NavUser() {
    const { auth } = usePage<SharedData>().props;

    const getInitials = (name: string): string => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0">
                        {getInitials(auth.user.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{auth.user.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{auth.user.email}</p>
                    </div>
                    <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-lg" align="end">
                <div className="p-2 text-sm">
                    <p className="font-medium text-foreground">{auth.user.full_name}</p>
                    <p className="text-xs text-muted-foreground">{auth.user.email}</p>
                </div>
                <div className="border-t border-border p-1">
                    <a href="/settings/profile" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-foreground transition-colors">
                        Pengaturan
                    </a>
                    <form method="POST" action="/logout">
                        <button type="submit" className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-foreground transition-colors">
                            Keluar
                        </button>
                    </form>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
