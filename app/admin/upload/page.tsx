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

        try {
            const formData = new FormData()

            // 1. Append Cover Image
            if (packDetails?.coverArt) {
                formData.append('coverImage', packDetails.coverArt)
            }

            // 2. Append Audio Files
            files.forEach(file => {
                formData.append('files', file)
            })

            // 3. Append Pack Details (exclude file objects)
            const { coverArt, coverPreview, ...cleanPackDetails } = packDetails
            formData.append('packDetails', JSON.stringify(cleanPackDetails))

            // 4. Append Samples Metadata (exclude file objects)
            const cleanSamples = finalSamples.map(({ file, ...rest }) => ({
                ...rest,
                fileName: file.name // Ensure we link back to the file
            }))
            formData.append('samplesMetadata', JSON.stringify(cleanSamples))

            // 5. Send Request
            const response = await fetch('/api/admin/create-pack', {
                method: 'POST',
                body: formData
            })

            const result = await response.json()

            if (!result.success) {
                throw new Error(result.error || 'Upload failed')
            }

            alert("Pack uploaded successfully!")
            router.push('/browse')

        } catch (error: any) {
            console.error('Upload Error:', error)
            alert(`Upload failed: ${error.message}`)
        } finally {
            setIsUploading(false)
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
            <div className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/5 bg-black/50 backdrop-blur-md">
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
            <div className="relative z-10 container mx-auto px-4 py-8 pb-32">
                <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                        <PackDetailsStep
                            key="step1"
                            onNext={handlePackDetailsNext}
                            initialData={packDetails}
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
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Loading Overlay */}
            {isUploading && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <h2 className="text-xl font-bold text-white">Uploading Pack...</h2>
                    <p className="text-white/40">Please wait while we process your files</p>
                </div>
            )}
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
