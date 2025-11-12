# 🔥 URGENT: Backend Connection Issue

## The Problem

Your app is hanging because it **cannot connect to your backend** at:
```
https://rootsaibackend.onrender.com
```

Error: `TypeError: Failed to fetch`

This means one of these issues:

### 1. ❌ Backend is NOT Running (Most Likely)
Render free tier **sleeps after 15 minutes of inactivity**. Your backend needs to wake up.

### 2. ❌ CORS Not Configured
Your backend needs to allow requests from your frontend domain.

### 3. ❌ Wrong Endpoint
The `/detect-bpm` endpoint doesn't exist or has different name.

---

## 🧪 Test Your Backend (Run These NOW)

### Test 1: Is the backend alive?
```bash
curl https://rootsaibackend.onrender.com/health
```

**Expected**: Some response (200 OK)
**If it fails**: Backend is NOT running or URL is wrong

### Test 2: Can it detect BPM?
```bash
# Create a test audio file first, then:
curl -X POST https://rootsaibackend.onrender.com/detect-bpm \
  -F "file=@test-audio.wav" \
  -v
```

**Expected**: `{ "bpm": 123 }`
**If it fails**: Endpoint doesn't exist or has wrong name

### Test 3: Check CORS
Look at the response headers from Test 2. You need:
```
Access-Control-Allow-Origin: * (or your frontend domain)
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## ✅ Quick Fix Options

### Option 1: Wake Up Your Backend (If Using Render Free Tier)
1. Visit `https://rootsaibackend.onrender.com` in browser
2. Wait 30-60 seconds for it to wake up
3. Try your app again

### Option 2: Keep Backend Alive
Add this to your backend (Python):
```python
# Keep-alive endpoint
@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200
```

Use a service like UptimeRobot to ping `/health` every 5 minutes.

### Option 3: Configure CORS Properly
Your Python backend needs:

```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow all origins (or specify your domain)
```

Or manually:
```python
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
    return response
```

### Option 4: Verify Endpoint Name
Make sure your backend has exactly:
```python
@app.route('/detect-bpm', methods=['POST'])
def detect_bpm():
    file = request.files['file']
    # ... librosa processing ...
    return jsonify({"bpm": detected_bpm})
```

---

## 🚀 I've Already Fixed The Frontend

### What I Added:

✅ **30-second timeout** - Won't hang forever
✅ **Better error messages** - Tells you what's wrong
✅ **User notifications** - Shows "Contacting server..." message
✅ **Detailed error handling** - Explains cold start, timeout, etc.

### What You'll See Now:

Instead of hanging forever, you'll see:
- ℹ️ "Contacting BPM detection server... (may take 10-30s on first request)"
- ❌ "Cannot connect to BPM detection server" (with helpful details)
- ⏱️ "Backend is starting up (cold start). Please wait 30 seconds and try again."

---

## 📋 Checklist Before Trying Again

- [ ] Backend URL is correct: `https://rootsaibackend.onrender.com`
- [ ] Backend has `/detect-bpm` endpoint
- [ ] Backend accepts POST with FormData file
- [ ] Backend returns JSON: `{ "bpm": <number> }`
- [ ] CORS is configured to allow your frontend domain
- [ ] Backend is awake (visit URL in browser first)

---

## 🔍 Check Backend Logs

Go to your Render dashboard and check the logs:
1. Visit render.com
2. Go to your backend service
3. Check "Logs" tab
4. Look for errors when you try to upload audio

Common issues in logs:
- `Module not found: librosa` - Missing dependency
- `CORS error` - CORS not configured
- `404 Not Found` - Wrong endpoint name
- `500 Internal Server Error` - Backend code error

---

## 🆘 Still Not Working?

### Debug Steps:

1. **Check if backend is deployed**:
   - Go to your Render dashboard
   - Verify service status is "Live"
   - Check recent deployments succeeded

2. **Test backend locally first**:
   ```bash
   # Run backend locally
   python app.py
   
   # Test locally
   curl http://localhost:5000/detect-bpm -F "file=@test.wav"
   ```

3. **Check the browser console**:
   - Open DevTools (F12)
   - Go to Network tab
   - Try uploading audio
   - Click the failed request
   - Check the error details

4. **Verify backend requirements.txt has**:
   ```
   flask
   flask-cors
   librosa
   numpy
   ```

---

## 🎯 Most Likely Solution

**Your Render backend is asleep (cold start).**

**Fix**:
1. Visit `https://rootsaibackend.onrender.com` in browser
2. Wait 30 seconds
3. Try your app again
4. First request will take 10-30 seconds (backend waking up)
5. Subsequent requests will be fast

---

## 📞 Need Your Backend Code?

If you need help with the backend code, here's the basic structure:

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import librosa
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200

@app.route('/detect-bpm', methods=['POST'])
def detect_bpm():
    try:
        # Get uploaded file
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        
        # Load audio with librosa
        y, sr = librosa.load(file, sr=None)
        
        # Detect tempo
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        
        # Return BPM
        return jsonify({"bpm": float(tempo)}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

---

**Your frontend is fixed and ready. Just need to fix the backend connection!** 🎉

