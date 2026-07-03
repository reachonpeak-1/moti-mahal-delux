/**
 * seedFirestore.ts
 * Seeding script to migrate existing static data (categories, menu items, hero sliders, gallery)
 * from data.ts to Firestore using Firebase Admin SDK.
 * 
 * Run using: npx tsx src/scripts/runSeeder.ts
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { MENU_ITEMS, CATEGORIES, HERO_SLIDES } from '../data';

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

async function seed() {
  console.log('🚀 Seeding Moti Mahal Delux Firestore Database via Admin SDK...');

  try {
    const batch = db.batch();

    // 1. Seed Categories
    console.log('📦 Seeding Categories...');
    CATEGORIES.forEach((cat, index) => {
      // Exclude 'all' category from Firestore items since it's client-side helper
      if (cat.id === 'all') return;
      const ref = db.collection('categories').doc(cat.id);
      batch.set(ref, {
        name: cat.name,
        image: cat.image,
        sortOrder: index,
        isActive: true,
      });
    });

    // 2. Seed Menu Items
    console.log('🍲 Seeding Menu Items...');
    MENU_ITEMS.forEach((item, index) => {
      const ref = db.collection('menuItems').doc(item.id);
      
      // Resolve image url (in static code it might be imported modules, we fallback to unsplash placeholders for seeder if not resolved)
      let resolvedImage = item.image;
      if (resolvedImage.startsWith('/src/assets') || resolvedImage.startsWith('data:') || resolvedImage.includes('butter_chicken') || resolvedImage.includes('dal_makhani') || resolvedImage.includes('malai_tikka')) {
        // Fallback placeholders for local imports
        if (item.id === 'moti-butter-chicken') {
          resolvedImage = 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=600';
        } else if (item.id === 'moti-dal-makhani') {
          resolvedImage = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=600';
        } else if (item.id === 'moti-malai-tikka') {
          resolvedImage = 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=600';
        } else {
          resolvedImage = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=600';
        }
      }

      batch.set(ref, {
        name: item.name,
        description: item.description,
        price: item.price,
        image: resolvedImage,
        category: item.category,
        calories: item.calories || 0,
        spiceLevel: item.spiceLevel || 0,
        prepTime: item.prepTime || '15 mins',
        isBestSeller: !!item.isBestSeller,
        isChefSpecial: !!item.isChefSpecial,
        isTodaySpecial: !!item.isTodaySpecial,
        isVegetarian: !!item.isVegetarian,
        ingredients: item.ingredients || [],
        allergens: item.allergens || [],
        nutritionalInfo: item.nutritionalInfo || { protein: '0g', carbs: '0g', fat: '0g' },
        chefRecommendation: item.chefRecommendation || '',
        isAvailable: true,
        sortOrder: index,
        createdAt: new Date().toISOString(),
      });
    });

    // Commit batch write
    await batch.commit();
    console.log('✅ Categories and Menu Items seeded successfully.');

    // 3. Seed Singleton Restaurant Settings
    console.log('⚙️ Seeding Restaurant Settings...');
    const settingsRef = db.collection('settings').doc('restaurant');
    
    // Format Hero slides from data.ts
    const heroSliders = HERO_SLIDES.map((slide, index) => {
      let resolvedImage = slide.image;
      if (resolvedImage.startsWith('/src/assets') || resolvedImage.startsWith('data:') || resolvedImage.includes('butter_chicken') || resolvedImage.includes('dal_makhani') || resolvedImage.includes('malai_tikka')) {
        if (slide.id === 'slide-1') {
          resolvedImage = 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=1200';
        } else if (slide.id === 'slide-2') {
          resolvedImage = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=1200';
        } else if (slide.id === 'slide-3') {
          resolvedImage = 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=1200';
        }
      }
      return {
        id: slide.id,
        image: resolvedImage,
        headline: slide.headline,
        subline: slide.subline,
        sortOrder: index,
      };
    });

    await settingsRef.set({
      restaurantName: 'G.K. Regency Complex',
      address: 'Dabwali Road, Bathinda, Punjab 151001, India',
      phone: '+91 98765 43210',
      email: 'info@gkregency.com',
      whatsappPhone: '+91 98765 43210',
      whatsappMessage: 'Hello! I would like to make an inquiry.',
      instagramUsername: 'gkregency_bathinda',
      googleMapsUrl: 'https://www.google.co.in/maps/place/G.K+Regency/@30.1801981,74.9389857,17z/data=!3m1!4b1!4m9!3m8!1s0x39172d0010c5f109:0x4b03d5773f4aec5f!5m2!4m1!1i2!8m2!3d30.1801981!4d74.9415606!16s%2Fg%2F11w3nwkgl2',
      operatingHours: {
        mon: { open: '12:00', close: '23:30', isClosed: false },
        tue: { open: '12:00', close: '23:30', isClosed: false },
        wed: { open: '12:00', close: '23:30', isClosed: false },
        thu: { open: '12:00', close: '23:30', isClosed: false },
        fri: { open: '12:00', close: '23:30', isClosed: false },
        sat: { open: '12:00', close: '23:30', isClosed: false },
        sun: { open: '12:00', close: '23:30', isClosed: false },
      },
      isOpen: true,
      closedMessage: 'Our kitchen hearth is temporarily resting. We will open shortly.',
      deliveryZone: 'Dabwali Gurumukhi Chowk Bathinda to AIIMS',
      deliveryFee: 0,
      freeDelivery: true,
      minOrderForDelivery: 100,
      heroSliders,
      galleryPhotos: [
        {
          id: 'photo-1',
          url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800',
          caption: 'Premium Banquet Table Setting',
          sortOrder: 0,
        },
      ],
      taxConfig: {
        gst: 5,
        serviceCharge: 0,
      },
      updatedAt: new Date().toISOString(),
    });

    console.log('✅ Restaurant settings seeded successfully.');
    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  }
}

seed();
