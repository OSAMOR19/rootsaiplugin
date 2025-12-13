import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, CheckCircle, XCircle, Trash2, FileAudio } from "lucide-react"

interface FilesUploadStepProps {
    onNext: (files: File[]) => void
    onBack: () => void
    initialFiles?: File[]
}

export default function FilesUploadStep({ onNext, onBack, initialFiles = [] }: FilesUploadStepProps) {
    const [files, setFiles] = useState<File[]>(initialFiles)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const droppedFiles = Array.from(e.dataTransfer.files).filter(file =>
            file.type.startsWith('audio/')
        )
        setFiles(prev => [...prev, ...droppedFiles])
    }

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).filter(file =>
                file.type.startsWith('audio/')
            )
            setFiles(prev => [...prev, ...newFiles])
        }
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto"
        >
            {files.length === 0 ? (
                // Empty State / Drop Zone
                <div
                    className={`h-[60vh] flex flex-col items-center justify-center border-2 border-dashed rounded-3xl transition-all ${isDragging ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-white/20'
                        }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8">
                        <Upload className="w-10 h-10 text-white/40" />
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-2">Drag and drop your WAV files here</h3>
                    <p className="text-white/20 mb-8">OR</p>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-bold transition-colors"
                    >
                        Select files
                    </button>


                    <p className="mt-8 text-white/40 text-sm">
                        Uploading for the first time? <a href="#" className="text-white underline">Read our Seller Handbook</a>
                    </p>
                </div>
            ) : (
                // File List
                <div>
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-white">
                            {files.length}/250 files uploaded
                        </h3>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                        >
                            Add more files
                        </button>
                    </div>

                    <div className="space-y-2">
                        <AnimatePresence>
                            {files.map((file, index) => (
                                <motion.div
                                    key={`${file.name}-${index}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <FileAudio className="w-5 h-5 text-white/40" />
                                        <span className="text-white font-medium">{file.name}</span>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <span className="text-green-400 text-sm font-medium flex items-center gap-2">
                                            100% uploaded <CheckCircle className="w-4 h-4" />
                                        </span>
                                        <button
                                            onClick={() => removeFile(index)}
                                            className="text-white/20 hover:text-rose-400 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            <input
                type="file"
                multiple
                accept="audio/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileInput}
            />

            {/* Footer Action */}
            <div className="fixed bottom-0 left-0 w-full p-6 bg-black/80 backdrop-blur-xl border-t border-white/10 flex justify-between z-50 px-12">
                <button
                    onClick={onBack}
                    className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold transition-all"
                >
                    Back
                </button>

                <button
                    onClick={() => onNext(files)}
                    disabled={files.length === 0}
                    className="px-8 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-white/10 disabled:text-white/20 text-white rounded-full font-bold transition-all"
                >
                    Continue
                </button>
            </div>
        </motion.div>
    )
}
