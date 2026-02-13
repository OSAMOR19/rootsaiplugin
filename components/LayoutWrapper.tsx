"use client"

import Sidebar from "@/components/Sidebar"
import PlayerBar from "@/components/PlayerBar"
import { usePathname } from "next/navigation"

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Show sidebar/player on all pages EXCEPT the home page ("/"), admin pages ("/admin"), and auth pages ("/auth")
  const showAppLayout = pathname !== "/" && !pathname.startsWith("/admin") && !pathname.startsWith("/auth")

  if (!showAppLayout) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-black overflow-hidden transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 transition-colors duration-300">
          {children}
        </main>
        <PlayerBar />
      </div>
    </div>
  )
}
