import { useState } from 'react';
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';

interface TimePickerWrapperProps {
  value: string;
  onChange: (value: string) => void;
  minTime?: string;
  required?: boolean;
  id?: string;
  disabled?: boolean;
}

const TimePickerWrapper = ({ 
  value, 
  onChange, 
  minTime, 
  required, 
  id, 
  disabled = false 
}: TimePickerWrapperProps) => {
  const [timeValue, setTimeValue] = useState(value);

  const handleChange = (time: string | null) => {
    const newTime = time || '';
    setTimeValue(newTime);
    onChange(newTime);
  };

  return (
    <div className="time-picker-wrapper">
      <TimePicker
        id={id}
        value={timeValue}
        onChange={handleChange}
        disableClock={true}
        format="HH:mm"
        clearIcon={null}
        required={required}
        minTime={minTime}
        disabled={disabled}
        className="custom-time-picker mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
      />
    </div>
  );
};

export default TimePickerWrapper;