/**
 * runSeeder.ts
 * Wrapper script to run seedFirestore.ts by temporarily mocking image imports in data.ts.
 * This prevents the ERR_UNKNOWN_FILE_EXTENSION error during Node.js execution.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const dataPath = path.resolve(process.cwd(), 'src/data.ts');
const originalContent = fs.readFileSync(dataPath, 'utf8');

try {
  console.log('🔄 Temporarily mocking image imports in data.ts...');
  
  // Replace the image imports with string constants
  let mockedContent = originalContent
    .replace("import butterChickenImg from './assets/butter_chicken.jpg';", "const butterChickenImg = 'butter_chicken_mock';")
    .replace("import dalMakhaniImg from './assets/dal_makhani.jpg';", "const dalMakhaniImg = 'dal_makhani_mock';")
    .replace("import malaiTikkaImg from './assets/malai_tikka.jpg';", "const malaiTikkaImg = 'malai_tikka_mock';");

  fs.writeFileSync(dataPath, mockedContent, 'utf8');

  console.log('🌱 Launching Firestore Seeder...');
  execSync('npx tsx src/scripts/seedFirestore.ts', { stdio: 'inherit' });

} catch (error) {
  console.error('❌ Seeder execution failed:', error);
} finally {
  console.log('🔄 Restoring original data.ts file...');
  fs.writeFileSync(dataPath, originalContent, 'utf8');
  console.log('✅ Restoration complete.');
}
