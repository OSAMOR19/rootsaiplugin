"use client"

import AudioListener from "@/components/AudioListener"

export default function AudioDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-green-600 to-green-800 dark:from-green-400 dark:to-green-300 bg-clip-text text-transparent">
          RootAI Audio Analysis Demo
        </h1>
        
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-8 border border-gray-200 dark:border-gray-700">
          <AudioListener />
        </div>
      </div>
    </div>
  )
}