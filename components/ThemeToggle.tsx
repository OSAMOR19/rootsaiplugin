"use client"

import { motion } from "framer-motion"
import { Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const themes = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "Auto" },
  ]

  return (
    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {themes.map(({ value, icon: Icon, label }) => (
        <motion.button
          key={value}
          onClick={() => setTheme(value)}
          className={`p-2 rounded-md transition-all ${
            theme === value
              ? "bg-white dark:bg-gray-700 shadow-sm text-green-600 dark:text-green-400"
              : "text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={label}
        >
          <Icon className="w-4 h-4" />
        </motion.button>
      ))}
    </div>
  )
}
