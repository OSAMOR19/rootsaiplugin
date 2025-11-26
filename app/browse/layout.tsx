import Sidebar from "@/components/Sidebar"
import PlayerBar from "@/components/PlayerBar"

export default function BrowseLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen bg-black overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-900 to-black p-8">
                    {children}
                </main>
                <PlayerBar />
            </div>
        </div>
    )
}
