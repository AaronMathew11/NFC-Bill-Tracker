// Firebase configuration test
console.log('🔥 Firebase Environment Variables Check:');
console.log('API Key:', process.env.REACT_APP_FIREBASE_API_KEY ? 'SET' : 'MISSING');
console.log('Auth Domain:', process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? 'SET' : 'MISSING');
console.log('Project ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID ? 'SET' : 'MISSING');
console.log('Storage Bucket:', process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ? 'SET' : 'MISSING');
console.log('Messaging Sender ID:', process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ? 'SET' : 'MISSING');
console.log('App ID:', process.env.REACT_APP_FIREBASE_APP_ID ? 'SET' : 'MISSING');

// Export for use in other files
export const firebaseEnvCheck = () => {
  const missing = [];
  if (!process.env.REACT_APP_FIREBASE_API_KEY) missing.push('REACT_APP_FIREBASE_API_KEY');
  if (!process.env.REACT_APP_FIREBASE_AUTH_DOMAIN) missing.push('REACT_APP_FIREBASE_AUTH_DOMAIN');
  if (!process.env.REACT_APP_FIREBASE_PROJECT_ID) missing.push('REACT_APP_FIREBASE_PROJECT_ID');
  if (!process.env.REACT_APP_FIREBASE_STORAGE_BUCKET) missing.push('REACT_APP_FIREBASE_STORAGE_BUCKET');
  if (!process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID) missing.push('REACT_APP_FIREBASE_MESSAGING_SENDER_ID');
  if (!process.env.REACT_APP_FIREBASE_APP_ID) missing.push('REACT_APP_FIREBASE_APP_ID');
  
  return {
    allSet: missing.length === 0,
    missing
  };
};