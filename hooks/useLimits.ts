'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const DOWNLOAD_LIMIT = 5          // total lifetime downloads for free users
const AI_LIMIT = 5                // total AI searches for free users
const DOWNLOADS_PER_SEARCH = 1   // max downloads allowed per search session

function getKey(userId: string, type: 'downloads' | 'ai' | 'session_downloads') {
  return `roots_limit_${userId}_${type}`
}

function getCount(userId: string, type: 'downloads' | 'ai' | 'session_downloads'): number {
  if (typeof window === 'undefined') return 0
  return Number(localStorage.getItem(getKey(userId, type)) || 0)
}

function setCount(userId: string, type: 'downloads' | 'ai' | 'session_downloads', value: number) {
  if (typeof window === 'undefined') return
  localStorage.setItem(getKey(userId, type), String(value))
}

function increment(userId: string, type: 'downloads' | 'ai' | 'session_downloads'): number {
  const newCount = getCount(userId, type) + 1
  setCount(userId, type, newCount)
  return newCount
}

interface LimitsState {
  canDownload: boolean
  canUseAI: boolean
  downloadCount: number
  aiCount: number
  sessionDownloadCount: number   // downloads used in the current search session
  incrementDownload: () => boolean   // returns true if within limit
  incrementAI: () => boolean
  loading: boolean
}

export function useLimits(isPro: boolean): LimitsState {
  const [userId, setUserId] = useState<string | null>(null)
  const [downloadCount, setDownloadCount] = useState(0)
  const [aiCount, setAiCount] = useState(0)
  const [sessionDownloadCount, setSessionDownloadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        setDownloadCount(getCount(user.id, 'downloads'))
        setAiCount(getCount(user.id, 'ai'))
        setSessionDownloadCount(getCount(user.id, 'session_downloads'))
      }
      setLoading(false)
    })
  }, [])

  const incrementDownload = (): boolean => {
    if (isPro) return true
    const uid = userId || 'anon'

    // Block if global download cap reached
    if (getCount(uid, 'downloads') >= DOWNLOAD_LIMIT) return false

    // Block if already downloaded once in this search session
    if (getCount(uid, 'session_downloads') >= DOWNLOADS_PER_SEARCH) return false

    const newGlobal = increment(uid, 'downloads')
    const newSession = increment(uid, 'session_downloads')
    setDownloadCount(newGlobal)
    setSessionDownloadCount(newSession)
    return true
  }

  const incrementAI = (): boolean => {
    if (isPro) return true
    const uid = userId || 'anon'
    if (getCount(uid, 'ai') >= AI_LIMIT) return false

    const newCount = increment(uid, 'ai')
    setAiCount(newCount)

    // Reset session download counter so the user gets 1 fresh download for this new search
    setCount(uid, 'session_downloads', 0)
    setSessionDownloadCount(0)

    return true
  }

  return {
    canDownload: isPro || (downloadCount < DOWNLOAD_LIMIT && sessionDownloadCount < DOWNLOADS_PER_SEARCH),
    canUseAI: isPro || aiCount < AI_LIMIT,
    downloadCount,
    aiCount,
    sessionDownloadCount,
    incrementDownload,
    incrementAI,
    loading,
  }
}
