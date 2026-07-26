import { router } from '@inertiajs/react';

type Link = {
    url: string | null;
    label: string;
    active: boolean;
};

export default function Pagination({ links, dates = [], limit }: { links: Link[], dates?: string[], limit?: string | number }) {
    const safeDates = Array.isArray(dates) ? dates : dates ? [dates] : [];

    const visibleLinks = links.filter((_, i) => i !== 0 && i !== links.length - 1);

    return (
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400 dark:text-slate-500">
                Menampilkan <span className="font-semibold text-slate-700 dark:text-slate-300">{visibleLinks.findIndex(l => l.active) + 1}</span> dari{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">{visibleLinks.length}</span> data
            </p>
            <div className="flex items-center gap-1.5">
                {links.map((link, i) => {
                    let label = link.label;
                    const isPrev = label.toLowerCase().includes('pagination.previous');
                    const isNext = label.toLowerCase().includes('pagination.next');

                    let url = link.url;
                    if (url) {
                        const urlObj = new URL(url, window.location.origin);
                        if (limit !== undefined) urlObj.searchParams.set('limit', String(limit));
                        urlObj.searchParams.delete('dates');
                        safeDates.forEach((d, idx) => urlObj.searchParams.append(`dates[${idx}]`, d));
                        url = urlObj.pathname + urlObj.search;
                    }

                    if (isPrev) {
                        return (
                            <button
                                key={i}
                                onClick={() => url && router.visit(url)}
                                disabled={!link.url}
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                            </button>
                        );
                    }
                    if (isNext) {
                        return (
                            <button
                                key={i}
                                onClick={() => url && router.visit(url)}
                                disabled={!link.url}
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                        );
                    }

                    const pageLabel = label.replace(/&laquo;|&raquo;/g, '');
                    if (link.active) {
                        return (
                            <button
                                key={i}
                                className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-indigo-600 text-white text-sm font-semibold flex items-center justify-center shadow-lg shadow-primary/25"
                            >
                                {pageLabel}
                            </button>
                        );
                    }

                    return (
                        <button
                            key={i}
                            onClick={() => url && router.visit(url)}
                            disabled={!link.url}
                            className="w-9 h-9 rounded-xl text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                            {pageLabel}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
