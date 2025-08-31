import { useState } from 'react';
import { Code, User, Shield } from 'lucide-react';
import { useDevMode } from '../contexts/DevModeContext';

const DEV_USERS = [
  { email: 'aaron+user@gmail.com', role: 'user', name: 'Aaron', displayName: 'Aaron (User)' },
  { email: 'rachit+user@gmail.com', role: 'user', name: 'Rachit', displayName: 'Rachit (User)' },
  { email: 'aaron+admin@gmail.com', role: 'admin', name: 'Aaron', displayName: 'Aaron (Admin)' },
  { email: 'rachit+admin@gmail.com', role: 'admin', name: 'Rachit', displayName: 'Rachit (Admin)' }
];

export default function DevModeAuth() {
  const [selectedUser, setSelectedUser] = useState('');
  const { signIn } = useDevMode();

  const handleDevLogin = () => {
    if (!selectedUser) return;
    
    const user = DEV_USERS.find(u => u.email === selectedUser);
    if (user) {
      const userData = {
        id: user.email.replace('@gmail.com', '').replace('+', '_'),
        email: user.email,
        firstName: user.name,
        lastName: '',
        publicMetadata: {
          id: user.email.replace('@gmail.com', '').replace('+', '_'),
          role: user.role
        }
      };

      // Use the context method to update state immediately
      signIn(userData);
      
      // Force navigation and reload
      if (user.role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/user';
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 w-full max-w-sm">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg mb-3">
          <Code className="w-5 h-5 text-orange-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Dev Mode Login</h2>
        <p className="text-gray-600 text-xs">Select a test account to continue</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Development Account
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-gray-50 transition-all text-sm"
          >
            <option value="">Choose a dev user...</option>
            {DEV_USERS.map((user) => (
              <option key={user.email} value={user.email}>
                {user.displayName}
              </option>
            ))}
          </select>
        </div>
        
        {/* User Cards for better UX */}
        <div className="grid grid-cols-2 gap-2">
          {DEV_USERS.map((user) => (
            <button
              key={user.email}
              onClick={() => setSelectedUser(user.email)}
              className={`p-2.5 rounded-lg border transition-all text-left ${
                selectedUser === user.email
                  ? 'border-orange-500 bg-orange-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                {user.role === 'admin' ? (
                  <Shield className="w-3 h-3 text-purple-600" />
                ) : (
                  <User className="w-3 h-3 text-blue-600" />
                )}
                <span className="font-medium text-xs text-gray-900">{user.name}</span>
              </div>
              <span className={`text-xs ${
                user.role === 'admin' ? 'text-purple-600' : 'text-blue-600'
              }`}>
                {user.role}
              </span>
            </button>
          ))}
        </div>
        
        <button
          onClick={handleDevLogin}
          disabled={!selectedUser}
          className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md text-sm"
        >
          Login as Dev User
        </button>
      </div>
    </div>
  );
}