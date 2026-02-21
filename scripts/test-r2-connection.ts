/**
 * Simple script to test R2 connection
 * Run with: npx tsx scripts/test-r2-connection.ts
 */

import { listFiles } from '../lib/r2';

async function testConnection() {
  console.log('🧪 Testing Cloudflare R2 Connection...\n');

  try {
    console.log('📡 Fetching file list from R2...');
    const result = await listFiles();

    console.log('\n✅ Connection successful!');
    console.log(`📊 Found ${result.count} file(s) in bucket\n`);

    if (result.files.length > 0) {
      console.log('📁 Files:');
      result.files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.key}`);
        console.log(`      Size: ${(file.size / 1024).toFixed(2)} KB`);
        console.log(`      URL: ${file.url}`);
        console.log('');
      });
    } else {
      console.log('💡 No files found. Upload your first file at /r2-demo');
    }

    console.log('✨ R2 integration is working correctly!\n');
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error instanceof Error ? error.message : error);
    console.error('\n📋 Checklist:');
    console.error('   1. Have you created .env.local?');
    console.error('   2. Are all R2 environment variables set?');
    console.error('   3. Are your R2 credentials correct?');
    console.error('   4. Does the bucket exist?');
    console.error('   5. Does your API token have read/write permissions?\n');
    process.exit(1);
  }
}

testConnection();

