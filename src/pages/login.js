import { useState } from 'react';
import GoogleAuth from '../Components/GoogleAuth';
import DevModeAuth from '../Components/DevModeAuth';
import { FileText, Code } from 'lucide-react';

export default function Login() {
  const [showDevMode, setShowDevMode] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-4 overflow-y-auto">
      <div className="flex flex-col items-center justify-center min-h-screen py-8">
        
        {/* App Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500 rounded-xl mb-3 shadow-md">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            Church Bills Tracker
          </h1>
          <p className="text-gray-600 text-sm">
            Neon Family Church
          </p>
        </div>

        <div className="w-full max-w-sm">
          {/* Mode Toggle */}
          <div className="mb-6 text-center">
            <div className="inline-flex bg-white rounded-lg p-0.5 shadow-sm border border-gray-200">
              <button
                onClick={() => setShowDevMode(false)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium transition-all ${
                  !showDevMode 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="w-3 h-3" />
                Google Login
              </button>
              <button
                onClick={() => setShowDevMode(true)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium transition-all ${
                  showDevMode 
                    ? 'bg-orange-500 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Code className="w-3 h-3" />
                Dev Mode
              </button>
            </div>
          </div>

          {/* Conditional Rendering */}
          {showDevMode ? (
            <DevModeAuth />
          ) : (
            <GoogleAuth />
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Secure financial management for your church</p>
        </div>
      </div>
    </div>
  );
}
