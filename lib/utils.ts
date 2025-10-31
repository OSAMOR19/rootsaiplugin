import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Extract BPM from a filename or label like "... 113BPM.wav" or "113 BPM"
export function extractBPMFromString(source: string | undefined | null): number | null {
  if (!source) return null
  const match = source.match(/(\d{2,3})\s*BPM/i)
  if (match) {
    const bpm = parseInt(match[1], 10)
    if (!Number.isNaN(bpm) && bpm > 40 && bpm < 300) return bpm
  }
  return null
}

// Format seconds into m:ss (e.g., 0:12, 3:05)
export function formatTimeSeconds(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null || !Number.isFinite(totalSeconds)) return "0:00"
  const clamped = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(clamped / 60)
  const seconds = clamped % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}