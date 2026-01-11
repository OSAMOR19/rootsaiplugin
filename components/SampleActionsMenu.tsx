"use client"

import { MoreHorizontal, Download } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SampleActionsMenuProps {
    sample: any
    iconColor?: string
    buttonClass?: string
}

export default function SampleActionsMenu({ sample, iconColor = "text-gray-400 dark:text-gray-500", buttonClass }: SampleActionsMenuProps) {

    const handleDownloadStem = async (stem: any) => {
        try {
            if (!stem.url) {
                console.error("Stem has no URL:", stem)
                return
            }

            const response = await fetch(stem.url)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = stem.filename || `${stem.name}.wav`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Download failed:', error)
            if (stem.url) window.open(stem.url, '_blank')
        }
    }

    return (
        <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        className={buttonClass || `w-8 h-8 rounded-full ${iconColor} hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center`}
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 z-[100]" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem
                        onClick={(e) => {
                            e.stopPropagation()
                            const mainFileUrl = sample.url || sample.audioUrl
                            if (mainFileUrl) {
                                handleDownloadStem({
                                    url: mainFileUrl,
                                    name: sample.name,
                                    filename: sample.filename || `${sample.name}.wav` // Fallback, though likely zip
                                })
                            }
                        }}
                        className="flex items-center justify-between cursor-pointer group"
                    >
                        <span className="truncate font-medium">Download stems</span>
                        <Download className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                    </DropdownMenuItem>

                    {sample.stems && sample.stems.length > 0 && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Stems
                            </DropdownMenuLabel>
                            {sample.stems.map((stem: any, i: number) => (
                                <DropdownMenuItem
                                    key={i}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleDownloadStem(stem)
                                    }}
                                    className="flex items-center justify-between cursor-pointer group"
                                >
                                    <span className="truncate">{stem.name}</span>
                                    <Download className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                                </DropdownMenuItem>
                            ))}
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
