import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import React from 'react';
import { Head } from '@inertiajs/react';
import SchoolStatsCard from '@/components/SchoolStatsCard';
import QuickActions from '@/components/QuickActions';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    }
];

export default function Dashboard() {
    const [stats, setStats] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        fetch('/api/school-stats')
            .then((res) => res.json())
            .then((data) => {
                setStats(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-2">
                    {loading ? (
                        <div className="flex items-center justify-center h-48 w-full col-span-2">
                            <span className="text-gray-400">Memuat statistik sekolah...</span>
                        </div>
                    ) : stats ? (
                        <SchoolStatsCard stats={stats} />
                    ) : (
                        <div className="text-red-500">Gagal memuat data statistik sekolah.</div>
                    )}
                    <QuickActions />
                </div>
            </div>
        </AppLayout>
    );
}
