import { router } from '@inertiajs/react';

type Link = {
    url: string | null;
    label: string;
    active: boolean;
};

export default function Pagination({ links }: { links: Link[] }) {
    return (
        <div className="mt-4 flex justify-center gap-2">
            {links.map((link, i) => {
                let label = link.label;
                if (label.toLowerCase().includes('pagination.previous')) label = '&laquo;';
                if (label.toLowerCase().includes('pagination.next')) label = '&raquo;';
                return (
                    <button
                        key={i}
                        onClick={() => link.url && router.visit(link.url)}
                        disabled={!link.url}
                        className={`rounded px-3 py-1 text-sm hover:cursor-pointer ${
                            link.active 
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