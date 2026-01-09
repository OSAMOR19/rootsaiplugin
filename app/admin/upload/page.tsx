"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import PackDetailsStep from "@/components/admin/PackDetailsStep"
import FilesUploadStep from "@/components/admin/FilesUploadStep"
import EditSamplesStep from "@/components/admin/EditSamplesStep"

export default function AdminUploadPage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(1)

    // Data State
    const [packDetails, setPackDetails] = useState<any>(null)
    const [files, setFiles] = useState<File[]>([])
    const [samples, setSamples] = useState<any[]>([])

    // Success State
    const [showSuccess, setShowSuccess] = useState(false)

    const handlePackDetailsNext = (data: any) => {
        setPackDetails(data)
        setCurrentStep(2)
    }

    const handleFilesNext = (uploadedFiles: File[]) => {
        setFiles(uploadedFiles)
        setCurrentStep(3)
    }

    const [isUploading, setIsUploading] = useState(false)

    const handleFinalSubmit = async (finalSamples: any[]) => {
        setSamples(finalSamples)
        setIsUploading(true)
        setShowSuccess(false)

        try {
            // 1. Upload Cover Image
            let coverImageUrl = null
            if (packDetails?.coverArt) {
                const timestamp = Date.now()
                const safeNameBase = packDetails.title.replace(/[^a-z0-9]/gi, '_')
                const imageExt = packDetails.coverArt.name.split('.').pop()
                const imagePath = `packs/${timestamp}_${safeNameBase}_cover.${imageExt}`

                // Upload util
                const { uploadFileToSupabase } = await import('@/lib/upload-utils')
                coverImageUrl = await uploadFileToSupabase(packDetails.coverArt, imagePath)
            }

            // 2. Upload Audio Files & Stems
            const { uploadFileToSupabase } = await import('@/lib/upload-utils')

            const processedSamples = []

            // Loop through all samples (metadata)
            // match with actual files in `files` state or `stemsFiles`
            for (const sample of finalSamples) {
                // Find main file
                const audioFile = sample.file // EditSamplesStep attaches actual File object
                let audioUrl = null
                let duration = sample.duration || '0:00'

                if (audioFile) {
                    const timestamp = Date.now()
                    const safeNameBase = sample.name.replace(/[^a-z0-9]/gi, '_')
                    const audioExt = audioFile.name.split('.').pop()
                    const audioPath = `samples/${packDetails.title.replace(/[^a-z0-9]/gi, '_')}/${timestamp}_${safeNameBase}.${audioExt}`

                    // Upload
                    audioUrl = await uploadFileToSupabase(audioFile, audioPath)

                    // Helper to get duration? Client-side duration parsing is tricky without reading entire buffer
                    // For now pass duration if available or let backend handle it? 
                    // Wait: backend used "music-metadata". We can't use that in browser easily (Node lib).
                    // We can accept "0:00" for now or use basic Audio element to check duration (async).
                    // Or just skip duration until future improvement.
                    // The backend previously calculated duration. Client side can do:
                    try {
                        const audioObj = new Audio(URL.createObjectURL(audioFile));
                        await new Promise((resolve) => {
                            audioObj.onloadedmetadata = () => {
                                const m = Math.floor(audioObj.duration / 60);
                                const s = Math.floor(audioObj.duration % 60);
                                duration = `${m}:${s.toString().padStart(2, '0')}`;
                                resolve(true);
                            };
                            audioObj.onerror = () => resolve(false);
                        });
                    } catch (e) { console.warn("Duration parse failed", e) }
                }

                // Process Stems
                const processedStems = []
                if (sample.stemsFiles && sample.stemsFiles.length > 0) {
                    for (const stem of sample.stemsFiles) {
                        const stemFile = stem.file
                        if (stemFile) {
                            const timestamp = Date.now()
                            const safeNameBase = sample.name.replace(/[^a-z0-9]/gi, '_')
                            const stemExt = stemFile.name.split('.').pop()
                            const stemPath = `samples/${packDetails.title.replace(/[^a-z0-9]/gi, '_')}/stems/${timestamp}_${safeNameBase}_${stem.name.replace(/[^a-z0-9]/gi, '_')}.${stemExt}`

                            const stemUrl = await uploadFileToSupabase(stemFile, stemPath)

                            processedStems.push({
                                name: stem.name,
                                url: stemUrl,
                                size: stemFile.size,
                                filename: stemFile.name
                            })
                        }
                    }
                }

                processedSamples.push({
                    name: sample.name,
                    filename: audioFile?.name,
                    category: packDetails.title,
                    bpm: sample.tempo ? parseInt(sample.tempo) : 0,
                    key: sample.key,
                    time_signature: sample.timeSignature || '4/4',
                    genres: sample.genres || [],
                    instruments: sample.instruments || [],
                    drum_type: sample.drumType || '',
                    keywords: sample.keywords || [],
                    audio_url: audioUrl,
                    duration: duration,
                    is_featured: sample.featured || false,
                    stems: processedStems
                })
            }

            // 3. Send JSON Payload
            const payload = {
                packDetails: {
                    ...packDetails,
                    cover_image: coverImageUrl
                },
                samples: processedSamples
            }

            const response = await fetch('/api/admin/create-pack', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const result = await response.json()

            if (!result.success) {
                throw new Error(result.error || 'Upload failed')
            }

            // Success!
            setIsUploading(false)
            setShowSuccess(true)

        } catch (error: any) {
            setIsUploading(false)
            console.error('Upload Error:', error)
            alert(`Upload failed: ${error.message}`)
        }
    }

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans">
            {/* Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-green-900/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-900/10 rounded-full blur-[150px]" />
            </div>

            {/* Top Navigation Bar */}
            <div className={`relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/5 bg-black/50 backdrop-blur-md transition-opacity duration-300 ${isUploading || showSuccess ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/admin/dashboard')}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-white/60" />
                    </button>
                    <h1 className="text-xl font-bold text-white">
                        {packDetails?.title || "Create Pack"}
                    </h1>
                    {currentStep === 1 && <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/40">Requires user update</span>}
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-4">
                    <StepIndicator step={1} currentStep={currentStep} label="Pack details" />
                    <StepIndicator step={2} currentStep={currentStep} label="Files" />
                    <StepIndicator step={3} currentStep={currentStep} label="Edit samples" />
                </div>

                <div className="w-[200px] flex justify-end">
                    {/* Placeholder for right side actions if needed */}
                </div>
            </div>

            {/* Main Content Area */}
            <div className={`relative z-10 container mx-auto px-4 py-8 pb-32 transition-opacity duration-300 ${isUploading || showSuccess ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                        <PackDetailsStep
                            key="step1"
                            onNext={handlePackDetailsNext}
                            data={packDetails}
                        />
                    )}
                    {currentStep === 2 && (
                        <FilesUploadStep
                            key="step2"
                            onNext={handleFilesNext}
                            onBack={() => setCurrentStep(1)}
                            initialFiles={files}
                        />
                    )}
                    {currentStep === 3 && (
                        <EditSamplesStep
                            key="step3"
                            files={files}
                            onBack={() => setCurrentStep(2)}
                            onSubmit={handleFinalSubmit}
                            defaultCategory={packDetails?.title}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Global Overlay for Uploading/Success */}
            <AnimatePresence>
                {(isUploading || showSuccess) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                    >
                        {isUploading ? (
                            <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full">
                                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6" />
                                <h2 className="text-2xl font-bold text-white mb-2">Uploading Pack...</h2>
                                <p className="text-white/40 text-center text-sm">Please wait while we process your files and create the pack.</p>
                            </div>
                        ) : showSuccess ? (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-[#0a0a0a] border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-md w-full relative overflow-hidden"
                            >
                                {/* Success Gradient Background */}
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-500" />

                                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                                    <Check className="w-10 h-10 text-green-500" />

                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Pack Published!</h2>
                                <p className="text-white/40 text-center mb-8">
                                    Your pack <strong className="text-white">"{packDetails?.title}"</strong> has been successfully uploaded and is now live.
                                </p>

                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <button
                                        onClick={() => router.push('/browse')}
                                        className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors border border-white/5"
                                    >
                                        View in Browse
                                    </button>
                                    <button
                                        onClick={() => router.push('/admin/dashboard')}
                                        className="px-6 py-3 bg-white text-black hover:bg-gray-200 font-bold rounded-xl transition-colors"
                                    >
                                        Admin Dashboard
                                    </button>
                                </div>
                            </motion.div>
                        ) : null}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function StepIndicator({ step, currentStep, label }: { step: number, currentStep: number, label: string }) {
    const isActive = currentStep === step
    const isCompleted = currentStep > step

    return (
        <div className={`flex items-center gap-2 ${isActive ? 'text-white' : 'text-white/40'}`}>
            <div className={`
        w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors
        ${isActive ? 'bg-white text-black' : isCompleted ? 'bg-green-500 text-black' : 'bg-white/10 text-white'}
      `}>
                {isCompleted ? <Check className="w-3 h-3" /> : step}
            </div>
            <span className="text-sm font-medium">{label}</span>
            {step < 3 && <div className="w-8 h-[1px] bg-white/10 mx-2" />}
        </div>
    )
}
