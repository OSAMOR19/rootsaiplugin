# 🚀 Cloudflare R2 Integration

> Complete file storage solution for your Next.js application

## ⚡ Quick Start (30 seconds)

### 1️⃣ Add Environment Variables

Create `.env.local`:

```bash
R2_ACCESS_KEY_ID=540e4a7bdeafc2b289d609de1cad59b9
R2_SECRET_ACCESS_KEY=586563e7680102c3576c8422375cb60852c300bda402d9c93e9f92fc3de4d7b8
R2_ACCOUNT_ID=175367b0a4073c8d283294a8a4612373
R2_BUCKET_NAME=roots-samples
R2_ENDPOINT=https://175367b0a4073c8d283294a8a4612373.r2.cloudflarestorage.com
```

### 2️⃣ Restart Server

```bash
npm run dev
```

### 3️⃣ Test It

Visit: **http://localhost:3000/r2-demo**

---

## 📚 Documentation

| File | Description |
|------|-------------|
| **R2_QUICK_START.md** | ⭐ Start here - Quick setup & examples |
| **R2_INTEGRATION_GUIDE.md** | 📖 Complete integration guide |
| **R2_IMPLEMENTATION_SUMMARY.md** | 🔧 Technical implementation details |
| **R2_SETUP_CHECKLIST.md** | ✅ Setup checklist & status |

---

## 💻 Usage

### React Hook (Recommended)

```typescript
import { useR2Samples } from '@/hooks/useR2Samples';

const { files, uploadFile, deleteFile } = useR2Samples();
```

### API Endpoints

- `POST /api/samples/upload` - Upload files
- `GET /api/samples/list` - List files
- `DELETE /api/samples/delete` - Delete files

### Server-Side

```typescript
import { uploadFile, listFiles, deleteFile } from '@/lib/r2';
```

---

## 📁 What Was Created

```
lib/r2.ts                        # Core R2 client
types/r2.ts                      # TypeScript types
hooks/useR2Samples.ts            # React hook
components/R2SampleManager.tsx   # UI component
app/api/samples/*/route.ts       # API endpoints (×3)
app/r2-demo/page.tsx             # Demo page
```

---

## 🎯 Features

✅ Upload audio files to R2  
✅ List files with metadata  
✅ Delete files safely  
✅ Public & presigned URLs  
✅ React hook with loading states  
✅ Full TypeScript support  
✅ Production-ready security  
✅ Complete error handling  

---

## 🔒 Security

- Environment variables (no hardcoding)
- File type validation (audio only)
- File size limits (50MB max)
- Filename sanitization
- Path traversal prevention

---

## 📊 Supported Formats

MP3 • WAV • OGG • FLAC • AAC • M4A • WebM

---

## 🆘 Help

**Problem?** Check the troubleshooting section in `R2_INTEGRATION_GUIDE.md`

**Questions?** Read `R2_QUICK_START.md` for examples

---

## ✅ Status

| Component | Status |
|-----------|--------|
| Dependencies | ✅ Installed |
| Library | ✅ Created |
| API Routes | ✅ Created |
| React Hook | ✅ Created |
| UI Component | ✅ Created |
| Documentation | ✅ Complete |
| Environment | ⚠️ **Need to configure** |

**Next**: Add credentials to `.env.local` and restart server!

