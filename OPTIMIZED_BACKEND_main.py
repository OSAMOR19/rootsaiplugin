from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import librosa
import numpy as np
import tempfile
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="BPM Detection API",
    description="Audio BPM detection service using Librosa",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "BPM Detection API",
        "version": "1.0.0"
    }

@app.post("/detect-bpm")
async def detect_bpm(file: UploadFile = File(...)):
    """
    Detect the BPM (Beats Per Minute) of an uploaded audio file.
    Optimized for speed - processes only first 30 seconds.
    """
    
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    # Check file extension
    allowed_extensions = {'.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aiff', '.aif'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format. Allowed formats: {', '.join(allowed_extensions)}"
        )
    
    temp_file_path = None
    try:
        logger.info(f"📁 Processing: {file.filename}")
        
        # Read uploaded file
        contents = await file.read()
        logger.info(f"📊 File size: {len(contents) / 1024 / 1024:.2f} MB")
        
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
            temp_file.write(contents)
            temp_file_path = temp_file.name
        
        logger.info(f"💾 Temp file: {temp_file_path}")
        
        # ⚡ OPTIMIZED: Only 30 seconds at 22050Hz mono
        max_duration = 30.0
        logger.info(f"🎵 Loading audio (first {max_duration}s only)...")
        
        y, sr = librosa.load(
            temp_file_path,
            sr=22050,           # ⚡ Fast sample rate
            duration=max_duration,  # ⚡ Only 30 seconds!
            mono=True           # ⚡ Mono for speed
        )
        
        logger.info(f"✅ Loaded: {len(y)/sr:.2f}s @ {sr}Hz")
        
        if len(y) == 0:
            raise HTTPException(status_code=400, detail="Empty or corrupted audio")
        
        # ⚡ SINGLE METHOD: Fast beat tracking
        logger.info("🔍 Detecting BPM...")
        
        tempo, beats = librosa.beat.beat_track(
            y=y,
            sr=sr,
            units='tempo'
        )
        
        bpm = float(tempo)
        logger.info(f"✅ BPM detected: {bpm:.2f}")
        
        # Ensure reasonable range
        if bpm < 60:
            bpm *= 2
        elif bpm > 200:
            bpm /= 2
        
        logger.info(f"🎯 Final BPM: {bpm:.2f}")
        
        # ⚡ SIMPLE RESPONSE: Just BPM (what frontend expects)
        return {"bpm": round(bpm, 2)}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    
    finally:
        # Cleanup
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
                logger.info("🗑️  Temp file cleaned")
            except Exception as e:
                logger.warning(f"Cleanup failed: {e}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

