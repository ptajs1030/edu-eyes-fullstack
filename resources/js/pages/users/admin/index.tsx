// resources/js/Pages/Users/Admin/Index.tsx
import { usePage } from '@inertiajs/react';
import BaseIndex from '../base-index';

export default function AdminIndex() {
    const { users, statuses, filters, role } = usePage<{
        users: any;
        statuses: Array<{ value: string; label: string }>;
        filters: { search?: string; sort?: string; direction?: string };
        role: {
            id: number;
            name: string;
            value: string;
        };
    }>().props;

    return (
        <BaseIndex
            users={users}
            statuses={statuses}
            filters={filters}
            breadcrumbs={[
                { title: 'Dashboard', href: '/' },
                { title: 'Admin Users', href: route('admin.index') },
            ]}
            title="Admin Users"
            role={role}
            routePrefix="admin"
        />
    );
}
