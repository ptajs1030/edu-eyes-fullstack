import { motion } from 'framer-motion';

export default function FormModal({
    isOpen,
    onClose,
    title,
    onSubmit,
    children,
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    onSubmit: (e: React.FormEvent) => void;
    children: React.ReactNode;
}) {
    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ duration: 0.15 }}
                className="w-full max-w-xl glass-card rounded-2xl p-6 lg:p-8"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-2.54 5.01c-.58 1.16-2.25.75-2.25-.66V13.5H4.83c-1.41 0-2.02-1.7-1.03-2.66l8.5-8.5c.76-.76 2-.44 2.24.55l1.1 4.49c.1.4-.21.78-.63.78H13.5v3.75c0 .83-.67 1.5-1.5 1.5h-2.58z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form
                    onSubmit={onSubmit}
                    encType="multipart/form-data"
                    className="max-h-[65vh] overflow-y-auto custom-scroll space-y-5 px-0.5"
                >
                    {children}
                </form>
            </motion.div>
        </motion.div>
    );
}
