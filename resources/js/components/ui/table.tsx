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
        <table className="w-full border-collapse rounded-lg bg-white text-black shadow-sm">
            <thead>
                <tr className="border-b bg-gray-100 text-gray-800">
                    {onSelectAll && (
                        <th className="p-4">
                            <input
                                type="checkbox"
                                onChange={(e) => onSelectAll(e.target.checked)}
                                checked={selectedIds && data.length > 0 && selectedIds.length === data.length}
                            />
                        </th>
                    )}
                    {headers.map((header) => (
                        <th key={header.key} className="p-4 text-sm font-semibold cursor-pointer group">
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
            <tbody>
                {data.length > 0 ? (
                    data.map((item, index) => rowRender(item, index))
                ) : (
                    <tr>
                        <td colSpan={headers.length + (onSelectAll ? 1 : 0)} className="p-4 text-center text-gray-600">
                            {emptyMessage}
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
}
