"use client"

import { motion } from "framer-motion"

interface BreathingOrbProps {
  active?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

export default function BreathingOrb({ 
  active = true, 
  size = "md", 
  className = "" 
}: BreathingOrbProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24", 
    lg: "w-32 h-32"
  }

  const innerSizeClasses = {
    sm: "w-12 h-12",
    md: "w-18 h-18",
    lg: "w-24 h-24"
  }

  const auraSizeClasses = {
    sm: "w-20 h-20",
    md: "w-28 h-28",
    lg: "w-36 h-36"
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {/* Outer Glowing Aura */}
      <motion.div
        className={`absolute ${auraSizeClasses[size]} rounded-full`}
        animate={active ? {
          opacity: [0.3, 0.8, 0.3],
          scale: [1, 1.1, 1],
        } : {
          opacity: 0.2,
          scale: 1,
        }}
        transition={{
          duration: 3,
          repeat: active ? Infinity : 0,
          ease: "easeInOut"
        }}
        style={{
          background: "radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, rgba(34, 197, 94, 0.1) 50%, transparent 100%)",
          filter: "blur(8px)"
        }}
      />

      {/* Main Orb Container */}
      <motion.div
        className={`relative ${sizeClasses[size]} rounded-full overflow-hidden`}
        animate={active ? {
          scale: [1, 1.05, 1],
        } : {
          scale: 1,
        }}
        transition={{
          duration: 2.5,
          repeat: active ? Infinity : 0,
          ease: "easeInOut"
        }}
      >
        {/* Moving Gradient Background */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={active ? {
            backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
          } : {
            backgroundPosition: "0% 0%",
          }}
          transition={{
            duration: 4,
            repeat: active ? Infinity : 0,
            ease: "linear"
          }}
          style={{
            background: `
              radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9) 0%, transparent 50%),
              radial-gradient(circle at 70% 70%, rgba(34, 197, 94, 0.3) 0%, transparent 50%),
              linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(226, 232, 240, 0.6) 50%, rgba(203, 213, 225, 0.4) 100%)
            `,
            backgroundSize: "200% 200%"
          }}
        />

        {/* Inner Glow Core */}
        <motion.div
          className={`absolute inset-0 ${innerSizeClasses[size]} rounded-full mx-auto my-auto`}
          animate={active ? {
            opacity: [0.6, 1, 0.6],
            scale: [0.8, 1, 0.8],
          } : {
            opacity: 0.7,
            scale: 0.9,
          }}
          transition={{
            duration: 2,
            repeat: active ? Infinity : 0,
            ease: "easeInOut",
            delay: 0.5
          }}
          style={{
            background: `
              radial-gradient(circle at center, 
                rgba(34, 197, 94, 0.8) 0%, 
                rgba(34, 197, 94, 0.4) 30%, 
                rgba(255, 255, 255, 0.6) 60%, 
                transparent 100%
              )
            `,
            filter: "blur(2px)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)"
          }}
        />

        {/* Breathing Pulse Ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-green-400/30"
          animate={active ? {
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.8, 0.3],
            borderColor: [
              "rgba(34, 197, 94, 0.3)",
              "rgba(34, 197, 94, 0.8)", 
              "rgba(34, 197, 94, 0.3)"
            ]
          } : {
            scale: 1,
            opacity: 0.2,
            borderColor: "rgba(34, 197, 94, 0.2)"
          }}
          transition={{
            duration: 2.8,
            repeat: active ? Infinity : 0,
            ease: "easeInOut",
            delay: 1
          }}
        />

        {/* Inner Breathing Ring */}
        <motion.div
          className="absolute inset-2 rounded-full border border-green-300/40"
          animate={active ? {
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.6, 0.2],
          } : {
            scale: 1,
            opacity: 0.1,
          }}
          transition={{
            duration: 2.2,
            repeat: active ? Infinity : 0,
            ease: "easeInOut",
            delay: 1.5
          }}
        />

        {/* Floating Particles */}
        {active && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-green-400/60 rounded-full"
                animate={{
                  y: [-10, 10, -10],
                  x: [-5, 5, -5],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.8
                }}
                style={{
                  top: `${30 + i * 20}%`,
                  left: `${40 + i * 10}%`,
                }}
              />
            ))}
          </>
        )}

        {/* Core Light */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={active ? {
            opacity: [0.4, 0.9, 0.4],
          } : {
            opacity: 0.5,
          }}
          transition={{
            duration: 1.8,
            repeat: active ? Infinity : 0,
            ease: "easeInOut"
          }}
          style={{
            background: `
              radial-gradient(circle at center, 
                rgba(34, 197, 94, 0.9) 0%, 
                rgba(34, 197, 94, 0.3) 40%, 
                transparent 70%
              )
            `,
            filter: "blur(1px)"
          }}
        />
      </motion.div>
    </div>
  )
}
