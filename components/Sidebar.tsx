"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Home, Search, Music2, Compass, Settings, Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import SearchModal from "./SearchModal"

export default function Sidebar() {
  const pathname = usePathname()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const navItems = [
    { icon: Home, href: "/", label: "Home" },
    { icon: Compass, href: "/browse", label: "Explore" },
    { icon: Music2, href: "/sounds", label: "Sounds" },
    { icon: Heart, href: "/favourite", label: "Favourite" },
  ]

  const bottomItems = [
    { icon: Settings, href: "/settings", label: "Settings" },
  ]

  return (
    <div className="w-16 flex flex-col items-center py-6 bg-white dark:bg-black border-r border-gray-200 dark:border-white/10 h-screen sticky top-0 z-50 transition-colors duration-300">
      {/* Logo Removed as requested */}

      <nav className="flex-1 flex flex-col gap-8 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "p-2 rounded-xl transition-all duration-200 group relative flex items-center justify-center",
                isActive
                  ? "text-gray-900 dark:text-white drop-shadow-[0_0_8px_rgba(0,0,0,0.2)] dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                  : "text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white"
              )}
              title={item.label}
            >
              {item.label === "Home" ? (
                <Image
                  src="/rootslogo.png"
                  alt="Home"
                  width={24}
                  height={24}
                  className="w-6 h-6 object-contain"
                />
              ) : (
                <item.icon className={cn("w-6 h-6", isActive && "fill-current")} />
              )}
              {/* Removed blur background as requested */}
            </Link>
          )
        })}

        {/* Search Button (Opens Modal) */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="p-2 rounded-xl transition-all duration-200 group relative flex items-center justify-center text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white"
          title="Search"
        >
          <Search className="w-6 h-6" />
        </button>
      </nav>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <div className="flex flex-col gap-6 mb-24 mt-auto">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="p-2 text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white transition-colors flex items-center justify-center"
            title={item.label}
          >
            <item.icon className="w-6 h-6" />
          </Link>
        ))}
      </div>
    </div>
  )
}
