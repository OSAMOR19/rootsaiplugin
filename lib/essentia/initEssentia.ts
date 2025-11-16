/**
 * Essentia.js WASM Initialization Module
 * 
 * This module provides a singleton instance of Essentia for server-side audio analysis.
 * It handles WASM loading and initialization properly.
 */

// Import both the WASM backend and the core API
const EssentiaWASMModule = require('essentia.js/dist/essentia-wasm.umd');
const EssentiaModule = require('essentia.js/dist/essentia.js-core.umd');

let ESSENTIA: any = null;
let readyPromise: Promise<any> | null = null;

/**
 * Initialize Essentia WASM module
 * This is a singleton - subsequent calls return the same instance
 */
export async function initEssentia() {
  if (ESSENTIA) return ESSENTIA;
  if (readyPromise) return readyPromise;

  readyPromise = (async () => {
    try {
      console.log('🎵 Initializing Essentia.js WASM...');
      
      // Step 1: Initialize the WASM backend
      const EssentiaWASM = EssentiaWASMModule.EssentiaWASM || EssentiaWASMModule.default || EssentiaWASMModule;
      
      console.log('🔧 Loading WASM module...');
      
      // Step 2: Create the Essentia instance with the WASM backend
      const Essentia = EssentiaModule.Essentia || EssentiaModule.default || EssentiaModule;
      
      // The Essentia constructor expects the WASM module to be globally available
      // We need to set it up correctly
      if (typeof global !== 'undefined') {
        (global as any).EssentiaWASM = EssentiaWASM;
      }
      
      // Initialize Essentia instance (it will use the global EssentiaWASM)
      const essentia = new Essentia(EssentiaWASM);
      
      console.log('✅ Essentia.js WASM initialized successfully');
      
      // Log available algorithms
      if (essentia.arrayToVector) {
        console.log('📊 Essentia instance created with algorithm access');
      }
      
      ESSENTIA = essentia;
      return ESSENTIA;
    } catch (error) {
      console.error('❌ Failed to initialize Essentia.js:', error);
      console.error('Error details:', error instanceof Error ? error.stack : error);
      readyPromise = null; // Reset so we can retry
      throw error;
    }
  })();

  return readyPromise;
}

/**
 * Get the initialized Essentia instance
 * Throws if Essentia hasn't been initialized yet
 */
export function getEssentiaInstance() {
  if (!ESSENTIA) {
    throw new Error('Essentia not initialized. Call initEssentia() first.');
  }
  return ESSENTIA;
}

/**
 * Check if Essentia is initialized
 */
export function isEssentiaReady(): boolean {
  return ESSENTIA !== null;
}
