# 🎛️ ROOTS Admin Panel Guide

## Overview
The Admin Panel allows you to upload and manage drum samples in your ROOTS library. It features drag-and-drop upload, automatic BPM/key detection, and seamless integration with your existing sample library.

---

## 🔐 Accessing the Admin Panel

### Option 1: Via Settings Page
1. Go to **Settings** (`/settings`)
2. Scroll to the **Admin Panel** section
3. Click **"Access Admin Panel"**
4. Enter your admin password

### Option 2: Direct URL
1. Navigate to `/admin`
2. Enter your admin password

### Default Password
The default password is `rootsai2024`

**⚠️ IMPORTANT**: Change this password in production!

---

## 🔑 Setting Your Admin Password

### For Development (Local)
1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and set your password:
   ```env
   NEXT_PUBLIC_ADMIN_PASSWORD=your_secure_password_here
   ```

3. Restart your dev server

### For Production (Vercel/Render)
1. Go to your hosting platform's dashboard
2. Add environment variable:
   - **Key**: `NEXT_PUBLIC_ADMIN_PASSWORD`
   - **Value**: Your secure password
3. Redeploy your application

---

## 📤 Uploading Beats

### Step 1: Prepare Your Files
- **Supported formats**: WAV, MP3, M4A, OGG, FLAC, AAC
- **Recommended**: WAV files for best quality
- **File naming**: Use descriptive names (e.g., `Afrobeat Loop 120BPM.wav`)

### Step 2: Upload
You have two options:

#### Option A: Drag & Drop
1. Drag audio files directly into the upload zone
2. Files will appear in the upload list below

#### Option B: Browse Files
1. Click **"Select Files"** button
2. Choose one or multiple files
3. Click **Open**

### Step 3: Add Metadata
For each uploaded file, you can specify:

1. **Name** (required)
   - Default: Filename without extension
   - Edit to make it user-friendly (e.g., "Scata Drum Loop")

2. **BPM** (optional)
   - If left blank, system will auto-detect
   - Range: 60-200 BPM
   - Manual input is more accurate

3. **Key** (optional)
   - If left blank, system will auto-detect
   - Options: C, C#, D, D#, E, F, F#, G, G#, A, A#, B (Major/Minor)

4. **Category** (required)
   - **Full Drums**: Complete drum patterns (2-4 bars)
   - **Top Loops**: Hi-hat/cymbal patterns (1-2 bars)
   - **Kick Loops**: Kick drum patterns
   - **Shaker Loops**: Shaker/percussion patterns
   - **Fills & Rolls**: Drum fills and transitions
   - **Percussions**: Various percussion loops

### Step 4: Upload All
1. Review all entries
2. Click **"Upload All"** button
3. Wait for processing (status will update)
4. ✓ Green checkmark = Success

---

## 📊 Upload Status Indicators

| Icon | Status | Description |
|------|--------|-------------|
| 📤 Upload | Pending | Waiting to be uploaded |
| 🔄 Spinning | Analyzing | Processing BPM/key detection |
| ✓ Green Check | Complete | Successfully uploaded |
| ❌ Red X | Error | Upload failed (retry) |

---

## 🗑️ Managing Uploads

### Remove a Beat
- Click the **trash icon** (🗑️) next to any beat
- Cannot remove while uploading

### Edit Metadata
- Modify name, BPM, key, or category
- Changes only apply before upload
- After upload, metadata is saved to library

---

## 🔧 How It Works (Technical)

### Upload Process
1. **Client Side**:
   - User drops/selects audio files
   - Metadata form is displayed
   - Files are sent to `/api/admin/upload-beat`

2. **Server Side**:
   - File is saved to `/public/audio/[Category]/`
   - BPM/Key auto-detection (if not provided)
   - `metadata.json` is updated with new entry
   - Success response sent back

3. **Library Update**:
   - New beat appears in `/browse` immediately
   - Searchable and filterable
   - Available for AI matching

