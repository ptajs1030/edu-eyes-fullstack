import AppLogoIcon from './app-logo-icon';
import { usePage } from '@inertiajs/react';

export default function AppLogo({ small = false }: { small?: boolean }) {
    const { schoolLogo, schoolName } = usePage().props as unknown as { schoolLogo: string, schoolName: string };
    return (
        <>
            <div className={`text-sidebar-primary-foreground flex aspect-square items-center justify-center rounded-md ${small ? 'size-8' : 'size-12'}`}>
                <AppLogoIcon logoUrl={schoolLogo} className={small ? 'size-2 fill-current text-white dark:text-white' : 'size-5 fill-current text-white dark:text-white'} />
            </div>
            {!small && (
                <div className="ml-1 grid flex-1 text-left text-sm">
                    <span className="mb-0.5 truncate leading-none font-semibold">{schoolName}</span>
                </div>
            )}
        </>
    );
}
