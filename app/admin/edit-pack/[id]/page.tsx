"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import EditSamplesStep from "@/components/admin/EditSamplesStep"
import PackDetailsStep from "@/components/admin/PackDetailsStep"
import FilesUploadStep from "@/components/admin/FilesUploadStep"
import { useSamples } from "@/hooks/useSamples"
import { supabase } from "@/lib/supabase"
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

    // Fetch existing samples with category filter
    const { samples: allSamples, loading } = useSamples({ autoFetch: true, category: categoryName })
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
                const filtered = allSamples // Already filtered by hook

                // Fetch pack metadata (Description, Cover, etc) from Supabase
                let existingPackDetails: any = null
                try {
                    const { data, error } = await supabase
                        .from('packs')
                        .select('*')
                        .or(`title.eq.${categoryName},title.eq.${decodeURIComponent(packId)}`)
                        .single()

                    if (data) {
                        existingPackDetails = {
                            ...data,
                            coverImage: data.cover_image,
                            title: data.title,
                            genre: data.genre,
                            description: data.description
                        }
                    }
                } catch (err) {
                    console.error("Could not fetch pack details", err)
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
                        featured: s.featured || false,
                        // Map existing stems to stemsFiles format expected by UI
                        stemsFiles: s.stems?.map((stem: any) => {
                            const dummyStemFile = new File([""], stem.filename || stem.name, { type: "audio/wav" })
                            Object.defineProperty(dummyStemFile, 'r2_url', { value: stem.url })
                            return {
                                file: dummyStemFile,
                                name: stem.name,
                                id: Math.random().toString(36).substr(2, 9) // temporary UI id
                            }
                        }) || []
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
        setIsLoadingData(true) // Reuse loading state or add specific valid one if needed
        setShowSuccessModal(false)

        try {
            const { uploadFileToSupabase } = await import('@/lib/upload-utils')

            // 1. Upload Cover Image (if changed)
            let coverImageUrl = null
            if (packDetails?.coverArt instanceof File) {
                const timestamp = Date.now()
                const cleanTitle = (packDetails.title || categoryName).replace(/[^a-z0-9]/gi, '_')
                const imageExt = packDetails.coverArt.name.split('.').pop()
                const imagePath = `packs/${timestamp}_${cleanTitle}_cover.${imageExt}`

                coverImageUrl = await uploadFileToSupabase(packDetails.coverArt, imagePath)
            } else if (packDetails?.coverPreview) {
                // Keep existing URL if not changed
                coverImageUrl = packDetails.coverPreview
            }

            // 2. Process Samples (Upload new files)
            const processedSamples = []

            for (const sample of updatedSamples) {
                // Is this a new file?
                // The initData mapped existing samples to a dummy File with size 0 but attached 'r2_url'
                // If the user replaced it, it will be a real File with size > 0

                let audioUrl = null
                const audioFile = sample.file

                // Check if existing URL is preserved on the dummy file
                // We stored it in 'r2_url' property on the file object in initData
                const existingUrl = (audioFile as any).r2_url || sample.audioUrl || sample.url

                if (audioFile && audioFile.size > 0) {
                    // New File Upload
                    const timestamp = Date.now()
                    const cleanTitle = (packDetails?.title || categoryName).replace(/[^a-z0-9]/gi, '_')
                    const safeNameBase = sample.name.replace(/[^a-z0-9]/gi, '_')
                    const audioExt = audioFile.name.split('.').pop()
                    const audioPath = `samples/${cleanTitle}/${timestamp}_${safeNameBase}.${audioExt}`

                    audioUrl = await uploadFileToSupabase(audioFile, audioPath)
                } else {
                    // Start with existing
                    audioUrl = existingUrl
                }

                // Process Stems
                const processedStems = []
                if (sample.stemsFiles && sample.stemsFiles.length > 0) {
                    for (const stem of sample.stemsFiles) {
                        const stemFile = stem.file
                        // Check for existing URL on dummy file
                        const existingStemUrl = (stemFile as any).r2_url || stem.url

                        let finalStemUrl = existingStemUrl

                        if (stemFile && stemFile.size > 0) {
                            // New Stem Upload
                            const timestamp = Date.now()
                            const cleanTitle = (packDetails?.title || categoryName).replace(/[^a-z0-9]/gi, '_')
                            const safeNameBase = sample.name.replace(/[^a-z0-9]/gi, '_')
                            const stemExt = stemFile.name.split('.').pop()
                            const stemPath = `samples/${cleanTitle}/stems/${timestamp}_${safeNameBase}_${stem.name.replace(/[^a-z0-9]/gi, '_')}.${stemExt}`

                            finalStemUrl = await uploadFileToSupabase(stemFile, stemPath)
                        }

                        if (finalStemUrl) {
                            processedStems.push({
                                name: stem.name,
                                url: finalStemUrl,
                                filename: stemFile?.name || stem.name
                            })
                        }
                    }
                }

                processedSamples.push({
                    ...sample, // keep IDs/etc
                    fileName: audioFile?.name, // backend uses this to match? actually we just pass URL now
                    category: packDetails?.title || categoryName,
                    bpm: sample.tempo ? parseInt(sample.tempo) : 0,
                    time_signature: sample.timeSignature || '4/4',
                    drum_type: sample.drumType || '',
                    audio_url: audioUrl,
                    stems: processedStems,
                    // Pass explicit properties to ensure backend receives clean data
                    name: sample.name,
                    key: sample.key,
                    genres: sample.genres,
                    instruments: sample.instruments,
                    keywords: sample.keywords,
                    is_featured: sample.featured
                })
            }

            // 3. Send JSON Payload
            const payload = {
                originalCategory: initialCategoryName,
                packDetails: {
                    ...packDetails,
                    cover_image: coverImageUrl
                },
                samples: processedSamples
            }

            const response = await fetch('/api/admin/update-pack', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!response.ok) throw new Error('Update failed')

            setShowSuccessModal(true)
            setTimeout(() => {
                window.location.reload()
            }, 1500)

        } catch (error) {
            console.error('Update error:', error)
            alert('Failed to update pack')
            setIsLoadingData(false)
        }
    }

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
