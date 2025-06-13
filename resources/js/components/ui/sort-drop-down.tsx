import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

const SortDropdown = ({
    options,
    onSortChange,
}: {
    options: { label: string; value: { sort: string; direction: string } }[];
    onSortChange: (sort: string, direction: string) => void;
}) => {
    const [open, setOpen] = useState(false);

    const handleSelect = (value: { sort: string; direction: string }) => {
        onSortChange(value.sort, value.direction);
        setOpen(false);
    };

    return (
        <div className="relative inline-block text-left">
            <button
                onClick={() => setOpen(!open)}
                className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
            >
                Sort
                {open ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    {options.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSelect(option.value)}
                            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SortDropdown;