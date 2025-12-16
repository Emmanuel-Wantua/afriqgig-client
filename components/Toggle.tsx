"use client";

import { ToggleOn, ToggleOff } from "react-bootstrap-icons";

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
}

export default function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button 
      type="button"
      onClick={() => onChange(!checked)}
      className={`text-2xl transition-colors ${checked ? "text-green-500" : "text-gray-300"}`}
      aria-label={checked ? "Turn off" : "Turn on"}
    >
      {checked ? <ToggleOn /> : <ToggleOff />}
    </button>
  );
}
