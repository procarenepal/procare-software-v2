/**
 * Test utility for clinic deletion functionality
 * Use this script to test the comprehensive clinic deletion system
 * 
 * Usage:
 * npm run dev:script -- scripts/test-clinic-deletion.ts [clinicId]
 */

import { clinicService } from '../src/services/clinicService';
import { auth } from '../src/config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

// Test configuration
const TEST_CONFIG = {
  // Set these values for testing
  SUPER_ADMIN_EMAIL: 'super-admin@example.com',
  SUPER_ADMIN_PASSWORD: 'your-password',
  
  // Test clinic ID (optional - will be prompted if not provided)
  TEST_CLINIC_ID: '',
};

async function authenticateAsSuperAdmin() {
  try {
    console.log('🔐 Authenticating as super admin...');
    await signInWithEmailAndPassword(
      auth,
      TEST_CONFIG.SUPER_ADMIN_EMAIL,
      TEST_CONFIG.SUPER_ADMIN_PASSWORD
    );
    console.log('✅ Authentication successful');
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    throw error;
  }
}

async function testClinicDeletion(clinicId: string) {
  try {
    console.log('\n🏥 Testing clinic deletion for ID:', clinicId);
    
    // First verify the clinic exists
    console.log('📋 Verifying clinic exists...');
    const clinic = await clinicService.getClinicById(clinicId);
    
    if (!clinic) {
      console.error('❌ Clinic not found with ID:', clinicId);
      return;
    }
    
    console.log('✅ Clinic found:', {
      name: clinic.name,
      email: clinic.email,
      status: clinic.subscriptionStatus,
      createdAt: clinic.createdAt
    });
    
    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will permanently delete ALL data for this clinic!');
    console.log('📊 This includes:');
    console.log('   • All users and permissions');
    console.log('   • All patient records');
    console.log('   • All appointments');
    console.log('   • All medicine data');
    console.log('   • All branches and settings');
    console.log('   • The clinic itself');
    
    // In a real test, you might want to add actual confirmation prompt
    // For now, we'll just simulate the deletion (comment out the actual call)
    
    console.log('\n🚀 Starting comprehensive deletion...');
    
    // UNCOMMENT THE LINE BELOW TO ACTUALLY PERFORM DELETION
    // const result = await clinicService.deleteClinicWithAllData(clinicId);
    
    // COMMENT OUT THE LINES BELOW WHEN TESTING ACTUAL DELETION
    console.log('⚠️  Simulated deletion (actual deletion is commented out for safety)');
    const result = {
      deletedCounts: {
        userRoleAssignments: 12,
        roles: 5,
        medical_report_responses: 34,
        patient_note_entries: 67,
        patient_notes: 23,
        medical_report_fields: 8,
        notes_sections: 4,
        appointments: 89,
        appointment_types: 6,
        patients: 45,
        doctors: 8,
        branches: 2,
        users: 15,
        clinic: 1
      }
    };
    
    console.log('\n✅ Deletion completed successfully!');
    console.log('📈 Deletion summary:');
    
    Object.entries(result.deletedCounts).forEach(([key, count]) => {
      const formattedKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/^./, str => str.toUpperCase());
      console.log(`   • ${formattedKey}: ${count}`);
    });
    
    const totalDeleted = Object.values(result.deletedCounts).reduce((sum, count) => sum + count, 0);
    console.log(`\n🎯 Total records deleted: ${totalDeleted}`);
    
  } catch (error) {
    console.error('❌ Error during clinic deletion test:', error);
    throw error;
  }
}

async function listClinicsForTesting() {
  try {
    console.log('\n📋 Available clinics for testing:');
    const clinics = await clinicService.getAllClinics();
    
    if (clinics.length === 0) {
      console.log('   No clinics found');
      return;
    }
    
    clinics.forEach((clinic, index) => {
      console.log(`   ${index + 1}. ${clinic.name} (${clinic.id})`);
      console.log(`      Email: ${clinic.email}`);
      console.log(`      Status: ${clinic.subscriptionStatus}`);
      console.log(`      Created: ${clinic.createdAt.toLocaleDateString()}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error listing clinics:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🧪 Clinic Deletion Test Utility');
    console.log('================================\n');
    
    // Authenticate
    await authenticateAsSuperAdmin();
    
    // Get clinic ID from command line args or config
    const args = process.argv.slice(2);
    let clinicId = args[0] || TEST_CONFIG.TEST_CLINIC_ID;
    
    if (!clinicId) {
      await listClinicsForTesting();
      console.log('❌ No clinic ID provided. Please provide a clinic ID as an argument.');
      console.log('Usage: npm run dev:script -- scripts/test-clinic-deletion.ts [clinicId]');
      return;
    }
    
    await testClinicDeletion(clinicId);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Sign out
    try {
      await auth.signOut();
      console.log('\n🔓 Signed out successfully');
    } catch (error) {
      console.error('Warning: Failed to sign out:', error);
    }
  }
}

// Safety check - prevent accidental execution
if (process.env.NODE_ENV === 'production') {
  console.error('❌ This script cannot be run in production environment!');
  process.exit(1);
}

// Run the test
main().catch(console.error); 