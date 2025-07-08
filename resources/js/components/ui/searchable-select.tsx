import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

interface Option {
    id: number | string;
    full_name: string;
}

interface SearchableSelectProps {
    value: number | string | null;
    onChange: (value: number | string | null) => void;
    placeholder?: string;
    endpoint?: string;
    initialOption?: Option;
    showInitialOptions?: boolean;
    maxInitialOptions?: number;
}

export default function SearchableSelect({
    value,
    onChange,
    placeholder = 'Search...',
    endpoint,
    initialOption,
    showInitialOptions = false, 
    maxInitialOptions = 10
}: SearchableSelectProps) {
    const [inputValue, setInputValue] = useState('');
    const [options, setOptions] = useState<Option[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedOption, setSelectedOption] = useState<Option | null>(initialOption || null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialOption) {
            setSelectedOption(initialOption);
            setInputValue(initialOption.full_name);
        }
    }, [initialOption]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchOptions = async (query: string) => {
        if (!endpoint) return;
        
        setIsLoading(true);
        try {
            const response = await axios.get(endpoint, { 
                params: { query },
                withCredentials: true,
            });

            const limitedOptions = response.data.slice(0, maxInitialOptions);
            setOptions(limitedOptions);
            setIsOpen(true);
        } catch (error) {
            console.error('Error fetching options:', error);
            setOptions([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        
        // Clear previous debounce timeout
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // If showInitialOptions is enabled and query is empty, show initial options
        if (showInitialOptions && value === '') {
            fetchOptions('');
            return;
        }
        
        // Set new debounce
        debounceRef.current = setTimeout(() => {
            if (value.length >= 1 || (showInitialOptions && value.length === 0)) {
                fetchOptions(value);
            } else {
                setOptions([]);
                setIsOpen(false);
            }
        }, 300);
    };

    const handleSelect = (option: Option) => {
        setSelectedOption(option);
        setInputValue(option.full_name);
        onChange(option.id);
        setIsOpen(false);
    };

    const handleClear = () => {
        setSelectedOption(null);
        setInputValue('');
        onChange(null);
        setOptions([]);
    };

    const handleFocus = () => {
        // If showInitialOptions is enabled and input is empty, show initial options
        if (showInitialOptions && inputValue === '') {
            fetchOptions('');
        }
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="flex items-center border rounded">
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className="flex-1 px-3 py-2 outline-none"
                    onFocus={handleFocus}
                />
                {selectedOption && (
                    <button 
                        type="button"
                        onClick={handleClear}
                        className="px-2 text-gray-500 hover:text-red-500"
                    >
                        ×
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border max-h-60 overflow-auto">
                    {isLoading ? (
                        <div className="py-2 px-3 text-gray-500">Loading...</div>
                    ) : options.length === 0 ? (
                        <div className="py-2 px-3 text-gray-500">No results found</div>
                    ) : (
                        options.map((option) => (
                            <div
                                key={option.id}
                                onClick={() => handleSelect(option)}
                                className={`px-3 py-2 hover:bg-gray-100 cursor-pointer ${
                                    selectedOption?.id === option.id ? 'bg-blue-50' : ''
                                }`}
                            >
                                {option.full_name}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}