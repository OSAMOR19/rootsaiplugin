"use client"

import { motion } from "framer-motion"
import { Play } from "lucide-react"

interface CaptureKnobProps {
  isListening: boolean
  hasListened: boolean
  onListen: () => void
  disabled?: boolean
}

export default function CaptureKnob({ isListening, hasListened, onListen, disabled }: CaptureKnobProps) {
  return (
    <div className="relative">
      {/* Rotating energy rings */}
      <motion.div
        className="absolute inset-0 w-80 h-80 rounded-full"
        animate={
          isListening
            ? {
                rotate: [0, 360],
              }
            : {}
        }
        transition={{
          duration: 8,
          repeat: isListening ? Number.POSITIVE_INFINITY : 0,
          ease: "linear",
        }}
        style={{
          background: isListening
            ? "conic-gradient(from 0deg, transparent, rgba(57, 160, 19, 0.3), transparent, rgba(34, 197, 94, 0.3), transparent)"
            : "none",
        }}
      />

      <motion.div
        className="absolute inset-4 w-72 h-72 rounded-full"
        animate={
          isListening
            ? {
                rotate: [360, 0],
              }
            : {}
        }
        transition={{
          duration: 6,
          repeat: isListening ? Number.POSITIVE_INFINITY : 0,
          ease: "linear",
        }}
        style={{
          background: isListening
            ? "conic-gradient(from 180deg, transparent, rgba(74, 222, 128, 0.2), transparent, rgba(57, 160, 19, 0.2), transparent)"
            : "none",
        }}
      />

      {/* Main sphere with enhanced 3D effect */}
      <motion.button
        className="relative w-64 h-64 rounded-full group overflow-hidden"
        onClick={onListen}
        disabled={disabled && !isListening}
        whileHover={!disabled || isListening ? { scale: 1.05 } : {}}
        whileTap={!disabled || isListening ? { scale: 0.95 } : {}}
        style={{
          background: `
            radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8) 0%, transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(0, 0, 0, 0.1) 0%, transparent 50%),
            linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)
          `,
          boxShadow: isListening
            ? `
              inset 0 0 0 1px rgba(57, 160, 19, 0.5),
              inset 0 0 60px rgba(57, 160, 19, 0.2),
              inset 0 0 0 8px rgba(57, 160, 19, 0.1),
              0 20px 60px rgba(57, 160, 19, 0.3),
              0 8px 25px rgba(57, 160, 19, 0.2),
              0 0 0 1px rgba(57, 160, 19, 0.3),
              0 0 100px rgba(57, 160, 19, 0.4)
            `
            : `
              inset 0 0 0 1px rgba(255, 255, 255, 0.3),
              inset 0 0 60px rgba(255, 255, 255, 0.1),
              inset 0 0 0 8px rgba(0, 0, 0, 0.02),
              0 20px 60px rgba(0, 0, 0, 0.15),
              0 8px 25px rgba(0, 0, 0, 0.1),
              0 0 0 1px rgba(0, 0, 0, 0.05)
            `,
        }}
      >
        {/* Listening visualization bars */}
        {isListening && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-end space-x-1 h-20">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-green-400 rounded-full"
                  animate={{
                    height: ["20%", "80%", "40%", "90%", "30%"],
                    opacity: [0.6, 1, 0.8, 1, 0.7],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: i * 0.1,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Center icon */}
        <motion.div
          className={`absolute inset-0 flex items-center justify-center ${isListening ? "opacity-100" : "opacity-100"}`}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className={`w-20 h-20 rounded-full flex items-center justify-center ${
              hasListened
                ? "bg-gradient-to-br from-green-400 to-green-600"
                : isListening
                  ? "bg-gradient-to-br from-red-400 to-red-600"
                  : "bg-gradient-to-br from-green-500 to-green-700"
            } shadow-2xl`}
            whileHover={{ scale: 1.1 }}
          >
            {hasListened ? (
              <Play className="w-10 h-10 text-white ml-1" />
            ) : isListening ? (
              <div className="w-6 h-6 bg-white rounded-sm" />
            ) : (
              <Play className="w-10 h-10 text-green-100 ml-1" />
            )}
          </motion.div>
        </motion.div>

        {/* Circular text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 256 256">
            <defs>
              <path id="circle-path" d="M 128,128 m -110,0 a 110,110 0 1,1 220,0 a 110,110 0 1,1 -220,0" />
            </defs>
            <motion.text
              className="text-xs font-light fill-gray-400 tracking-widest opacity-60"
              animate={
                isListening
                  ? {
                      opacity: [0.6, 0.9, 0.6],
                    }
                  : {}
              }
              transition={{
                duration: 2,
                repeat: isListening ? Number.POSITIVE_INFINITY : 0,
                ease: "easeInOut",
              }}
            >
              <textPath href="#circle-path" startOffset="0%">
                {hasListened
                  ? "AUDIO ANALYZED • SAMPLES READY • AUDIO ANALYZED • SAMPLES READY • "
                  : isListening
                    ? "CLICK TO STOP LISTENING • ANALYZING AUDIO • CLICK TO STOP LISTENING • "
                    : "START LISTENING TO YOUR TRACK • START LISTENING TO YOUR TRACK • "}
              </textPath>
            </motion.text>
          </svg>
        </div>

        {/* Inner glow effect */}
        <motion.div
          className="absolute inset-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: "radial-gradient(circle, rgba(57, 160, 19, 0.1) 0%, transparent 70%)",
          }}
        />

        {/* Listening state overlay */}
        {isListening && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(57, 160, 19, 0.1) 0%, transparent 70%)",
            }}
            animate={{
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        )}
      </motion.button>

      {/* Listening status text */}
      {isListening && (
        <motion.div
          className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <motion.p
            className="text-green-600 font-medium text-lg"
            animate={{
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            Listening to your track...
          </motion.p>
          <p className="text-gray-500 text-sm mt-1">Click the knob to stop listening</p>
        </motion.div>
      )}
    </div>
  )
}
