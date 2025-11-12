"""
WORKING BPM DETECTION BACKEND
Optimized for Render deployment with fast librosa BPM detection

Deploy this to Render and it WILL work!
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import librosa
import numpy as np
import tempfile
import os
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Enable CORS for all routes
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    logger.info("Health check requested")
    return jsonify({
        "status": "online",
        "service": "BPM Detection API",
        "version": "1.0.0"
    }), 200

@app.route('/detect-bpm', methods=['POST', 'OPTIONS'])
def detect_bpm():
    """
    BPM Detection endpoint
    Accepts audio file and returns detected BPM using librosa
    """
    
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        logger.info("CORS preflight request")
        return '', 200
    
    temp_path = None
    
    try:
        logger.info("=" * 50)
        logger.info("📥 BPM Detection Request Received")
        logger.info(f"Request method: {request.method}")
        logger.info(f"Content-Type: {request.content_type}")
        logger.info(f"Files in request: {list(request.files.keys())}")
        
        # Check if file was uploaded
        if 'file' not in request.files:
            logger.error("❌ No 'file' in request.files")
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            logger.error("❌ Empty filename")
            return jsonify({"error": "Empty filename"}), 400
        
        logger.info(f"📁 File received: {file.filename}")
        logger.info(f"📊 File size: {len(file.read())} bytes")
        file.seek(0)  # Reset file pointer after reading size
        
        # Save to temporary file
        logger.info("💾 Saving to temporary file...")
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        
        logger.info(f"✅ Saved to: {temp_path}")
        
        # Load audio with librosa (optimized settings)
        logger.info("🎵 Loading audio with librosa...")
        logger.info("   Settings: sr=22050, duration=30s, mono=True")
        
        y, sr = librosa.load(
            temp_path,
            sr=22050,      # Lower sample rate for faster processing
            duration=30,   # Only analyze first 30 seconds
            mono=True      # Convert to mono for faster processing
        )
        
        audio_duration = len(y) / sr
        logger.info(f"✅ Audio loaded successfully")
        logger.info(f"   Duration: {audio_duration:.2f} seconds")
        logger.info(f"   Sample rate: {sr} Hz")
        logger.info(f"   Samples: {len(y)}")
        
        # Detect BPM
        logger.info("🔍 Detecting BPM...")
        
        tempo, beats = librosa.beat.beat_track(
            y=y,
            sr=sr,
            start_bpm=120,  # Starting hint
            units='bpm'
        )
        
        bpm = float(tempo)
        logger.info(f"✅ BPM DETECTED: {bpm}")
        logger.info(f"   Number of beats detected: {len(beats)}")
        
        # Clean up temp file
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
            logger.info("🗑️  Temp file cleaned up")
        
        logger.info(f"🎉 SUCCESS - Returning BPM: {bpm}")
        logger.info("=" * 50)
        
        return jsonify({"bpm": bpm}), 200
        
    except Exception as e:
        logger.error("=" * 50)
        logger.error(f"❌ ERROR occurred: {str(e)}")
        logger.error("Stack trace:", exc_info=True)
        
        # Clean up temp file if it exists
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
                logger.info("🗑️  Temp file cleaned up after error")
            except Exception as cleanup_error:
                logger.error(f"Failed to clean up temp file: {cleanup_error}")
        
        return jsonify({
            "error": str(e),
            "type": type(e).__name__
        }), 500

@app.route('/', methods=['GET'])
def root():
    """Root endpoint"""
    return jsonify({
        "message": "BPM Detection API",
        "endpoints": {
            "/health": "GET - Health check",
            "/detect-bpm": "POST - Detect BPM from audio file"
        }
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    logger.info("=" * 50)
    logger.info(f"🚀 Starting BPM Detection API")
    logger.info(f"   Port: {port}")
    logger.info(f"   Environment: {os.environ.get('RENDER', 'local')}")
    logger.info("=" * 50)
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False  # MUST be False in production
    )

