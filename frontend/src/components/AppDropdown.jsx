import { useState } from "react";
import { ChevronDown } from "lucide-react";

function AppDropdown({ className = "", label, onChange, options, value }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value) || options[0];

  return (
    <div
      className={`app-dropdown ${className}`.trim()}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        aria-expanded={isOpen}
        aria-label={label}
        className="app-dropdown-trigger"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span>{selectedOption?.label || label}</span>
        <ChevronDown size={18} />
      </button>

      {isOpen && (
        <div className="app-dropdown-menu">
          {options.map((option) => (
            <button
              className={`app-dropdown-option ${option.value === value ? "selected" : ""} ${option.tone ? `option-${option.tone}` : ""}`}
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default AppDropdown;
