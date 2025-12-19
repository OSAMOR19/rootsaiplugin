import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Image as ImageIcon, Upload } from "lucide-react"
import CustomDropdown from "@/components/CustomDropdown"

interface PackDetailsStepProps {
    onNext: (data: any) => void
    data?: any
}

const genres = [
    'Afrobeats', 'Amapiano', 'Afrohouse', 'World'
]

export default function PackDetailsStep({ onNext, data }: PackDetailsStepProps) {
    const [title, setTitle] = useState(data?.name || data?.title || "")
    const [genre, setGenre] = useState(data?.genre || "")
    const [description, setDescription] = useState(data?.description || "")
    const [coverArt, setCoverArt] = useState<File | null>(data?.coverArt || null)
    const [coverPreview, setCoverPreview] = useState<string>(data?.coverPreview || "")
    const [allowCash, setAllowCash] = useState(data?.allowCash || false)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setCoverArt(file)
            setCoverPreview(URL.createObjectURL(file))
        }
    }

    const handleNext = () => {
        if (!title) return // Basic validation
        onNext({ title, genre, description, coverArt, coverPreview, allowCash })
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto"
        >
            {/* Cover Art Upload */}
            <div className="flex flex-col items-center mb-12">
                <div
                    className="w-40 h-40 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center overflow-hidden cursor-pointer hover:border-white/20 transition-all group relative mb-4"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {coverPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={coverPreview}
                            alt="Cover"
                            className="w-full h-full object-cover"
                            onError={() => setCoverPreview("")}
                        />
                    ) : (
                        <div className="flex flex-col items-center text-white/20 group-hover:text-white/40 transition-colors">
                            <ImageIcon className="w-10 h-10 mb-2" />
                        </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-xs font-medium text-white">Change</span>
                    </div>
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/png, image/jpeg"
                    onChange={handleImageUpload}
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-medium transition-colors"
                >
                    Add cover art
                </button>
                <p className="text-white/20 text-xs mt-2">.jpg or .png max. 2MB</p>
            </div>

            {/* Form Fields */}
            <div className="space-y-8">
                <div>
                    <label className="block text-sm font-bold text-white mb-2">Pack title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Give your pack a title"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                        maxLength={30}
                    />
                    <div className="flex justify-end mt-1">
                        <span className="text-xs text-white/20">{title.length}/30</span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-white mb-2">Genre(s)</label>
                    <CustomDropdown
                        options={genres}
                        value={genre}
                        onChange={setGenre}
                        placeholder="Genre"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-white mb-2">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Present your pack like an album release"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors min-h-[120px] resize-none"
                    />
                    <p className="text-xs text-white/20 mt-1">min. 150 characters</p>
                </div>

                {/* Optional Fields Divider */}
                <div className="pt-4 border-t border-white/5">
                    <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-6">Optional Fields ↓</p>


                </div>
            </div>

            {/* Footer Action */}
            <div className="fixed bottom-0 left-0 w-full p-6 bg-black/80 backdrop-blur-xl border-t border-white/10 flex justify-end z-50">
                <button
                    onClick={handleNext}
                    disabled={!title}
                    className="px-8 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-white/10 disabled:text-white/20 text-white rounded-full font-bold transition-all"
                >
                    Continue
                </button>
            </div>
        </motion.div>
    )
}
