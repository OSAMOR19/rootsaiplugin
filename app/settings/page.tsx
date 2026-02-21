"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Moon, Sun, Monitor, Volume2, Headphones, SettingsIcon, Shield } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const router = useRouter()
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system")
  const [audioOutput, setAudioOutput] = useState("default")
  const [masterVolume, setMasterVolume] = useState(75)
  const [sampleRate, setSampleRate] = useState("44100")
  const [bufferSize, setBufferSize] = useState("512")

  useEffect(() => {
    // Apply theme
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else if (theme === "light") {
      root.classList.remove("dark")
    } else {
      // System preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      if (prefersDark) {
        root.classList.add("dark")
      } else {
        root.classList.remove("dark")
      }
    }
  }, [theme])

  const handleBack = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 transition-colors duration-300">
      {/* Header */}
      <motion.header
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={handleBack}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 dark:from-green-400 dark:to-green-300 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Customize your ROOTS experience</p>
            </div>
          </div>
          <SettingsIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appearance Settings */}
          <motion.div
            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
              <Monitor className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
              Appearance
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "light", icon: Sun, label: "Light" },
                    { value: "dark", icon: Moon, label: "Dark" },
                    { value: "system", icon: Monitor, label: "System" },
                  ].map(({ value, icon: Icon, label }) => (
                    <motion.button
                      key={value}
                      onClick={() => setTheme(value as any)}
                      className={`p-3 rounded-lg border transition-all ${
                        theme === value
                          ? "bg-green-500 text-white border-green-500 shadow-lg"
                          : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-200 dark:hover:border-green-700"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-sm font-medium">{label}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Glassmorphism Effects
                </label>
                <motion.button
                  className="w-full p-3 bg-gradient-to-r from-green-500/20 to-green-600/20 backdrop-blur-sm border border-green-200 dark:border-green-700 rounded-lg text-green-700 dark:text-green-300 hover:from-green-500/30 hover:to-green-600/30 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Enhanced Visual Effects Enabled
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Audio Settings */}
          <motion.div
            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
              <Headphones className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
              Audio
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Master Volume</label>
                <div className="flex items-center space-x-3">
                  <Volume2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={masterVolume}
                    onChange={(e) => setMasterVolume(Number.parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-10">{masterVolume}%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Audio Output</label>
                <select
                  value={audioOutput}
                  onChange={(e) => setAudioOutput(e.target.value)}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 dark:text-gray-300"
                >
                  <option value="default">Default Audio Device</option>
                  <option value="headphones">Headphones</option>
                  <option value="speakers">Speakers</option>
                  <option value="usb">USB Audio Interface</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sample Rate</label>
                  <select
                    value={sampleRate}
                    onChange={(e) => setSampleRate(e.target.value)}
                    className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 dark:text-gray-300 text-sm"
                  >
                    <option value="44100">44.1 kHz</option>
                    <option value="48000">48 kHz</option>
                    <option value="96000">96 kHz</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Buffer Size</label>
                  <select
                    value={bufferSize}
                    onChange={(e) => setBufferSize(e.target.value)}
                    className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 dark:text-gray-300 text-sm"
                  >
                    <option value="128">128 samples</option>
                    <option value="256">256 samples</option>
                    <option value="512">512 samples</option>
                    <option value="1024">1024 samples</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Performance Settings */}
          <motion.div
            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Performance</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-800 dark:text-gray-200">Hardware Acceleration</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Use GPU for audio processing</div>
                </div>
                <motion.button
                  className="w-12 h-6 bg-green-500 rounded-full p-1 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="w-4 h-4 bg-white rounded-full shadow-sm"
                    animate={{ x: 20 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </motion.button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-800 dark:text-gray-200">Reduce Animations</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Improve performance on slower devices</div>
                </div>
                <motion.button
                  className="w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full p-1 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* About */}
          <motion.div
            className="bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-xl rounded-2xl p-6 border border-green-200/50 dark:border-green-700/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">About ROOTS</h2>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>Version 1.0.0</p>
              <p>AI-powered Afrobeat sample discovery</p>
              <p>Built with Next.js and Framer Motion</p>
            </div>
            <motion.button
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Check for Updates
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
