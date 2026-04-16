/**
 * Migration script to add doctorType field to existing procarenepal_doctors documents
 * 
 * This script ensures backward compatibility by adding doctorType: 'individual'
 * to all existing individual doctor documents.
 * 
 * Usage:
 *   node scripts/migrate-doctor-type.js
 * 
 * Make sure to set up Firebase admin SDK credentials before running.
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') })

// Initialize Firebase Admin
// Note: You'll need to set up Firebase Admin SDK credentials
// For local development, you can use a service account JSON file
// For production, use environment variables or Cloud Functions

let db
try {
  // Try to initialize with service account if available
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    initializeApp({
      credential: cert(serviceAccount),
    })
  } else {
    // Use default credentials (for Cloud Functions or local emulator)
    initializeApp()
  }
  db = getFirestore()
} catch (error) {
  console.error('Error initializing Firebase Admin:', error)
  console.error('Please ensure Firebase Admin SDK is properly configured.')
  process.exit(1)
}

async function migrateDoctorType() {
  console.log('Starting migration: Adding doctorType to procarenepal_doctors...')
  
  try {
    const doctorsRef = db.collection('procarenepal_doctors')
    const snapshot = await doctorsRef.get()
    
    if (snapshot.empty) {
      console.log('No doctors found in procarenepal_doctors collection.')
      return
    }

    console.log(`Found ${snapshot.size} doctors to migrate.`)
    
    const batch = db.batch()
    let batchCount = 0
    let updatedCount = 0

    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      
      // Only update if doctorType is missing or null
      if (!data.doctorType || data.doctorType === null) {
        batch.update(doc.ref, {
          doctorType: 'individual',
          updatedAt: new Date(),
        })
        updatedCount++
        batchCount++

        // Firestore batches are limited to 500 operations
        if (batchCount >= 500) {
          console.log(`Committing batch of ${batchCount} updates...`)
          batch.commit()
          batchCount = 0
        }
      }
    })

    // Commit remaining updates
    if (batchCount > 0) {
      console.log(`Committing final batch of ${batchCount} updates...`)
      await batch.commit()
    }

    console.log(`Migration completed successfully!`)
    console.log(`Updated ${updatedCount} doctor documents with doctorType: 'individual'`)
    console.log(`Skipped ${snapshot.size - updatedCount} documents (already had doctorType)`)
  } catch (error) {
    console.error('Error during migration:', error)
    throw error
  }
}

// Run migration
migrateDoctorType()
  .then(() => {
    console.log('Migration script completed.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration script failed:', error)
    process.exit(1)
  })
