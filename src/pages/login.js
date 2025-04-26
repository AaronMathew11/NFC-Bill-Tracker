import { SignIn } from '@clerk/clerk-react';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">


        {/* SignIn Component with customized appearance */}
        <SignIn
          redirectUrl="/user"
          appearance={{
            elements: {
              formButtonPrimary:
                'bg-blue-600 text-white hover:bg-blue-700 py-3 rounded-lg text-lg font-semibold focus:outline-none w-full', // Primary button
              formButtonSecondary:
                'bg-gray-200 text-gray-700 hover:bg-gray-300 py-3 rounded-lg text-lg font-semibold focus:outline-none w-full', // Secondary button
              inputField:
                'border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg', // Input fields
              headerTitle: 'text-2xl font-bold text-gray-900 mb-4', // Title styling
              form: 'space-y-4', // Space between form fields
              link: 'text-blue-600 hover:underline', // Link styling (for sign up and forgot password)
              footer: 'text-center text-sm text-gray-500 mt-4', // Footer for extra info like "Don't have an account?"
            },
          }}
        />

    </div>
  );
}
