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
import AudioListener from "@/components/AudioListener"
import { useRouter } from "next/navigation"

export default function CapturePage() {
  const [isListening, setIsListening] = useState(false)
  const [hasListened, setHasListened] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sessionKey, setSessionKey] = useState("F MAJOR")
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false)
  const router = useRouter()

  const handleListen = () => {
    if (isListening) {
      // Stop listening
      setIsListening(false)
      // Reset to initial state - don't set hasListened
    } else {
      // Start listening
      setIsListening(true)

      // Set a timeout that can be cleared
      const timeoutId = setTimeout(() => {
        setIsListening(false)
        setHasListened(true)
        setTimeout(() => {
          router.push(
            `/results?query=${encodeURIComponent(searchQuery || "afrobeat")}&key=${encodeURIComponent(sessionKey)}`,
          )
        }, 1000)
      }, 8000)

      // Store timeout ID so we can clear it if user stops manually
      // You might want to use useRef for this in a real implementation
    }
  }

  const handleSearch = () => {
    if (searchQuery.trim() || hasListened) {
      router.push(
        `/results?query=${encodeURIComponent(searchQuery || "afrobeat")}&key=${encodeURIComponent(sessionKey)}`,
      )
    }
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
        className="relative z-10 flex items-center justify-between p-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center space-x-4">
          <motion.div
            className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center"
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
            <Home className="w-4 h-4 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 dark:from-green-400 dark:to-green-300 bg-clip-text text-transparent">
            ROOTS
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <SessionKeyButton value={sessionKey} onClick={() => setIsKeyModalOpen(true)} />
          <motion.button
            onClick={handleSettings}
            className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
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
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">What Afrobeat drums do you want?</h2>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Describe the drum pattern you want - or leave blank and let us listen to suggest perfect Afrobeat drum loops"
                disabled={isListening}
              />
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
            disabled={false} // Remove the hasListened disable condition
          />
        </motion.div>

        {/* Right Side - Find Samples Button */}
        <motion.div
          className="w-full lg:w-1/3 lg:pl-12"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <GradientButton onClick={handleSearch} disabled={isListening} className="w-full lg:w-auto">
            {isListening ? "LISTENING..." : "FIND SAMPLES"}
          </GradientButton>
          <div className="mt-4">
            <motion.button
              onClick={handleBrowse}
              disabled={isListening}
              className="w-full lg:w-auto px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-200 dark:hover:border-green-700 transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={!isListening ? { scale: 1.02 } : {}}
              whileTap={!isListening ? { scale: 0.98 } : {}}
            >
              Browse Afrobeat Drums
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* RootAI Audio Listener Section */}
      <motion.div
        className="relative z-10 py-16 px-6 bg-white/5 dark:bg-gray-900/5 backdrop-blur-sm"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 dark:from-green-400 dark:to-green-300 bg-clip-text text-transparent mb-4">
            RootAI Audio Analysis
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Let RootAI listen to your environment and recommend perfect Afrobeat drum loops
          </p>
          
          <AudioListener />
        </div>
      </motion.div>

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
