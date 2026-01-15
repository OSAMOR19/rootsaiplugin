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
import JSZip from "jszip"
import { saveAs } from "file-saver"

interface SampleActionsMenuProps {
    sample: any
    iconColor?: string
    buttonClass?: string
}

export default function SampleActionsMenu({ sample, iconColor = "text-gray-400 dark:text-gray-500", buttonClass }: SampleActionsMenuProps) {

    const handleDownloadFile = async (url: string, filename: string) => {
        try {
            const response = await fetch(url)
            const blob = await response.blob()
            const blobUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = blobUrl
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(blobUrl)
        } catch (error) {
            console.error('Download failed:', error)
            window.open(url, '_blank')
        }
    }

    const handleDownloadAllStems = async () => {
        if (!sample.stems || sample.stems.length === 0) return

        try {
            const zip = new JSZip()
            const folder = zip.folder(sample.name || "stems")

            // Add main file
            if (sample.audioUrl || sample.url) {
                const mainUrl = sample.audioUrl || sample.url
                const mainBlob = await fetch(mainUrl).then(r => r.blob())
                folder?.file(`${sample.name}.wav`, mainBlob)
            }

            // Add stems
            await Promise.all(sample.stems.map(async (stem: any) => {
                if (stem.url) {
                    const stemBlob = await fetch(stem.url).then(r => r.blob())
                    folder?.file(stem.filename || `${stem.name}.wav`, stemBlob)
                }
            }))

            const content = await zip.generateAsync({ type: "blob" })
            saveAs(content, `${sample.name}_stems.zip`)

        } catch (error) {
            console.error("Failed to zip stems:", error)
            alert("Failed to create ZIP file. Please try downloading individual files.")
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
                    
                    {/* Main File Download */}
                    <DropdownMenuItem
                        onClick={(e) => {
                            e.stopPropagation()
                            const mainFileUrl = sample.url || sample.audioUrl
                            if (mainFileUrl) {
                                handleDownloadFile(mainFileUrl, sample.filename || `${sample.name}.wav`)
                            }
                        }}
                        className="flex items-center justify-between cursor-pointer group"
                    >
                        <span className="truncate font-medium">Download File</span>
                        <Download className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                    </DropdownMenuItem>

                    {/* Stems ZIP Download */}
                    {sample.stems && sample.stems.length > 0 && (
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation()
                                handleDownloadAllStems()
                            }}
                            className="flex items-center justify-between cursor-pointer group"
                        >
                            <span className="truncate font-medium">Download Stems (ZIP)</span>
                            <Download className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                        </DropdownMenuItem>
                    )}

                    {sample.stems && sample.stems.length > 0 && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Individual Stems
                            </DropdownMenuLabel>
                            {sample.stems.map((stem: any, i: number) => (
                                <DropdownMenuItem
                                    key={i}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleDownloadFile(stem.url, stem.filename || `${stem.name}.wav`)
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
