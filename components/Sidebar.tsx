"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Library, User, Settings, GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"
import SearchModal from "./SearchModal"

export default function Sidebar() {
  const pathname = usePathname()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const navItems = [
    { icon: Home, href: "/", label: "Home" },
    { icon: Library, href: "/library", label: "Library" },
    { icon: User, href: "/profile", label: "Profile" },
  ]

  const bottomItems = [
    { icon: GraduationCap, href: "/learn", label: "Learn" },
    { icon: Settings, href: "/settings", label: "Settings" },
  ]

  return (
    <div className="w-16 flex flex-col items-center py-6 bg-black border-r border-white/10 h-screen sticky top-0 z-50">
      {/* Logo Placeholder */}
      <div className="w-1 bg-yellow-500 h-6 absolute left-0 top-8 rounded-r-full" />

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
                  ? "text-white"
                  : "text-white/40 hover:text-white"
              )}
              title={item.label}
            >
              <item.icon className={cn("w-6 h-6", isActive && "fill-current")} />
              {isActive && (
                <div className="absolute inset-0 bg-white/10 blur-xl rounded-full -z-10" />
              )}
            </Link>
          )
        })}
        
        {/* Search Button (Opens Modal) */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="p-2 rounded-xl transition-all duration-200 group relative flex items-center justify-center text-white/40 hover:text-white"
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
            className="p-2 text-white/40 hover:text-white transition-colors flex items-center justify-center"
            title={item.label}
          >
            <item.icon className="w-6 h-6" />
          </Link>
        ))}
      </div>
    </div>
  )
}
