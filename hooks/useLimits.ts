'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const DOWNLOAD_LIMIT = 5
const AI_LIMIT = 5

function getKey(userId: string, type: 'downloads' | 'ai') {
  return `roots_limit_${userId}_${type}`
}

function getCount(userId: string, type: 'downloads' | 'ai'): number {
  if (typeof window === 'undefined') return 0
  return Number(localStorage.getItem(getKey(userId, type)) || 0)
}

function increment(userId: string, type: 'downloads' | 'ai'): number {
  const newCount = getCount(userId, type) + 1
  localStorage.setItem(getKey(userId, type), String(newCount))
  return newCount
}

interface LimitsState {
  canDownload: boolean
  canUseAI: boolean
  downloadCount: number
  aiCount: number
  incrementDownload: () => boolean   // returns true if within limit
  incrementAI: () => boolean
  loading: boolean
}

export function useLimits(isPro: boolean): LimitsState {
  const [userId, setUserId] = useState<string | null>(null)
  const [downloadCount, setDownloadCount] = useState(0)
  const [aiCount, setAiCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        setDownloadCount(getCount(user.id, 'downloads'))
        setAiCount(getCount(user.id, 'ai'))
      }
      setLoading(false)
    })
  }, [])

  const incrementDownload = (): boolean => {
    if (isPro || !userId) return true
    if (downloadCount >= DOWNLOAD_LIMIT) return false
    const newCount = increment(userId, 'downloads')
    setDownloadCount(newCount)
    return true
  }

  const incrementAI = (): boolean => {
    if (isPro || !userId) return true
    if (aiCount >= AI_LIMIT) return false
    const newCount = increment(userId, 'ai')
    setAiCount(newCount)
    return true
  }

  return {
    canDownload: isPro || downloadCount < DOWNLOAD_LIMIT,
    canUseAI: isPro || aiCount < AI_LIMIT,
    downloadCount,
    aiCount,
    incrementDownload,
    incrementAI,
    loading,
  }
}
