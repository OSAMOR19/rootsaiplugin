"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import EditSamplesStep from "@/components/admin/EditSamplesStep"
import { useSamples } from "@/hooks/useSamples"
import { X, Check } from "lucide-react"

interface PageProps {
    params: Promise<{ id: string }>
}

export default function EditPackPage({ params }: PageProps) {
    const router = useRouter()
    const resolvedParams = use(params)
    const packId = resolvedParams.id

    // In a real app we'd fetch pack details by ID, but since we group by category name...
    const categoryName = decodeURIComponent(packId)

    // Fetch existing samples
    const { samples: allSamples, loading } = useSamples({ autoFetch: true })
    const [packSamples, setPackSamples] = useState<any[]>([])
    const [files, setFiles] = useState<File[]>([])
    const [isLoadingData, setIsLoadingData] = useState(true)
    const [currentStep, setCurrentStep] = useState(3) // Start at step 3
    const [showSuccessModal, setShowSuccessModal] = useState(false)

    useEffect(() => {
        if (!loading && allSamples.length > 0) {
            // Filter samples belonging to this pack/category
            const filtered = allSamples.filter(s => s.category === categoryName)

            // Convert database samples back to the format EditSamplesStep expects
            // Note: Since we don't have the original File objects, we'll create dummy files 
            // This allows the UI to render, but re-uploading would require real files if we were adding new ones.
            // For editing METADATA of existing files, this is sufficient.

            const converted = filtered.map(s => {
                // Create a dummy file object to satisfy the interface
                const dummyFile = new File([""], s.filename || s.name, { type: "audio/wav" })
                Object.defineProperty(dummyFile, 'r2_url', { value: s.audioUrl || s.url }) // custom prop to track url

                return {
                    id: s.id,
                    file: dummyFile,
                    name: s.name,
                    tempo: s.bpm?.toString() || "",
                    key: typeof s.key === 'string' ? s.key : "",
                    genres: s.genres || [],
                    instruments: s.instruments || [],
                    drumType: s.drumType || "",
                    category: s.category || "Uncategorized",
                    keywords: s.keywords || [],
                    selected: false,
                    featured: s.featured || false
                }
            })

            setPackSamples(converted)

            // We also need to set the 'files' prop for EditSamplesStep
            setFiles(converted.map(s => s.file))
            setIsLoadingData(false)
        }
    }, [allSamples, loading, categoryName])

    const handleBack = () => {
        router.push('/admin/packs')
    }

    const handleSubmit = async (updatedSamples: any[]) => {
        // Here we would call an API to update the metadata in metadata.json
        // Since we are editing existing R2 files, we don't need to re-upload audio

        try {
            const formData = new FormData()

            const cleanSamples = updatedSamples.map(({ file, ...rest }) => ({
                ...rest,
                fileName: file.name
            }))

            formData.append('samplesMetadata', JSON.stringify(cleanSamples))
            formData.append('category', categoryName) // Identify which pack to update

            const response = await fetch('/api/admin/update-pack', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) throw new Error('Update failed')

            setShowSuccessModal(true)
            // router.push('/admin/packs') // handled by modal now

        } catch (error) {
            console.error('Update error:', error)
            alert('Failed to update pack')
        }
    }

    if (loading || isLoadingData) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans">
            {/* Background Elements - reused for consistency */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-green-900/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-900/10 rounded-full blur-[150px]" />
            </div>

            {/* Top Navigation Bar - Reused from Upload Page */}
            <div className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/5 bg-black/50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-white/60" />
                    </button>
                    <h1 className="text-xl font-bold text-white">
                        {categoryName} <span className="text-white/40 font-normal text-sm ml-2">(Editing)</span>
                    </h1>
                </div>

                {/* Stepper - Hardcoded visually to look like we are on step 3 */}
                <div className="flex items-center gap-4">
                    <StepIndicator step={1} currentStep={3} label="Pack details" />
                    <StepIndicator step={2} currentStep={3} label="Files" />
                    <StepIndicator step={3} currentStep={3} label="Edit samples" />
                </div>

                <div className="w-[200px] flex justify-end">
                    {/* Placeholder */}
                </div>
            </div>

            <div className="relative z-10 container mx-auto px-4 py-8 pb-32">
                {/* We only render step 3 here because the user requested it to 'already be in step 3' */}
                <EditSamplesStep
                    files={files}
                    initialData={packSamples}
                    onBack={handleBack}
                    onSubmit={handleSubmit}
                />
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                    <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6">
                            <Check className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Pack Updated!</h3>
                        <p className="text-white/60 mb-8">
                            All updates have been saved successfully and are now live.
                        </p>
                        <button
                            onClick={() => router.push('/admin/packs')}
                            className="w-full py-3 bg-white text-black hover:bg-green-400 rounded-lg font-bold transition-all"
                        >
                            Back to Packs
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

function StepIndicator({ step, currentStep, label }: { step: number, currentStep: number, label: string }) {
    const isActive = currentStep === step
    const isCompleted = currentStep > step // For editing, we treat 1 & 2 as completed

    return (
        <div className={`flex items-center gap-2 ${isActive ? 'text-white' : 'text-white/40'}`}>
            <div className={`
        w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors
        ${isActive ? 'bg-white text-black' : isCompleted || step < 3 ? 'bg-green-500 text-black' : 'bg-white/10 text-white'}
      `}>
                {isCompleted || step < 3 ? <Check className="w-3 h-3" /> : step}
            </div>
            <span className="text-sm font-medium">{label}</span>
            {step < 3 && <div className="w-8 h-[1px] bg-white/10 mx-2" />}
        </div>
    )
}
