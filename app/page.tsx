"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Home, Settings } from "lucide-react"
import CaptureKnob from "@/components/CaptureKnob"
import SessionKeyButton from "@/components/SessionKeyButton"
import SessionKeyModal from "@/components/SessionKeyModal"
import SearchInput from "@/components/SearchInput"
import GradientButton from "@/components/GradientButton"
import ThemeToggle from "@/components/ThemeToggle"
import { useRouter } from "next/navigation"
import { useAudio } from "@/contexts/AudioContext"

export default function CapturePage() {
  const [isListening, setIsListening] = useState(false)
  const [hasListened, setHasListened] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sessionKey, setSessionKey] = useState("F MAJOR")
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false)
  const { analysisData, setAnalysisData } = useAudio()
  const router = useRouter()

  // Convert AudioBuffer to WAV blob
  const audioBufferToWavBlob = (audioBuffer: AudioBuffer): Blob => {
    const length = audioBuffer.length
    const sampleRate = audioBuffer.sampleRate
    const numberOfChannels = audioBuffer.numberOfChannels
    
    // Create a WAV file header
    const header = new ArrayBuffer(44)
    const view = new DataView(header)
    
    // WAV file header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    writeString(0, 'RIFF')
    view.setUint32(4, 36 + length * numberOfChannels * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * numberOfChannels * 2, true)
    view.setUint16(32, numberOfChannels * 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, length * numberOfChannels * 2, true)
    
    // Convert channels to interleaved audio
    const audioData = new ArrayBuffer(length * numberOfChannels * 2)
    const audioView = new Int16Array(audioData)
    
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        const sample = Math.max(-1, Math.min(1, channelData[i]))
        audioView[i * numberOfChannels + channel] = sample * 32767
      }
    }
    
    return new Blob([header, audioData], { type: 'audio/wav' })
  }

  const handleListen = () => {
    setIsListening(true)
  }

  const handleAnalysisComplete = (data: { detectedBPM: number; detectedKey: string; recommendations: any[]; recordedAudioBuffer: AudioBuffer }) => {
    console.log('Analysis completed on main page:', data)
    console.log('✅ Storing audio data in React Context (NOT localStorage!)')
    setAnalysisData(data)
    setHasListened(true)
    setIsListening(false)
    // Don't auto-navigate - let user decide when to go to results
  }

  const handleGoToResults = () => {
    if (analysisData) {
      // ✅ NEW: No localStorage - audio data stays in React Context!
      console.log('Navigating to results with audio data:', {
        hasBPM: !!analysisData.detectedBPM,
        hasKey: !!analysisData.detectedKey,
        hasAudioBuffer: !!analysisData.recordedAudioBuffer,
        duration: analysisData.recordedAudioBuffer?.duration
      })
      
      // Audio data is already in analysisData state, results page will access it
      router.push(
        `/results?query=${encodeURIComponent(searchQuery || "audio analysis")}&key=${encodeURIComponent(sessionKey)}&bpm=${analysisData.detectedBPM}&detectedKey=${analysisData.detectedKey}&recommendations=${encodeURIComponent(JSON.stringify(analysisData.recommendations))}`
      )
    }
  }

  const handleSearch = () => {
    // Allow search with just text description, no audio required
    const query = searchQuery.trim() || "afrobeat drums";
    
    console.log('🔍 Text-based search:', {
      query,
      sessionKey,
      hasAudio: hasListened
    });
    
    // Navigate to results with text query
    router.push(
      `/results?query=${encodeURIComponent(query)}&key=${encodeURIComponent(sessionKey)}`,
    )
  }

  const handleBrowse = () => {
    router.push("/browse")
  }

  const handleSettings = () => {
    router.push("/settings")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 relative overflow-hidden transition-colors duration-300">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-full blur-3xl"
          animate={{
            scale: isListening ? [1, 1.5, 1] : [1, 1.2, 1],
            rotate: [0, 180, 360],
            opacity: isListening ? [0.2, 0.4, 0.2] : [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: isListening ? 3 : 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-green-500/20 to-green-300/20 rounded-full blur-3xl"
          animate={{
            scale: isListening ? [1.2, 1.8, 1.2] : [1.2, 1, 1.2],
            rotate: [360, 180, 0],
            opacity: isListening ? [0.3, 0.5, 0.3] : [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: isListening ? 4 : 25,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />

        {isListening && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-green-500/5"
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        )}
      </div>

      {/* Header */}
      <motion.header
        className="relative z-10 flex items-center justify-between p-3 sm:p-4 lg:p-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
          <motion.div
            className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={
              isListening
                ? {
                    scale: [1, 1.1, 1],
                    boxShadow: [
                      "0 0 0 0 rgba(57, 160, 19, 0)",
                      "0 0 0 10px rgba(57, 160, 19, 0.1)",
                      "0 0 0 0 rgba(57, 160, 19, 0)",
                    ],
                  }
                : {}
            }
            transition={{
              duration: 1.5,
              repeat: isListening ? Number.POSITIVE_INFINITY : 0,
              ease: "easeInOut",
            }}
          >
            <Home className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </motion.div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 dark:from-green-400 dark:to-green-300 bg-clip-text text-transparent truncate">
            ROOTS
          </h1>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
          <ThemeToggle />
          <SessionKeyButton value={sessionKey} onClick={() => setIsKeyModalOpen(true)} />
          <motion.button
            onClick={handleSettings}
            className="p-1.5 sm:p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
          </motion.button>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center min-h-[calc(100vh-200px)] px-6 pb-16">
        {/* Left Side - Search Input */}
        <motion.div
          className="w-full lg:w-1/3 lg:pr-12 mb-8 lg:mb-0"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">What drums do you want?</h2>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                onEnter={handleSearch}
                placeholder="e.g., 'energetic 120 BPM afrobeat', 'mellow percussion loop', 'fast hi-hat pattern'..."
                disabled={isListening}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                💡 Describe in your own words or upload/record audio for AI matching
              </p>
            </div>
          </div>
        </motion.div>

        {/* Center - Listening Knob */}
        <motion.div
          className="flex-shrink-0 mb-8 lg:mb-0"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <CaptureKnob
            isListening={isListening}
            hasListened={hasListened}
            onListen={handleListen}
            disabled={false}
            onAnalysisComplete={handleAnalysisComplete}
          />
        </motion.div>

        {/* Right Side - Find Samples Button */}
        <motion.div
          className="w-full lg:w-1/3 lg:pl-12"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <GradientButton 
            onClick={hasListened ? handleGoToResults : handleSearch} 
            disabled={isListening} 
            className="w-full lg:w-auto"
          >
            {isListening ? "LISTENING..." : hasListened ? "VIEW RESULTS" : "FIND SAMPLES"}
          </GradientButton>
          <div className="mt-4">
            <motion.button
              onClick={handleBrowse}
              disabled={isListening}
              className="w-full lg:w-auto px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-200 dark:hover:border-green-700 transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={!isListening ? { scale: 1.02 } : {}}
              whileTap={!isListening ? { scale: 0.98 } : {}}
            >
              Browse  Drums
            </motion.button>
          </div>
        </motion.div>
      </div>


      {/* Session Key Modal */}
      <SessionKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        value={sessionKey}
        onChange={setSessionKey}
      />
    </div>
  )
}
