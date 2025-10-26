// Predefined admin emails
const ADMIN_EMAILS = [
  'rachitfrancis28@gmail.com',
  'aaronstone11.2001@gmail.com', 
  'manuthemathew@gmail.com'
];

// Check if user is an admin based on email
export function isAdminUser(email) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// Get user role based on email
export function getUserRole(email) {
  return isAdminUser(email) ? 'admin' : 'user';
}

// Check if user is authorized (has valid email domain or is in admin list)
export function isAuthorizedUser(email) {
  if (!email) return false;
  
  // Allow gmail and hyperverge domains
  const allowedDomains = ['gmail.com', 'hyperverge.co'];
  const emailDomain = email.toLowerCase().split('@')[1];
  
  return allowedDomains.includes(emailDomain) || isAdminUser(email);
}

// Enhanced user data with role information
export function enhanceUserWithRole(clerkUser) {
  if (!clerkUser) return null;

  const email = clerkUser.primaryEmailAddress?.emailAddress;
  const role = getUserRole(email);
  
  return {
    ...clerkUser,
    role,
    isAdmin: role === 'admin',
    publicMetadata: {
      ...clerkUser.publicMetadata,
      role,
      id: clerkUser.id
    }
  };
}