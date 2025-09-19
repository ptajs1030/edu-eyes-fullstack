import AppLogoIcon from '@/components/app-logo-icon';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    const { schoolLogo } = usePage().props as unknown as { schoolLogo: string };

    return (
        <div className="min-h-svh flex items-center justify-center bg-[#f5f6f7]">
            <div className="w-full max-w-md p-8 md:p-10 rounded-xl border border-[#e2e2e2] shadow-lg bg-white" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1.5px solid #e2e2e2' }}>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col items-center gap-4">
                        <Link href={route('home')} className="flex flex-col items-center gap-2 font-medium">
                            <div className="mb-1 flex h-28 w-28 items-center justify-center">
                                <AppLogoIcon logoUrl={schoolLogo} logoSize="h-24 w-auto mx-auto" className="size-9 fill-current text-[var(--foreground)] dark:text-white"/>
                            </div>
                            <span className="sr-only">{title}</span>
                        </Link>
                        <div className="space-y-2 text-center">
                            <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
                            <p className="text-gray-500 text-center text-base">{description}</p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
