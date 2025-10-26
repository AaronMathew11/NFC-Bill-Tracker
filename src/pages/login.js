import React from 'react';
import FirebaseAuth from '../Components/FirebaseAuth';
import DebugInfo from '../Components/DebugInfo';
import { FileText } from 'lucide-react';

export default function Login() {
  console.log('Login page - Firebase Auth only');

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
          <FirebaseAuth />
        </div>

      </div>
      
      {/* Debug Info */}
      <DebugInfo />
    </div>
  );
}
