import AppLogoIcon from './app-logo-icon';
import { usePage } from '@inertiajs/react';

export default function AppLogo() {
    const { schoolLogo, schoolName } = usePage().props as unknown as { schoolLogo: string, schoolName: string };
    return (
        <>
            <div className="text-sidebar-primary-foreground flex aspect-square size-12 items-center justify-center rounded-md">
                <AppLogoIcon logoUrl={schoolLogo} className="size-5 fill-current text-white dark:text-white" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-none font-semibold">{schoolName}</span>
            </div>
        </>
    );
}
