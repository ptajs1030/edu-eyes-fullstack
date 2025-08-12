import { motion } from 'framer-motion';

type ActionButton = {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'danger' | 'neutral';
};

interface ActionModalProps {
    isOpen: boolean;
    title: string;
    message: string | React.ReactNode;
    buttons: ActionButton[];
    onClose: () => void;
}

export default function ActionModal({ isOpen, title, message, buttons, onClose }: ActionModalProps) {
    if (!isOpen) return null;

    const getButtonClass = (variant: ActionButton['variant']) => {
        switch (variant) {
            case 'danger':
                return 'bg-red-500 hover:bg-red-600 text-white';
            case 'primary':
                return 'bg-blue-600 hover:bg-blue-700 text-white';
            default:
                return 'border-gray-300 text-gray-700 hover:bg-gray-50';
        }
    };

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
                <h2 className="mb-4 text-lg font-bold">{title}</h2>
                <div className="mb-4">{message}</div>
                <div className="flex justify-end gap-2">
                    {buttons.map((button, index) => (
                        <button
                            key={index}
                            onClick={button.onClick}
                            className={`mr-2 rounded-md border px-4 py-2 text-sm font-medium shadow-sm hover:cursor-pointer ${getButtonClass(button.variant)}`}
                        >
                            {button.label}
                        </button>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}
