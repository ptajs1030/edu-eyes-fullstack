// resources/js/Pages/Users/Admin/Form.tsx
import { usePage } from '@inertiajs/react';
import BaseForm from '../base-form';

export default function AdminForm() {
    const { user, statuses, role } = usePage<{
        user?: User;
        statuses: { value: string; label: string }[];
        role: {
            id: number;
            name: string;
            value: string;
        };
    }>().props;

    return <BaseForm isOpen={true} onClose={() => window.history.back()} user={user} statuses={statuses} role={role} routePrefix="admin.users" />;
}
