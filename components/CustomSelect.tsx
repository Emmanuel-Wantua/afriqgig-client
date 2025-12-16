"use client";

import { useId } from "react";
import { ChevronDown } from "react-bootstrap-icons";

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  disabled?: boolean;
}

export default function CustomSelect({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: CustomSelectProps) {
  const id = useId();

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className="block text-xs font-bold text-gray-500 uppercase mb-1"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full p-3 pr-10 bg-white border border-gray-200 rounded-xl text-sm text-navy outline-none focus:border-navy appearance-none transition-all disabled:bg-gray-50 disabled:text-gray-400"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
          <ChevronDown className="text-xs" />
        </div>
      </div>
    </div>
  );
}
