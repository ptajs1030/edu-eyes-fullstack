import { usePage } from '@inertiajs/react';
import { GraduationCap } from 'lucide-react';

export default function AppLogo({ small = false }: { small?: boolean }) {
    const { schoolLogo, schoolName } = usePage().props as unknown as { schoolLogo: string, schoolName: string };
    return (
        <>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center mr-3 shadow-lg shadow-primary/25 shrink-0">
                {schoolLogo ? (
                    <img src={schoolLogo} alt="Logo" className={small ? 'w-5 h-5 p-0.5' : 'w-5 h-5 p-0.5'} />
                ) : (
                    <GraduationCap className={small ? 'w-4 h-4 text-white' : 'w-4 h-4 text-white'} />
                )}
            </div>
            {!small && (
                <div>
                    <span className="font-bold text-foreground text-sm tracking-tight">{schoolName}</span>
                    <p className="text-[10px] text-muted-foreground font-medium">Admin Panel v2.0</p>
                </div>
            )}
        </>
    );
}
