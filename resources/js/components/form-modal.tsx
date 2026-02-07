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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="w-full max-w-xl rounded-lg bg-white p-6 shadow-xl"
            >
                <h2 className="mb-4 text-center text-lg font-semibold">{title}</h2>
                <form
                    onSubmit={onSubmit}
                    encType="multipart/form-data"
                    className="max-h-[75vh] overflow-y-auto space-y-4"
                >
                    {children}
                </form>
            </motion.div>
        </motion.div>
    );
}
