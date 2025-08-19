"use client"

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Music, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SidebarProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

const categories = [
  { id: 'all', name: 'All Drums & Loops', icon: Music },
  { id: 'full-drums', name: 'Full Drum Loops', icon: Music },
  { id: 'top-loops', name: 'Top Loops', icon: Music },
  { id: 'kick-loops', name: 'Kick Loops', icon: Music },
  { id: 'shaker-loops', name: 'Shaker Loops', icon: Music },
  { id: 'fills-rolls', name: 'Fills & Rolls', icon: Music },
  { id: 'percussions', name: 'Percussions', icon: Music }
]

export default function Sidebar({ selectedCategory, onCategoryChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="relative">
             {/* Toggle Button */}
       <button
         onClick={() => setIsCollapsed(!isCollapsed)}
         className="absolute -right-3 top-4 z-20 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
       >
         {isCollapsed ? (
           <ChevronRight className="w-3 h-3 text-gray-600 dark:text-gray-400" />
         ) : (
           <ChevronLeft className="w-3 h-3 text-gray-600 dark:text-gray-400" />
         )}
       </button>

       {/* Sidebar */}
       <AnimatePresence>
         {!isCollapsed && (
           <motion.div
             initial={{ width: 0, opacity: 0 }}
             animate={{ width: 280, opacity: 1 }}
             exit={{ width: 0, opacity: 0 }}
             transition={{ duration: 0.3, ease: "easeInOut" }}
             className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-r border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden"
           >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Filter className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Categories
                </h2>
              </div>

              {/* Categories List */}
              <div className="space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon
                  return (
                    <button
                      key={category.id}
                      onClick={() => onCategoryChange(category.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                        selectedCategory === category.id
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${
                        selectedCategory === category.id 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`} />
                      <span className="text-sm font-medium">{category.name}</span>
                    </button>
                  )
                })}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {categories.length} categories available
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

             {/* Collapsed State */}
       {isCollapsed && (
         <motion.div
           initial={{ width: 0 }}
           animate={{ width: 60 }}
           exit={{ width: 0 }}
           transition={{ duration: 0.3, ease: "easeInOut" }}
           className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-r border-gray-200 dark:border-gray-700 shadow-lg"
         >
           <div className="p-4">
             <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mx-auto">
               <Filter className="w-4 h-4 text-white" />
             </div>
           </div>
         </motion.div>
       )}
    </div>
  )
}
