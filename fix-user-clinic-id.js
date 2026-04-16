// Quick fix script to assign clinicId to current user
// Run this in browser console if user is missing clinicId

const fixUserClinicId = async () => {
  const { auth, db } = await import('./src/config/firebase.ts');
  const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
  
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error('❌ No user authenticated');
    return;
  }
  
  // You'll need to replace this with the actual clinic ID
  const CLINIC_ID = prompt('Enter your clinic ID:');
  
  if (!CLINIC_ID) {
    console.error('❌ No clinic ID provided');
    return;
  }
  
  try {
    await updateDoc(doc(db, 'users', currentUser.uid), {
      clinicId: CLINIC_ID,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ User clinicId updated successfully');
    console.log('Please refresh the page and try again');
  } catch (error) {
    console.error('❌ Failed to update user clinicId:', error);
  }
};

// Run the fix
fixUserClinicId();
