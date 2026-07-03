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

const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Missing service-account.json in the project root.');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Initialize Admin SDK
admin.initializeApp({
  credential: admin.cert(serviceAccount),
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
