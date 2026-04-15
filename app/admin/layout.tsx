"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Package, LogOut, ChevronRight, Upload, Users } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()

    const handleLogout = async () => {
        try {
            await fetch('/api/admin/auth/logout', { method: 'POST' })
        } catch (error) {
            console.error('Logout failed:', error)
        }
        router.push("/admin/login")
    }

    // Bypass layout for login page
    if (pathname === "/admin/login") {
        return <>{children}</>
    }

    return (
        <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 flex flex-col bg-black/50 backdrop-blur-xl">
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <Image src="/rootslogo.png" alt="ROOTS" width={32} height={32} className="h-8 w-auto object-contain" />
                        <span className="text-xl font-bold text-white">Admin</span>
                    </div>
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
                    <NavLink
                        href="/admin/users"
                        icon={Users}
                        label="Users"
                        isActive={pathname === "/admin/users"}
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
                        {pathname === '/admin/users' && <span>Manage users &amp; plans</span>}
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
