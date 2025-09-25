import { router } from '@inertiajs/react';

type Link = {
    url: string | null;
    label: string;
    active: boolean;
};

export default function Pagination({ links, dates = [], limit }: { links: Link[], dates?: string[], limit?: string | number }) {
    // Pastikan dates selalu array
    const safeDates = Array.isArray(dates) ? dates : dates ? [dates] : [];
    return (
        <div className="mt-4 flex justify-center gap-2">
            {links.map((link, i) => {
                let label = link.label;
                if (label.toLowerCase().includes('pagination.previous')) label = '&laquo;';
                if (label.toLowerCase().includes('pagination.next')) label = '&raquo;';
                let url = link.url;
                if (url) {
                    const urlObj = new URL(url, window.location.origin);
                    if (limit !== undefined) urlObj.searchParams.set('limit', String(limit));
                    urlObj.searchParams.delete('dates');
                    // Kirim dates sebagai indexed array: dates[0]=..., dates[1]=...
                    safeDates.forEach((d, idx) => urlObj.searchParams.append(`dates[${idx}]`, d));
                    url = urlObj.pathname + urlObj.search;
                }
                return (
                    <button
                        key={i}
                        onClick={() => url && router.visit(url)}
                        disabled={!link.url}
                        className={`rounded px-3 py-1 text-sm hover:cursor-pointer ${link.active
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-black'
                            }`}
                        dangerouslySetInnerHTML={{ __html: label }}
                    />
                );
            })}
        </div>
    );
}