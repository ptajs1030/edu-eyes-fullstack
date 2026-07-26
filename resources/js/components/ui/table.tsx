import SortableTableHeader from "./sort-table-header";

export default function Table({
    headers,
    data,
    sortColumn,
    sortDirection,
    onSort,
    onSelectAll,
    selectedIds,
    rowRender,
    emptyMessage = 'No data found.',
}: {
    headers: { key: string; label: string; sortable?: boolean }[];
    data: any[];
    sortColumn: string;
    sortDirection: 'asc' | 'desc';
    onSort: (column: string) => void;
    onSelectAll?: (checked: boolean) => void;
    selectedIds?: (number | string)[];
    rowRender: (item: any, index: number) => React.ReactNode;
    emptyMessage?: string;
}) {
    return (
        <div className="bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-700/50">
                            {onSelectAll && (
                                <th className="px-5 py-4 w-12">
                                    <input
                                        type="checkbox"
                                        onChange={(e) => onSelectAll(e.target.checked)}
                                        checked={selectedIds && data.length > 0 && selectedIds.length === data.length}
                                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500/20 cursor-pointer bg-slate-50 dark:bg-slate-700"
                                    />
                                </th>
                            )}
                            {headers.map((header) => (
                                <th key={header.key} className="px-5 py-4 font-bold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider whitespace-nowrap">
                                    {header.sortable ? (
                                        <SortableTableHeader column={header.key} sortColumn={sortColumn} sortDirection={sortDirection} onSortChange={onSort}>
                                            {header.label}
                                        </SortableTableHeader>
                                    ) : (
                                        <span>{header.label}</span>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                        {data.length > 0 ? (
                            data.map((item, index) => rowRender(item, index))
                        ) : (
                            <tr>
                                <td colSpan={headers.length + (onSelectAll ? 1 : 0)} className="px-5 py-12 text-center text-muted-foreground">
                                    {emptyMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
