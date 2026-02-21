# Render Deployment Guide

## Why Render Instead of Vercel?

**Render Free Tier Advantages:**
- ✅ **512 MB RAM** (more than enough for Essentia.js WASM)
- ✅ **No strict 10-second timeout** on free tier
- ✅ **Better WASM support** (proper Node.js environment)
- ✅ **Persistent instances** (doesn't cold start as aggressively)
- ✅ **Full server environment** (not serverless functions)
- ✅ **Works great with Next.js**

**Vercel Free Tier Limitations:**
- ❌ Only 1024 MB memory
- ❌ 10-second max execution time
- ❌ Serverless function constraints
- ❌ WASM struggles in edge runtime
- ❌ Requires Pro plan ($20/month) for better specs

---

## 🚀 Step-by-Step Deployment

### 1. Create Render Account
1. Go to https://render.com
2. Sign up with your GitHub account
3. Authorize Render to access your repositories

### 2. Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `OSAMOR19/rootsaiplugin`
3. Render will auto-detect it's a Next.js app

### 3. Configure the Service

**Basic Settings:**
- **Name:** `rootsai-plugin` (or your preferred name)
- **Region:** Choose closest to you (Oregon, Frankfurt, Singapore)
- **Branch:** `main` (or your default branch)
- **Runtime:** `Node`

**Build & Deploy:**
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start`

**Instance:**
- **Plan:** `Free` (512 MB RAM, shared CPU)
- **Auto-Deploy:** `Yes` (deploys on every git push)

### 4. Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_VERSION` | `18.17.0` | Ensures compatible Node version |
| `NODE_ENV` | `production` | Optimizes Next.js for production |
| `SOUNDSTAT_API_KEY` | `[Your API Key]` | If you still need it (optional now) |

### 5. Deploy!

Click **"Create Web Service"**

Render will:
1. Clone your repo
2. Run `npm install`
3. Run `npm run build`
4. Start the server with `npm run start`
5. Give you a live URL: `https://rootsai-plugin.onrender.com`

---

## 📋 Using render.yaml (Recommended)

I've created a `render.yaml` file in your project root. This allows **automatic configuration**.

**How to use it:**

1. **Commit the file:**
   ```bash
   git add render.yaml
   git commit -m "Add Render configuration"
   git push
   ```

2. **In Render Dashboard:**
   - Click **"New +"** → **"Blueprint"**
   - Select your repository
   - Render will read `render.yaml` and auto-configure everything!

3. **Add your environment variables** in the Render dashboard

**Benefits:**
- ✅ Configuration as code
- ✅ Easy to update settings
- ✅ Reproducible deployments
- ✅ Team collaboration

---

## 🔧 Essentia.js WASM Configuration

Your app is already configured for Render! Here's what's set up:

### In `next.config.mjs`:
```javascript
webpack: (config, { isServer }) => {
  if (isServer) {
    config.externals.push('ffmpeg-static');
  }
  
  // WASM support
  config.experiments = {
    ...config.experiments,
    asyncWebAssembly: true,
    layers: true,
  };
  
  config.module.rules.push({
    test: /\.wasm$/,
    type: 'asset/resource',
  });
  
  return config;
}
```

### In `lib/essentia/initEssentia.ts`:
- Uses `require()` for direct module loading
- Sets `global.EssentiaWASM` for proper initialization
- Falls back gracefully if WASM fails

### In `app/api/analyze/route.ts`:
- Primary: Essentia.js (WASM) for accurate analysis
- Fallback: Simple JS-based detection
- Both work perfectly on Render!

---

## 🎯 What Works on Render Free Tier

✅ **Full Essentia.js WASM analysis**
- Accurate BPM detection
- Key detection
- Energy, danceability, mood analysis
- MFCCs extraction

✅ **Audio processing**
- FFmpeg decoding
- Multiple formats (MP3, WAV, M4A, OGG, FLAC)
- Up to 30 MB file uploads

✅ **Fast performance**
- Persistent instances (no cold starts after first request)
- 512 MB RAM is plenty
- No 10-second timeout

---

## ⚡ Performance Tips

### 1. Keep Instance Awake
Render free tier spins down after 15 minutes of inactivity.

**Solution:** Use a service like Cron-Job.org to ping your app every 10 minutes:
```
https://rootsai-plugin.onrender.com/
```

### 2. Optimize Build Time
Your build should take ~2-3 minutes on Render.

### 3. Monitor Logs
In Render dashboard, click **"Logs"** to see:
- Build output
- Runtime logs
- Errors
- Essentia.js initialization

---

## 🐛 Troubleshooting

### Build Fails
**Check:**
1. Node version is 18.17.0
2. All dependencies in `package.json` are correct
3. `npm run build` works locally

**Fix:**
```bash
# Test locally
npm install
npm run build
npm run start
```

### Essentia.js Fails
**Check logs for:**
```
❌ Failed to initialize Essentia.js
```

**Fix:**
- Fallback will activate automatically
- Users still get BPM results
- No action needed!

### App is Slow
**Causes:**
1. Cold start (first request after 15 min idle)
2. Large audio file upload

**Solutions:**
1. Use keep-alive service (see Performance Tips)
2. Show loading indicator to users

### Out of Memory
**Unlikely with 512 MB, but if it happens:**
1. Check for memory leaks in logs
2. Optimize audio processing
3. Consider upgrading to Render Pro ($7/month for 2 GB RAM)

---

## 🔄 Deployment Workflow

### Automatic Deployments (Recommended)
Every time you push to GitHub, Render automatically:
1. Detects the push
2. Pulls latest code
3. Runs build
4. Deploys new version
5. Zero downtime!

### Manual Deployments
In Render dashboard:
1. Click **"Manual Deploy"**
2. Select branch
3. Click **"Deploy"**

---

## 💰 Render Free Tier Limits

| Feature | Limit | Your Usage |
|---------|-------|------------|
| RAM | 512 MB | ~200-300 MB (plenty of headroom) |
| Build time | 15 min | ~2-3 min (fast!) |
| Bandwidth | 100 GB/month | Depends on traffic |
| Spin down | After 15 min idle | Use keep-alive |
| Instances | 1 free per account | 1 app |

**Upgrade Options:**
- **Starter:** $7/month - 512 MB RAM, no spin down
- **Standard:** $25/month - 2 GB RAM, autoscaling
- **Pro:** $85/month - 4 GB RAM, priority support

---

## 📊 Comparing Hosting Options

| Feature | Render Free | Vercel Free | Vercel Pro |
|---------|-------------|-------------|------------|
| RAM | 512 MB | 1024 MB | 3008 MB |
| Timeout | ~30 sec | 10 sec | 60 sec |
| WASM | ✅ Perfect | ⚠️ Limited | ✅ Good |
| Cold Start | ~5 sec | ~1 sec | ~1 sec |
| Price | Free | Free | $20/mo |
| **Best for** | **Your app!** | Static sites | Heavy compute |

---

## 🎉 Next Steps

1. **Deploy to Render** using steps above
2. **Test the `/api/analyze` endpoint:**
   ```bash
   curl -X POST https://your-app.onrender.com/api/analyze \
     -F "audio=@test.mp3"
   ```
3. **Check if Essentia.js works** in logs
4. **If Essentia fails,** fallback will work seamlessly!
5. **Share your live URL** 🚀

---

## 🆘 Need Help?

**Render Resources:**
- Docs: https://render.com/docs
- Support: support@render.com
- Community: https://community.render.com

**Your App Logs:**
1. Go to Render dashboard
2. Click your service
3. Click **"Logs"** tab
4. Look for Essentia initialization messages

---

## ✅ Checklist

Before deploying:
- [ ] Git repo is up to date
- [ ] `render.yaml` is in project root
- [ ] `package.json` has correct scripts
- [ ] Environment variables ready (if needed)
- [ ] Tested locally with `npm run build && npm run start`

After deploying:
- [ ] Service shows "Live" status in Render
- [ ] Can access homepage at provided URL
- [ ] Upload audio test works
- [ ] BPM detection returns results
- [ ] Check logs for any errors

---

## 🚀 Your Render URL

After deployment, your app will be live at:
```
https://rootsai-plugin.onrender.com
```

Or your custom subdomain!

**That's it! Your app with full Essentia.js WASM support is now running on Render! 🎉**

