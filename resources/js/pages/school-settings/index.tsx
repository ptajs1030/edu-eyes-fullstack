import Pagination from '@/components/ui/pagination';
import Table from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import SettingFormModal from './form';

type Setting = {
    id: number;
    key: string;
    value: string;
};

type PaginatedResponse<T, L> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: L[];
};

type Link = {
    url: string | null;
    label: string;
    active: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Settings',
        href: '/school-settings',
    },
];

export default function SettingIndex() {
    const { settings, filters } = usePage<{
        settings: PaginatedResponse<Setting, Link>;
        filters: { search?: string; sort?: string; direction?: string };
    }>().props;

    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedSetting, setSelectedSetting] = useState<Setting | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const openForm = (setting: Setting) => {
        setSelectedSetting(setting);
        setIsFormOpen(true);
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const exportSelected = () => {
        const selectedData = settings.data.filter((a) => selectedIds.includes(a.id));
        const headers = `Key,Value\n`;
        const csv = selectedData.map((a) => `${a.key},${a.value}`).join('\n');
        const blob = new Blob([headers, csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'school-settngs.csv';
        link.click();
    };

    const handleSortChange = (column: string) => {
        router.get(route('settings.index'), { sort: column, direction: filters.direction === 'asc' ? 'desc' : 'asc' }, { preserveState: true });
    };

    const tableHeaders = [
        { key: 'key', label: 'Key', sortable: true },
        { key: 'value', label: 'Value', sortable: false },
        { key: 'actions', label: 'Actions', sortable: false },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Settings" />
            <Toaster position="top-right" richColors />

            <div className="flex flex-col gap-6 rounded-xl bg-white p-6 text-black shadow-lg">
                <div className="flex items-center justify-between">
                    {/* Search */}
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Search settings by key..."
                            defaultValue={filters.search || ''}
                            onChange={(e) => router.get(route('school-settings.index'), { search: e.target.value }, { preserveState: true })}
                            className="w-64 rounded border px-3 py-1"
                        />
                        <button onClick={exportSelected} className="rounded bg-indigo-600 px-3 py-1 text-sm text-white hover:cursor-pointer">
                            Export Selected
                        </button>
                    </div>
                </div>

                {/* Table */}
                <Table
                    headers={tableHeaders}
                    data={settings.data}
                    sortColumn={filters.sort ?? ''}
                    sortDirection={filters.direction === 'asc' || filters.direction === 'desc' ? filters.direction : 'asc'}
                    onSort={handleSortChange}
                    onSelectAll={(checked) => setSelectedIds(checked ? settings.data.map((a) => a.id) : [])}
                    selectedIds={selectedIds}
                    rowRender={(setting) => (
                        <tr key={setting.id} className="border-b">
                            <td className="p-3">
                                <input type="checkbox" checked={selectedIds.includes(setting.id)} onChange={() => toggleSelect(setting.id)} />
                            </td>
                            <td className="p-3">{setting.key}</td>
                            <td className="p-3">{setting.value}</td>
                            <td className="flex justify-center gap-2 p-3">
                                <button
                                    onClick={() => openForm(setting)}
                                    className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:cursor-pointer"
                                >
                                    Edit
                                </button>
                            </td>
                        </tr>
                    )}
                />

                <Pagination links={settings.links} />

                {/* Modal */}
                <SettingFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} setting={selectedSetting} />
            </div>
        </AppLayout>
    );
}
