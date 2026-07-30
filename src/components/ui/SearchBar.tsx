import { HiOutlineSearch, HiOutlineX } from 'react-icons/hi';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({ value, onChange, placeholder = 'Search', autoFocus }: SearchBarProps) {
  return (
    <div className="glass-input flex items-center gap-2 px-4 py-3">
      <HiOutlineSearch className="text-blush-600/70 shrink-0" size={18} />
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent outline-none flex-1 text-sm placeholder:text-blush-700/40 dark:placeholder:text-blush-200/30"
      />
      {value && (
        <button onClick={() => onChange('')} aria-label="Clear">
          <HiOutlineX size={16} className="text-blush-600/60" />
        </button>
      )}
    </div>
  );
}
