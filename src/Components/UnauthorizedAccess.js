import { AlertTriangle, Mail } from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';

export default function UnauthorizedAccess({ userEmail }) {
  const { signOut } = useClerk();

  const handleSignOut = () => {
    signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 w-full max-w-md text-center">
        
        {/* Alert Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Access Denied
        </h2>

        {/* Message */}
        <p className="text-gray-600 text-sm mb-6">
          The email address <strong>{userEmail}</strong> is not authorized to access this application.
        </p>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <h3 className="font-medium text-blue-900 text-sm mb-1">
                Need Access?
              </h3>
              <p className="text-blue-700 text-xs">
                Contact your church administrator to be added to the authorized users list.
              </p>
            </div>
          </div>
        </div>

        {/* Authorized Emails (for admin reference) */}
        <div className="text-xs text-gray-500 mb-6">
          <p className="mb-2">Authorized admin emails:</p>
          <ul className="space-y-1">
            <li>• rachitfrancis28@gmail.com</li>
            <li>• aaronstone11.2001@gmail.com</li>
            <li>• manuthemathew@gmail.com</li>
          </ul>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="w-full bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-all shadow-sm hover:shadow-md text-sm"
        >
          Sign Out & Try Different Account
        </button>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Neon Family Church - Bills Tracker
          </p>
        </div>
      </div>
    </div>
  );
}