### File Storage Structure
```
/public/audio/
├── Full Drums/
│   ├── Beat_Name_120BPM.wav
│   └── ...
├── Top Loops/
├── Kick Loops/
├── Shaker Loops/
├── Fills & Rolls/
├── Percussions/
└── metadata.json  ← Updated automatically
```

### Metadata Format
```json
{
  "filename": "Beat_Name_120BPM.wav",
  "bpm": 120,
  "key": "Am",
  "category": "Full Drums",
  "url": "/audio/Full Drums/Beat_Name_120BPM.wav"
}
```

---

## 🎨 Best Practices

### 1. File Naming
✅ Good:
- `Afrobeat_Loop_120BPM.wav`
- `Shaker_Pattern_110BPM.wav`
- `Kick_Heavy_98BPM.wav`

❌ Avoid:
- `untitled.wav`
- `audio_1.mp3`
- `test.wav`

### 2. BPM Accuracy
- Always provide BPM if known (most accurate)
- Use a metronome or DAW to confirm
- Auto-detection is ~90% accurate

### 3. Key Detection
- Manual input recommended for melodic loops
- Auto-detection works best for tonal drums
- Use "No Key" for purely rhythmic patterns

### 4. Category Selection
- Choose the most specific category
- **Full Drums** = Complete beat
- **Top Loops** = Just hi-hats/cymbals
- **Fills & Rolls** = Transition elements only

### 5. Batch Uploading
- Prepare all files beforehand
- Fill in metadata for all files
- Upload in batches of 10-20 (faster processing)

---

## 🚨 Troubleshooting

### "Incorrect Password"
- Check `.env.local` file exists
- Verify `NEXT_PUBLIC_ADMIN_PASSWORD` is set
- Restart dev server after changing

### Upload Fails
- **File too large**: Max 30MB per file
- **Wrong format**: Use WAV, MP3, M4A only
- **Server error**: Check console logs

### BPM/Key Not Detected
- Essentia.js requires clear rhythmic content
- Provide manual values if auto-detect fails
- Check audio file isn't corrupted

### Beats Don't Appear in Library
1. Refresh `/browse` page
2. Check `metadata.json` was updated
3. Verify file saved in correct folder
4. Check browser console for errors

---

## 🔒 Security Considerations

### Production Deployment
1. **Change default password** immediately
2. Use environment variables (never hardcode)
3. Consider adding IP whitelist
4. Add rate limiting to upload endpoint
5. Implement proper authentication (OAuth, JWT)

### Recommended Password
- At least 16 characters
- Mix of letters, numbers, symbols
- Not shared with team members
- Rotated every 3-6 months

---

## 📈 Stats Dashboard

The admin panel shows real-time stats:
- **Total Uploads**: All files in current session
- **Completed**: Successfully uploaded beats
- **Pending**: Waiting to upload or analyzing
- **Errors**: Failed uploads (need retry)

---

## 🎯 Future Enhancements

Planned features:
- [ ] Bulk delete/edit
- [ ] CSV import for metadata
- [ ] Advanced audio preview
- [ ] Waveform editor
- [ ] Cloud storage integration (AWS S3)
- [ ] User roles & permissions
- [ ] Upload history/logs
- [ ] Automatic thumbnail generation

---

## 💡 Tips for Power Users

1. **Keyboard Shortcuts**: Use Tab to navigate between fields
2. **Drag Multiple**: Select multiple files in file browser
3. **Naming Convention**: Use consistent naming (Artist - Name - BPM)
4. **Quality Control**: Preview each beat before uploading
5. **Backup**: Keep original files in separate folder

---

## 📞 Support

If you encounter issues:
1. Check browser console (F12)
2. Review server logs
3. Verify file permissions in `/public/audio/`
4. Test with a single small WAV file first

---

## 🎉 Success!

Once uploaded, your beats are:
- ✓ Searchable in library
- ✓ Filterable by category
- ✓ Downloadable by users
- ✓ Available for AI matching
- ✓ Stored permanently

**Happy uploading! 🎵**
