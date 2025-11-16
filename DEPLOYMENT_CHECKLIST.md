# 🚀 Quick Deployment Checklist for Render

## Before You Deploy

### 1. Ensure Everything is Committed
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Verify These Files Exist
- ✅ `render.yaml` - Render configuration
- ✅ `next.config.mjs` - WASM support enabled
- ✅ `package.json` - All dependencies listed
- ✅ `.renderignore` - Optimize deployment size

### 3. Test Locally First
```bash
npm install
npm run build
npm run start
```

Visit `http://localhost:3000` and test:
- [ ] Homepage loads
- [ ] Can upload audio
- [ ] BPM detection works
- [ ] Results page displays
- [ ] Sync playback works

---

## Deploy to Render

### Method 1: Using render.yaml (Recommended)

1. **Go to Render Dashboard:** https://dashboard.render.com
2. Click **"New +"** → **"Blueprint"**
3. Connect your repository: `OSAMOR19/rootsaiplugin`
4. Render reads `render.yaml` automatically
5. Add environment variables (if needed)
6. Click **"Apply"**
7. Wait 2-3 minutes for build
8. **Done!** 🎉

### Method 2: Manual Setup

1. **Go to Render Dashboard:** https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect repository: `OSAMOR19/rootsaiplugin`
4. Configure:
   - **Name:** `rootsai-plugin`
   - **Region:** Oregon (or closest to you)
   - **Branch:** `main`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Plan:** Free
5. Add Environment Variables:
   - `NODE_VERSION` = `18.17.0`
   - `NODE_ENV` = `production`
6. Click **"Create Web Service"**
7. Wait 2-3 minutes for build
8. **Done!** 🎉

---

## After Deployment

### 1. Check Service Status
In Render dashboard, your service should show:
- **Status:** 🟢 Live
- **URL:** `https://rootsai-plugin.onrender.com`

### 2. Test the Live App

**Homepage:**
```
https://rootsai-plugin.onrender.com
```

**API Endpoint:**
```bash
curl -X POST https://rootsai-plugin.onrender.com/api/analyze \
  -F "audio=@/path/to/test.mp3"
```

### 3. Check Logs

In Render dashboard:
1. Click your service
2. Click **"Logs"** tab
3. Look for:
   ```
   ✅ Essentia.js WASM initialized successfully
   🎵 Starting track analysis
   ```

### 4. First Request Will Be Slow
- First request after deploy: ~5-10 seconds (cold start)
- Subsequent requests: ~1-2 seconds
- After 15 min idle: back to cold start

**Solution:** Set up keep-alive (see below)

---

## 🔄 Keep Your App Alive (Optional)

Render free tier spins down after 15 minutes of inactivity.

### Use Cron-Job.org (Free)

1. Go to https://cron-job.org/en/
2. Sign up (free)
3. Create new cron job:
   - **Title:** Keep RootsAI Alive
   - **URL:** `https://rootsai-plugin.onrender.com`
   - **Schedule:** Every 10 minutes
   - **Method:** GET
4. Save and enable

Now your app stays warm! 🔥

---

## 🐛 Troubleshooting

### Build Failed

**Check Render logs for errors:**
```
Failed to compile
```

**Common fixes:**
```bash
# Locally test build
npm run build

# Check Node version
node --version  # Should be 18.x

# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### App Shows "503 Service Unavailable"

**Causes:**
1. Build is still in progress (wait 2-3 min)
2. Service crashed on startup
3. Port binding issue

**Check logs in Render dashboard**

### Essentia.js Not Working

**Look for in logs:**
```
⚠️ Essentia.js failed, using simple fallback
```

**This is OK!** The fallback will work. Users still get BPM detection.

**If you want full Essentia.js:**
1. Check `lib/essentia/initEssentia.ts` loads correctly
2. Verify WASM files are included in build
3. Check Next.js webpack config

### Slow Performance

**First request slow?**
- Normal! Cold start takes 5-10 seconds
- Use keep-alive service (see above)

**All requests slow?**
- Check Render service metrics
- Verify you're on Free plan (512 MB)
- Consider upgrading to Starter ($7/mo, no spin down)

---

## 📊 Monitor Your App

### Render Dashboard Metrics

View in dashboard:
- **CPU Usage:** Should be low when idle
- **Memory:** ~200-300 MB typical
- **Requests:** Track usage
- **Build Time:** Should be 2-3 minutes

### Check App Health

**Simple health check:**
```bash
curl https://rootsai-plugin.onrender.com
```

Should return your homepage HTML.

---

## 🔄 Update Your App

### Automatic (Recommended)

Just push to GitHub:
```bash
git add .
git commit -m "Update feature"
git push origin main
```

Render will:
1. Detect push
2. Auto-deploy new version
3. Zero downtime
4. Done in ~2-3 minutes

### Manual Deploy

In Render dashboard:
1. Click **"Manual Deploy"**
2. Select **"Deploy latest commit"**
3. Click **"Deploy"**

---

## 🎉 Success Checklist

After deployment, verify:
- [ ] Service shows "Live" status
- [ ] Homepage loads at your Render URL
- [ ] Can upload audio file
- [ ] BPM detection returns results
- [ ] Sync playback works
- [ ] Results page displays samples
- [ ] Volume controls work
- [ ] Dark mode works
- [ ] No errors in console
- [ ] Render logs look good

---

## 🆘 Get Help

**If stuck:**
1. Check Render logs first
2. Read `RENDER_DEPLOYMENT.md` for detailed info
3. Check Render docs: https://render.com/docs
4. Render community: https://community.render.com

---

## 📝 Important URLs

| Resource | URL |
|----------|-----|
| Render Dashboard | https://dashboard.render.com |
| Your Live App | `https://rootsai-plugin.onrender.com` |
| Render Docs | https://render.com/docs |
| Keep-Alive Service | https://cron-job.org |

---

**You're all set! Your app is now running on Render with full Essentia.js WASM support! 🚀**

