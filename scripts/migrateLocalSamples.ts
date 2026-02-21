/**
 * Migration Script: Move Local Audio Files to Cloudflare R2
 * 
 * This script:
 * 1. Reads all audio files from /public/audio/
 * 2. Uploads each file to Cloudflare R2
 * 3. Updates metadata.json with R2 URLs
 * 4. Skips files already migrated to R2
 * 
 * Usage: npm run migrate:samples
 */

import { readFile, writeFile, readdir, stat } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { uploadFile } from '../lib/r2'

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m',
}

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg: string) => console.log(`\n${colors.bright}${msg}${colors.reset}\n`),
}

interface MetadataEntry {
  id?: string
  name?: string
  filename: string
  bpm?: number
  key?: string
  category?: string
  audioUrl?: string
  url?: string
  imageUrl?: string
  storage?: string
  uploadedAt?: string
  timeSignature?: string
  duration?: string
}

const AUDIO_EXTENSIONS = ['.wav', '.mp3', '.ogg', '.flac', '.m4a', '.aac']

/**
 * Get MIME type based on file extension
 */
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.flac': 'audio/flac',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
  }
  return mimeTypes[ext] || 'audio/wav'
}

/**
 * Recursively find all audio files in a directory
 */
async function findAudioFiles(dir: string, baseDir: string = dir): Promise<Array<{ fullPath: string; relativePath: string }>> {
  const files: Array<{ fullPath: string; relativePath: string }> = []
  
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      
      if (entry.isDirectory()) {
        // Recursively search subdirectories
        const subFiles = await findAudioFiles(fullPath, baseDir)
        files.push(...subFiles)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        if (AUDIO_EXTENSIONS.includes(ext)) {
          const relativePath = path.relative(baseDir, fullPath)
          files.push({ fullPath, relativePath })
        }
      }
    }
  } catch (error) {
    log.warning(`Could not read directory: ${dir}`)
  }
  
  return files
}

/**
 * Main migration function
 */
async function migrate() {
  log.title('🚀 CLOUDFLARE R2 MIGRATION SCRIPT')
  log.info('Starting migration of local audio files to R2...\n')

  // Paths
  const audioDir = path.join(process.cwd(), 'public', 'audio')
  const metadataPath = path.join(process.cwd(), 'public', 'audio', 'metadata.json')

  // Check if audio directory exists
  if (!existsSync(audioDir)) {
    log.error('Audio directory not found: /public/audio/')
    process.exit(1)
  }

  // Load metadata
  let metadata: MetadataEntry[] = []
  if (existsSync(metadataPath)) {
    const metadataContent = await readFile(metadataPath, 'utf-8')
    metadata = JSON.parse(metadataContent)
    log.info(`Loaded ${metadata.length} entries from metadata.json`)
  } else {
    log.warning('metadata.json not found, will create new one')
  }

  // Find all audio files
  log.info('Scanning for audio files...')
  const audioFiles = await findAudioFiles(audioDir)
  log.success(`Found ${audioFiles.length} audio files\n`)

  // Track statistics
  let uploaded = 0
  let skipped = 0
  let failed = 0

  // Process each file
  for (let i = 0; i < audioFiles.length; i++) {
    const { fullPath, relativePath } = audioFiles[i]
    const filename = path.basename(fullPath)
    
    log.info(`[${i + 1}/${audioFiles.length}] Processing: ${filename}`)

    try {
      // Check if already migrated
      const existingEntry = metadata.find(
        entry => entry.filename === filename && 
        (entry.storage === 'r2' || entry.audioUrl?.includes('r2.cloudflarestorage.com'))
      )

      if (existingEntry) {
        log.warning(`  ↳ Already migrated, skipping...`)
        skipped++
        continue
      }

      // Read file
      const fileBuffer = await readFile(fullPath)
      const fileStat = await stat(fullPath)
      const fileSizeMB = (fileStat.size / 1024 / 1024).toFixed(2)

      log.info(`  ↳ Size: ${fileSizeMB} MB`)

      // Determine category from path
      const pathParts = relativePath.split(path.sep)
      const category = pathParts.length > 1 ? pathParts[0] : 'Uncategorized'

      // Generate R2 filename
      const timestamp = Date.now()
      const safeFilename = filename.replace(/[^a-z0-9._-]/gi, '_')
      const r2Filename = `${category}/${timestamp}_${safeFilename}`

      // Upload to R2
      log.info(`  ↳ Uploading to R2...`)
      const uploadResult = await uploadFile(
        fileBuffer,
        r2Filename,
        getMimeType(filename)
      )

      log.success(`  ↳ Uploaded! URL: ${uploadResult.url}`)

      // Find existing metadata entry or create new one
      let metadataEntry = metadata.find(entry => entry.filename === filename)
      
      if (metadataEntry) {
        // Update existing entry
        metadataEntry.audioUrl = uploadResult.url
        metadataEntry.storage = 'r2'
        metadataEntry.uploadedAt = new Date().toISOString()
        if (!metadataEntry.category) metadataEntry.category = category
      } else {
        // Create new entry
        const newEntry: MetadataEntry = {
          id: Math.random().toString(36).substr(2, 9),
          name: filename.replace(/\.[^/.]+$/, ''), // Remove extension
          filename: filename,
          audioUrl: uploadResult.url,
          category: category,
          storage: 'r2',
          uploadedAt: new Date().toISOString(),
          bpm: 120, // Default
          timeSignature: '4/4',
          duration: '0:00',
        }
        metadata.push(newEntry)
      }

      uploaded++
      log.success(`  ✓ Migration complete!\n`)

    } catch (error: any) {
      failed++
      log.error(`  ✗ Failed: ${error.message}\n`)
    }
  }

  // Save updated metadata
  log.info('Saving updated metadata...')
  await writeFile(metadataPath, JSON.stringify(metadata, null, 2))
  log.success('Metadata saved!\n')

  // Print summary
  log.title('📊 MIGRATION SUMMARY')
  console.log(`Total files found:    ${audioFiles.length}`)
  console.log(`${colors.green}Successfully uploaded: ${uploaded}${colors.reset}`)
  console.log(`${colors.yellow}Already migrated:      ${skipped}${colors.reset}`)
  console.log(`${colors.red}Failed:                ${failed}${colors.reset}`)

  if (uploaded > 0) {
    log.title('✅ MIGRATION COMPLETE!')
    log.info('Your files are now stored in Cloudflare R2')
    log.info('You can safely delete local files if needed')
  } else if (skipped === audioFiles.length) {
    log.title('✅ ALL FILES ALREADY MIGRATED')
    log.info('No new files to upload')
  } else {
    log.title('⚠️  MIGRATION COMPLETED WITH ERRORS')
    log.warning(`${failed} file(s) failed to upload`)
  }
}

// Run migration
migrate().catch(error => {
  log.error(`Fatal error: ${error.message}`)
  console.error(error)
  process.exit(1)
})

