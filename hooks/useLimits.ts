'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { trackEvent } from '@/utils/analytics'

const DOWNLOAD_LIMIT = 5          // total lifetime downloads for free users
const AI_LIMIT = 5                // total AI searches for free users

function getAIKey(userId: string) {
  return `roots_limit_${userId}_ai`
}

function getAICount(userId: string): number {
  if (typeof window === 'undefined') return 0
  return Number(localStorage.getItem(getAIKey(userId)) || 0)
}

function setAICount(userId: string, value: number) {
  if (typeof window === 'undefined') return
  localStorage.setItem(getAIKey(userId), String(value))
}

interface LimitsState {
  canDownload: boolean
  canUseAI: boolean
  downloadCount: number
  aiCount: number
  downloadLimit: number
  incrementDownload: (sampleId: string, packId?: string) => Promise<boolean>   // returns true if within limit
  incrementAI: () => boolean
  refreshDownloadCount: () => Promise<void>
  loading: boolean
}

export function useLimits(isPro: boolean): LimitsState {
  const [userId, setUserId] = useState<string | null>(null)
  const [downloadCount, setDownloadCount] = useState(0)
  const [aiCount, setAiCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Fetch the server-side download count
  const fetchDownloadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/downloads/check')
      if (!res.ok) return
      const data = await res.json()
      setDownloadCount(data.downloadCount ?? 0)
    } catch (e) {
      console.error('Failed to fetch download count:', e)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function init() {
      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return

      if (user) {
        setUserId(user.id)
        setAiCount(getAICount(user.id))
      }

      // Fetch server-side download count
      await fetchDownloadCount()

      if (!cancelled) setLoading(false)
    }

    init()

    return () => { cancelled = true }
  }, [fetchDownloadCount])

  const incrementDownload = async (sampleId: string, packId?: string): Promise<boolean> => {
    if (isPro) return true

    // Re-check the server count before allowing (prevents race conditions)
    try {
      const res = await fetch('/api/downloads/check')
      if (res.ok) {
        const data = await res.json()
        if (data.downloadCount >= DOWNLOAD_LIMIT) {
          setDownloadCount(data.downloadCount)
          return false
        }
      }
    } catch (e) {
      // If server check fails, use local state as fallback
      if (downloadCount >= DOWNLOAD_LIMIT) return false
    }

    // Track the download event server-side (this is what the count is based on)
    await trackEvent('download', 'sample', sampleId, packId)

    // Refresh the count from server after recording
    await fetchDownloadCount()

    return true
  }

  const incrementAI = (): boolean => {
    if (isPro) return true
    const uid = userId || 'anon'
    if (getAICount(uid) >= AI_LIMIT) return false

    const newCount = getAICount(uid) + 1
    setAICount(uid, newCount)
    setAiCount(newCount)

    return true
  }

  return {
    canDownload: isPro || downloadCount < DOWNLOAD_LIMIT,
    canUseAI: isPro || aiCount < AI_LIMIT,
    downloadCount,
    aiCount,
    downloadLimit: DOWNLOAD_LIMIT,
    incrementDownload,
    incrementAI,
    refreshDownloadCount: fetchDownloadCount,
    loading,
  }
}
