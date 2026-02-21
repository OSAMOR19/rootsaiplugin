/**
 * Essentia.js WASM Initialization Module
 * 
 * This module provides a singleton instance of Essentia for server-side audio analysis.
 * It handles WASM loading and initialization properly for both local and Vercel environments.
 */

// Try to import Essentia modules - handle both Node.js and edge runtime
let EssentiaWASMModule: any;
let EssentiaModule: any;

try {
  // For Node.js runtime (local development and Vercel Node functions)
  EssentiaWASMModule = require('essentia.js/dist/essentia-wasm.umd');
  EssentiaModule = require('essentia.js/dist/essentia.js-core.umd');
} catch (error) {
  console.warn('⚠️ Could not load Essentia via require, trying alternative paths:', error);
  
  // Try alternative loading method
  try {
    const essentia = require('essentia.js');
    EssentiaWASMModule = essentia.EssentiaWASM;
    EssentiaModule = essentia.Essentia;
  } catch (error2) {
    console.error('❌ Failed to load Essentia.js modules:', error2);
  }
}

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
      
      // Check if modules were loaded
      if (!EssentiaWASMModule || !EssentiaModule) {
        throw new Error('Essentia.js modules not loaded. Make sure essentia.js is installed.');
      }
      
      // Step 1: Initialize the WASM backend
      const EssentiaWASM = EssentiaWASMModule.EssentiaWASM || EssentiaWASMModule.default || EssentiaWASMModule;
      
      console.log('🔧 Loading WASM module...', {
        hasEssentiaWASM: !!EssentiaWASM,
        type: typeof EssentiaWASM
      });
      
      // Step 2: Create the Essentia instance with the WASM backend
      const Essentia = EssentiaModule.Essentia || EssentiaModule.default || EssentiaModule;
      
      console.log('🔧 Creating Essentia instance...', {
        hasEssentia: !!Essentia,
        type: typeof Essentia
      });
      
      // The Essentia constructor expects the WASM module to be globally available
      // We need to set it up correctly for serverless environments
      if (typeof global !== 'undefined') {
        (global as any).EssentiaWASM = EssentiaWASM;
      }
      if (typeof globalThis !== 'undefined') {
        (globalThis as any).EssentiaWASM = EssentiaWASM;
      }
      
      // Initialize Essentia instance (it will use the global EssentiaWASM)
      const essentia = new Essentia(EssentiaWASM);
      
      console.log('✅ Essentia.js WASM initialized successfully');
      
      // Log available algorithms for debugging
      if (essentia.arrayToVector) {
        console.log('📊 Essentia instance created with algorithm access');
      }
      
      // Test that basic methods work
      try {
        const testArray = new Float32Array([0, 1, 0, -1]);
        const testVector = essentia.arrayToVector(testArray);
        console.log('✅ Essentia methods verified working');
      } catch (testError) {
        console.warn('⚠️ Essentia method test failed:', testError);
      }
      
      ESSENTIA = essentia;
      return ESSENTIA;
    } catch (error) {
      console.error('❌ Failed to initialize Essentia.js:', error);
      console.error('Error details:', error instanceof Error ? error.stack : error);
      console.error('Environment:', {
        platform: typeof process !== 'undefined' ? process.platform : 'unknown',
        runtime: typeof process !== 'undefined' && process.versions ? process.versions : 'unknown',
        hasGlobal: typeof global !== 'undefined',
        hasGlobalThis: typeof globalThis !== 'undefined'
      });
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
