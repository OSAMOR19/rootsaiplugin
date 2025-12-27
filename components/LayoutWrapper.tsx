"use client"

import Sidebar from "@/components/Sidebar"
import PlayerBar from "@/components/PlayerBar"
import { usePathname } from "next/navigation"

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Show sidebar/player on all pages EXCEPT the home page ("/")
  const showAppLayout = pathname !== "/"

  if (!showAppLayout) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-900 to-black">
          {children}
        </main>
        <PlayerBar />
      </div>
    </div>
  )
}
