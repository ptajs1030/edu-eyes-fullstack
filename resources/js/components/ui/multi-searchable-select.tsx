import { useState, useEffect, useRef } from 'react';

interface Option {
  id: number | string;
  name: string;
}

interface MultiSearchableSelectProps {
  value: (number | string)[];
  onChange: (value: (number | string)[]) => void;
  placeholder?: string;
  options: Option[];
}

export default function MultiSearchableSelect({
  value,
  onChange,
  placeholder = 'Search...',
  options,
}: MultiSearchableSelectProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // Filter options based on input
  const filteredOptions = options.filter(option => 
    option.name.toLowerCase().includes(inputValue.toLowerCase()) &&
    !value.includes(option.id)
  );

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

  const handleSelect = (option: Option) => {
    onChange([...value, option.id]);
    setInputValue('');
    setIsOpen(false);
  };

  const handleRemove = (id: number | string) => {
    onChange(value.filter(v => v !== id));
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Selected tags */}
      <div className="flex flex-wrap gap-1 mb-1">
        {selectedOptions.map(option => (
          <div 
            key={option.id} 
            className="flex items-center rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
          >
            <span>{option.name}</span>
            <button
              type="button"
              onClick={() => handleRemove(option.id)}
              className="ml-1 text-gray-500 hover:text-red-500 hover:cursor-pointer"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Input field */}
      <div className="flex border border-gray-300 rounded">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 outline-none"
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border max-h-60 overflow-auto">
          {filteredOptions.length === 0 ? (
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