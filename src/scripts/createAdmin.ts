/**
 * createAdmin.ts
 * Script to create a default Super Admin account in Firebase Auth and Firestore.
 * 
 * Run using: npx tsx src/scripts/createAdmin.ts
 */

import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function getCredential() {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

  if (clientEmail && privateKey && projectId) {
    return admin.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    });
  }

  const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    return admin.cert(serviceAccount);
  }

  console.error('❌ Missing Firebase Admin credentials in environment variables or service-account.json');
  process.exit(1);
}

// Initialize Admin SDK
admin.initializeApp({
  credential: getCredential(),
});

const db = getFirestore();
const auth = getAuth();

async function createSuperAdmin() {
  const adminEmail = 'reachonpeak@gmail.com';
  const adminPassword = 'Admin@123';

  console.log(`🚀 Creating default Super Admin account (${adminEmail})...`);

  try {
    let userRecord;
    try {
      // Check if user already exists in Auth
      userRecord = await auth.getUserByEmail(adminEmail);
      console.log('ℹ️ User already exists in Firebase Auth. Updating password to ensure match...');
      await auth.updateUser(userRecord.uid, {
        password: adminPassword,
      });
      console.log('✅ Password successfully updated in Firebase Auth.');
    } catch (authError: any) {
      if (authError.code === 'auth/user-not-found') {
        // Create user in Auth
        userRecord = await auth.createUser({
          email: adminEmail,
          password: adminPassword,
          displayName: 'Super Admin',
          emailVerified: true,
        });
        console.log('✅ User successfully created in Firebase Auth.');
      } else {
        throw authError;
      }
    }

    // Upsert user profile document in Firestore
    const userRef = db.collection('users').doc(userRecord.uid);
    await userRef.set({
      email: adminEmail,
      displayName: 'Super Admin',
      phone: '',
      photoURL: '',
      role: 'superadmin',
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    });

    console.log('✅ Firestore profile document set to role "superadmin".');
    console.log('\n🎉 Default Super Admin credentials:');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log('👉 You can now navigate to http://localhost:3000/#/admin/login to access the dashboard.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create Super Admin account:', error);
    process.exit(1);
  }
}

createSuperAdmin();
