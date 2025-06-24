import { motion } from 'framer-motion';

export default function AcademicYearDeleteConfirmationModal({
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    handleDelete,
    academicYearToDelete,
}: {
    isDeleteModalOpen: boolean;
    setIsDeleteModalOpen: (open: boolean) => void;
    handleDelete: (id: number) => void;
    academicYearToDelete: { id: number; title: string } | null;
}) {
    return (
        isDeleteModalOpen && (
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
                    <h2 className="mb-4 text-lg font-bold">Confirm Deletion</h2>
                    <p>
                        Are you sure you want to delete <strong>{academicYearToDelete?.title}</strong>?
                    </p>
                    <div className="mt-4 flex justify-end gap-2">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="rounded bg-gray-300 px-4 py-2 hover:cursor-pointer">
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (academicYearToDelete) {
                                    handleDelete(academicYearToDelete.id);
                                }
                                setIsDeleteModalOpen(false);
                            }}
                            className="rounded bg-red-500 px-4 py-2 text-white hover:cursor-pointer"
                        >
                            Confirm
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )
    );
}
