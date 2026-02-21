"use client"

import React, { useEffect, useRef, useState } from "react"
import WaveSurfer from "wavesurfer.js"
import { useAudio } from "@/contexts/AudioContext"

interface WaveformCellProps {
    audioUrl: string
    sampleId: string
    height?: number
    waveColor?: string
    progressColor?: string
    onDurationLoaded?: (duration: number) => void
}

export default function WaveformCell({
    audioUrl,
    sampleId,
    height = 32,
    waveColor = 'rgb(156, 163, 175)', // gray-400
    progressColor = 'rgb(34, 197, 94)', // green-500
    onDurationLoaded
}: WaveformCellProps) {

    const containerRef = useRef<HTMLDivElement>(null)
    const waveSurferRef = useRef<WaveSurfer | null>(null)
    const { currentTrack, isPlaying, currentTime, duration } = useAudio()
    const [isLoaded, setIsLoaded] = useState(false)

    // Initialize WaveSurfer
    useEffect(() => {
        if (!containerRef.current || waveSurferRef.current) return

        // 1. Setup Intersection Observer to lazy load
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    initWaveSurfer()
                    observer.disconnect()
                }
            })
        }, { rootMargin: '100px' })

        observer.observe(containerRef.current)

        return () => {
            observer.disconnect()
            // Cleanup WaveSurfer if it exists
            if (waveSurferRef.current) {
                // Determine if we should destroy immediately or wait
                // WaveSurfer destroy cancellation might cause AbortError if loading
                try {
                    waveSurferRef.current.destroy()
                } catch (e) {
                    console.warn("WaveSurfer destroy error ignored:", e)
                }
                waveSurferRef.current = null
            }
        }
    }, [audioUrl, height, waveColor, progressColor])

    const initWaveSurfer = () => {
        if (!containerRef.current) return

        try {
            const ws = WaveSurfer.create({
                container: containerRef.current,
                waveColor: waveColor,
                progressColor: progressColor,
                cursorColor: 'transparent',
                barWidth: 2,
                barGap: 1,
                barRadius: 2,
                height: height,
                normalize: true,
                interact: false,
                hideScrollbar: true,
                fillParent: true,
                minPxPerSec: 1,
            })

            // Handle Dark Mode
            if (document.documentElement.classList.contains('dark')) {
                ws.setOptions({
                    waveColor: 'rgb(107, 114, 128)',
                })
            }

            ws.load(audioUrl)
                .then(() => {
                    setIsLoaded(true)
                    if (onDurationLoaded) {
                        const d = ws.getDuration()
                        if (d && d > 0) onDurationLoaded(d)
                    }
                })
                .catch(err => {
                    if (err.name !== 'AbortError') {
                        console.error("Waveform load error:", err)
                    }
                })

            waveSurferRef.current = ws
        } catch (e) {
            console.error("WaveSurfer init error:", e)
        }
    }

    // Sync with Global Player
    useEffect(() => {
        const ws = waveSurferRef.current
        if (!ws || !isLoaded) return

        const isCurrent = currentTrack?.id === sampleId

        if (isCurrent) {
            // Calculate progress (0 to 1)
            // Use global duration because WaveSurfer might calculate slightly different duration
            // or just use ratio.
            const d = duration || ws.getDuration() || 1
            const progress = currentTime / d

            // Seek to position (without playing internal audio)
            // WaveSurfer.seekTo takes 0..1
            if (!isNaN(progress) && isFinite(progress)) {
                ws.seekTo(Math.max(0, Math.min(1, progress)))
            }
        } else {
            // Reset to 0 if not current
            ws.seekTo(0)
        }

    }, [currentTrack, currentTime, duration, sampleId, isLoaded])

    return (
        <div ref={containerRef} className="w-full h-full opacity-80 hover:opacity-100 transition-opacity" />
    )
}
