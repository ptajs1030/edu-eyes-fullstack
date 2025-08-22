import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Option {
  id: number | string;
  name: string;
}

interface MultiSearchableSelectInlineProps {
  value: (number | string)[];
  onChange: (value: (number | string)[]) => void;
  placeholder?: string;
  endpoint?: string;
  options?: Option[];
  initialOptions?: Option[];
  showInitialOptions?: boolean;
  maxInitialOptions?: number;
}

export default function MultiSearchableSelectInline({
  value,
  onChange,
  placeholder = 'Search...',
  endpoint,
  options: staticOptions,
  initialOptions = [],
  showInitialOptions = false,
  maxInitialOptions = 10,
}: MultiSearchableSelectInlineProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<Option[]>(initialOptions);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Selected options
  const selectedOptions = options.filter(option => value.includes(option.id));

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load initial options
  useEffect(() => {
    if (showInitialOptions && endpoint && options.length === 0) {
      fetchOptions('');
    }
  }, [showInitialOptions, endpoint, options.length]);

  // Handle static options
  useEffect(() => {
    if (staticOptions && staticOptions.length > 0) {
      setOptions(staticOptions);
    }
  }, [staticOptions]);

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
    const inputVal = e.target.value;
    setInputValue(inputVal);

    // Clear previous debounce timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // If showInitialOptions is enabled and query is empty, show initial options
    if (showInitialOptions && inputVal === '') {
      fetchOptions('');
      return;
    }

    // Set new debounce
    debounceRef.current = setTimeout(() => {
      if (inputVal.length >= 1 || (showInitialOptions && inputVal.length === 0)) {
        fetchOptions(inputVal);
      } else {
        setOptions([]);
        setIsOpen(false);
      }
    }, 300);
  };

  const handleSelect = (option: Option) => {
    onChange([...value, option.id]);
    setInputValue('');
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleRemove = (id: number | string) => {
    onChange(value.filter(v => v !== id));
  };

  const handleFocus = () => {
    if (showInitialOptions && options.length === 0) {
      fetchOptions('');
    }
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      // Remove last selected item on backspace
      handleRemove(value[value.length - 1]);
    }
  };

  // Filter options based on input (exclude already selected)
  const filteredOptions = options.filter(option => 
    option.name.toLowerCase().includes(inputValue.toLowerCase()) &&
    !value.includes(option.id)
  );

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Input field with selected tags inside */}
      <div 
        className="flex flex-wrap items-center gap-1 border border-gray-300 rounded-md px-3 py-2 min-h-[42px] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Selected tags inside the input */}
        {selectedOptions.map(option => (
          <span 
            key={option.id} 
            className="inline-flex items-center rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
          >
            {option.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(option.id);
              }}
              className="ml-1 text-blue-600 hover:text-blue-800 hover:cursor-pointer"
            >
              ×
            </button>
          </span>
        ))}
        
        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={selectedOptions.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent"
          style={{ minWidth: '120px' }}
        />
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border max-h-60 overflow-auto">
          {isLoading ? (
            <div className="py-2 px-3 text-gray-500">Loading...</div>
          ) : filteredOptions.length === 0 ? (
            <div className="py-2 px-3 text-gray-500">Tidak ditemukan</div>
          ) : (
            filteredOptions.map(option => (
              <div
                key={option.id}
                onClick={() => handleSelect(option)}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                {option.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}