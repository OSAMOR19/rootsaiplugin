"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Package, LogOut, ChevronRight, Upload } from "lucide-react"
import Link from "next/link"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Auth Check
    useEffect(() => {
        if (pathname === "/admin/login") {
            setIsLoading(false)
            return
        }

        const checkAuth = () => {
            const auth = localStorage.getItem("admin_authenticated")
            if (auth !== "true") {
                router.push("/admin/login")
            } else {
                setIsAuthorized(true)
            }
            setIsLoading(false)
        }
        checkAuth()
    }, [router, pathname])

    const handleLogout = () => {
        localStorage.removeItem("admin_authenticated")
        router.push("/admin/login")
    }

    // Bypass layout for login page - MOVED AFTER HOOKS
    if (pathname === "/admin/login") {
        return <>{children}</>
    }

    if (isLoading) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>
    }

    if (!isAuthorized) {
        return null // Will redirect
    }

    return (
        <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 flex flex-col bg-black/50 backdrop-blur-xl">
                <div className="p-6 border-b border-white/5">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                        ROOTS Admin
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <NavLink
                        href="/admin/dashboard"
                        icon={LayoutDashboard}
                        label="Dashboard"
                        isActive={pathname === "/admin/dashboard"}
                    />
                    <NavLink
                        href="/admin/packs"
                        icon={Package}
                        label="Packs"
                        isActive={pathname === "/admin/packs"}
                    />
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>

                    <Link href="/" className="mt-2 w-full flex items-center gap-3 px-4 py-3 text-green-400 hover:text-green-300 hover:bg-white/5 rounded-lg transition-colors">
                        <span className="font-medium text-sm">Back to App</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/50 backdrop-blur-md">
                    <div className="flex items-center text-sm text-white/40">
                        {pathname === '/admin/dashboard' && <span>Overview</span>}
                        {pathname === '/admin/packs' && <span>Manage your sound library</span>}
                        {pathname === '/admin/upload' && <span>Create New Pack</span>}
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Upload Button - Shows on all pages except upload page itself */}
                        {pathname !== '/admin/upload' && (
                            <button
                                onClick={() => router.push('/admin/upload')}
                                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full font-medium hover:bg-gray-200 transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                Upload
                            </button>
                        )}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500" />
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-8 bg-neutral-900/30">
                    {children}
                </main>
            </div>
        </div>
    )
}

function NavLink({ href, icon: Icon, label, isActive }: { href: string, icon: any, label: string, isActive: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all group ${isActive
                ? 'bg-white/10 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
        >
            <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-green-400' : 'text-current'}`} />
                <span className="font-medium">{label}</span>
            </div>
            {isActive && <ChevronRight className="w-4 h-4 text-white/40" />}
        </Link>
    )
}
