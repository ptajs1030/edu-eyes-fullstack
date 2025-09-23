import { router } from '@inertiajs/react';

type Link = {
    url: string | null;
    label: string;
    active: boolean;
};

export default function Pagination({ links }: { links: Link[] }) {
    // Ambil query params dari window.location agar limit dan dates tetap dikirim
    const currentParams = new URLSearchParams(window.location.search);
    const limit = currentParams.get('limit');
    const dates = currentParams.getAll('dates');

    return (
        <div className="mt-4 flex justify-center gap-2">
            {links.map((link, i) => {
                let label = link.label;
                if (label.toLowerCase().includes('pagination.previous')) label = '&laquo;';
                if (label.toLowerCase().includes('pagination.next')) label = '&raquo;';
                let url = link.url;
                if (url) {
                    const urlObj = new URL(url, window.location.origin);
                    if (limit) urlObj.searchParams.set('limit', limit);
                    if (dates.length > 0) {
                        urlObj.searchParams.delete('dates');
                        dates.forEach(d => urlObj.searchParams.append('dates', d));
                    }
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