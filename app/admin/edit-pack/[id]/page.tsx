"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import EditSamplesStep from "@/components/admin/EditSamplesStep"
import PackDetailsStep from "@/components/admin/PackDetailsStep"
import FilesUploadStep from "@/components/admin/FilesUploadStep"
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
    const initialCategoryName = decodeURIComponent(packId)
    const [categoryName, setCategoryName] = useState(initialCategoryName)

    // Fetch existing samples
    const { samples: allSamples, loading } = useSamples({ autoFetch: true })
    const [packSamples, setPackSamples] = useState<any[]>([])
    const [files, setFiles] = useState<File[]>([])
    // New: Store Step 1 details
    const [packDetails, setPackDetails] = useState<any>(null)

    const [isLoadingData, setIsLoadingData] = useState(true)
    const [currentStep, setCurrentStep] = useState(3) // Start at step 3
    const [showSuccessModal, setShowSuccessModal] = useState(false)

    // ...

    useEffect(() => {
        const initData = async () => {
            // Wait for samples to finish loading
            if (loading) return

            // If we are still "loading data" for this specific page logic
            if (isLoadingData) {
                // Filter samples belonging to this pack/category
                // If allSamples is empty, filtered will just be empty, preventing the deadlock
                const filtered = allSamples.filter(s => s.category === categoryName)

                // Fetch pack metadata (Description, Cover, etc) from packs.json
                let existingPackDetails: any = null
                try {
                    const packsRes = await fetch('/audio/packs.json')
                    if (packsRes.ok) {
                        const packsData = await packsRes.json()
                        // Find matching pack
                        existingPackDetails = packsData.find((p: any) => p.name === categoryName || p.title === categoryName)
                    }
                } catch (err) {
                    console.error("Could not fetch packs.json", err)
                }

                // If no samples AND no pack details found, we might want to alert or redirect
                // But for now let's allow editing an empty pack (to add files)

                const converted = filtered.map(s => {
                    const dummyFile = new File([""], s.filename || s.name, { type: "audio/wav" })
                    Object.defineProperty(dummyFile, 'r2_url', { value: s.audioUrl || s.url })
                    return {
                        id: s.id,
                        file: dummyFile,
                        name: s.name,
                        tempo: s.bpm?.toString() || "",
                        key: typeof s.key === 'string' ? s.key : "",
                        timeSignature: s.timeSignature || "4/4",
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
                setFiles(converted.map(s => s.file))

                setPackDetails({
                    title: categoryName,
                    name: categoryName,
                    genre: existingPackDetails?.genre || filtered[0]?.genres?.[0] || "",
                    description: existingPackDetails?.description || "",
                    coverPreview: existingPackDetails?.coverImage || filtered[0]?.imageUrl || "",
                    coverArt: null
                })

                setIsLoadingData(false)
            }
        }

        initData()
    }, [allSamples, loading, isLoadingData, categoryName])

    // ...

    // In Render:
    {
        currentStep === 1 && (
            <PackDetailsStep
                data={packDetails || { name: categoryName }}
                onNext={(data) => {
                    setPackDetails(data) // Persist step 1 data
                    if (data.title && data.title !== categoryName) {
                        setCategoryName(data.title)
                        // Update samples category locally
                        setPackSamples(prev => prev.map(s => ({ ...s, category: data.title })))
                    }
                    setCurrentStep(2)
                }}
            />
        )
    }

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
                fileName: file.name,
                category: categoryName // Force category to match current pack name
            }))

            formData.append('samplesMetadata', JSON.stringify(cleanSamples))
            formData.append('originalCategory', initialCategoryName) // Identify which pack to update (old name)

            // Append Pack Details
            if (packDetails) {
                const { coverArt, coverPreview, ...cleanPackDetails } = packDetails
                formData.append('packDetails', JSON.stringify(cleanPackDetails))

                // Append Cover Image if changed (it's a File)
                if (coverArt instanceof File) {
                    formData.append('coverImage', coverArt)
                }
            } else {
                // If no changes to details, just send current name as details
                formData.append('packDetails', JSON.stringify({ title: categoryName }))
            }

            // Append new files (real files have size > 0, dummy existing files have size 0)
            updatedSamples.forEach(({ file }) => {
                if (file && file.size > 0) {
                    formData.append('files', file)
                }
            })

            const response = await fetch('/api/admin/update-pack', {
                method: 'POST',
                // Headers are automatically set by browser for FormData (multipart/form-data)
                body: formData
            })

            if (!response.ok) throw new Error('Update failed')

            setShowSuccessModal(true)
            // Force a hard reload after a short delay to ensure UI updates with new image
            setTimeout(() => {
                window.location.reload()
            }, 1500)

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

                {/* Stepper */}
                <div className="flex items-center gap-4">
                    <StepIndicator step={1} currentStep={currentStep} label="Pack details" onClick={() => setCurrentStep(1)} />
                    <StepIndicator step={2} currentStep={currentStep} label="Files" onClick={() => setCurrentStep(2)} />
                    <StepIndicator step={3} currentStep={currentStep} label="Edit samples" onClick={() => setCurrentStep(3)} />
                </div>

                <div className="w-[200px] flex justify-end">
                    {/* Placeholder */}
                </div>
            </div>

            <div className="relative z-10 container mx-auto px-4 py-8 pb-32">
                {currentStep === 1 && (
                    <PackDetailsStep
                        data={packDetails || {
                            name: categoryName,
                            title: categoryName,
                            coverPreview: packSamples[0]?.imageUrl || "", // Fallback to sample image if available
                            description: ""
                        }}
                        onNext={(data) => {
                            setPackDetails(data) // Persist
                            if (data.title && data.title !== categoryName) {
                                setCategoryName(data.title)
                                // Also update local samples so they reflect the new category immediately
                                setPackSamples(prev => prev.map(s => ({ ...s, category: data.title })))
                            }
                            setCurrentStep(2)
                        }}
                    />
                )}

                {currentStep === 2 && (
                    <FilesUploadStep
                        initialFiles={files}
                        onBack={() => setCurrentStep(1)}
                        onNext={(updatedFiles) => {
                            setFiles(updatedFiles)
                            setCurrentStep(3)
                        }}
                    />
                )}


                {currentStep === 3 && (
                    <EditSamplesStep
                        files={files}
                        initialData={packSamples}
                        onBack={() => setCurrentStep(2)}
                        onSubmit={handleSubmit}
                        defaultCategory={categoryName}
                        onChange={(updatedSamples) => setPackSamples(updatedSamples)}
                    />
                )}
            </div>

            {/* Success Modal */}
            {/* ... */}
        </div>
    )
}

function StepIndicator({ step, currentStep, label, onClick }: { step: number, currentStep: number, label: string, onClick?: () => void }) {
    const isActive = currentStep === step
    const isCompleted = currentStep > step

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 ${isActive ? 'text-white' : 'text-white/40'} hover:text-white transition-colors`}
        >
            <div className={`
        w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors
        ${isActive ? 'bg-white text-black' : isCompleted ? 'bg-green-500 text-black' : 'bg-white/10 text-white'}
      `}>
                {isCompleted ? <Check className="w-3 h-3" /> : step}
            </div>
            <span className="text-sm font-medium">{label}</span>
            {step < 3 && <div className="w-8 h-[1px] bg-white/10 mx-2" />}
        </button>
    )
}
