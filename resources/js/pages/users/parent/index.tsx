import { usePage } from '@inertiajs/react';
import BaseIndex from '../base-index';

export default function ParentIndex() {
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
            breadcrumbs={[{ title: 'Orang Tua/Wali', href: '/parents' }]}
            title="Orang Tua/Wali"
            role={role}
            routePrefix="parents"
        />
    );
}
