"use client"

interface FilterSelectProps {
    label: string
    value: string
    onChange: (value: string) => void
    options: string[]
}

/**
 * Reusable filter dropdown component
 * Shows as a pill button with green highlight when active
 */
export default function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
    if (options.length === 0) return null

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`appearance-none bg-gray-100 dark:bg-white/5 border px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors focus:outline-none 
        ${value
                    ? 'border-green-500/50 text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/10'
                    : 'border-gray-300 dark:border-white/10 text-gray-700 dark:text-white/70 hover:border-gray-400 dark:hover:border-white/30 hover:text-gray-900 dark:hover:text-white'
                }`}
        >
            <option value="">{label}</option>
            {options.map((opt) => (
                <option key={opt} value={opt} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                    {opt}
                </option>
            ))}
        </select>
    )
}
