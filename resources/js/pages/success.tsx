import { Head } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';

interface PasswordResetSuccessProps {
    status?: string;
}

export default function PasswordResetSuccess({ status }: PasswordResetSuccessProps) {
    return (
        <AuthLayout
            title="Password Berhasil Diperbarui"
            description="Password anda berhasil diperbarui silahkan login dengan password terbaru anda."
        >
            <Head title="Password Berhasil Diperbarui" />

            <div className="flex flex-col items-center gap-6 text-center">
                <div className="rounded-full bg-green-100 p-4 text-green-600">
                    <CheckCircle2 className="h-8 w-8" strokeWidth={2} />
                </div>

                <div className="space-y-2">
                   
                </div>

              

                {status && <div className="mt-4 text-center text-sm font-medium text-green-600">{status}</div>}
            </div>
        </AuthLayout>
    );
}
