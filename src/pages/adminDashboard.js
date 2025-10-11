import React, { useState } from 'react';
import ViewBills from './viewBills';
import Overview from './overview';
import DirectPaymentForm from '../Components/DirectPaymentForm';
import Ledger from './ledger';
import { BarChart3, FileText, CreditCard, Book, User } from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';
import { useDevMode } from '../contexts/DevModeContext';


export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { signOut: clerkSignOut } = useClerk();
  const { signOut: devSignOut, isDevMode } = useDevMode();

  const handleSignOut = () => {
    if (isDevMode) {
      devSignOut();
      window.location.href = '/login';
    } else {
      clerkSignOut();
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'viewBills', label: 'Bills', icon: FileText },
    { id: 'directPayments', label: 'Pay', icon: CreditCard },
    { id: 'ledger', label: 'Ledger', icon: Book }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-600">Manage bills and payments</p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
          >
            <User size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4 pb-24">
        {activeTab === 'overview' && <Overview />}
        {activeTab === 'viewBills' && <ViewBills />}
        {activeTab === 'directPayments' && <DirectPaymentForm />}
        {activeTab === 'ledger' && <Ledger />}
      </div>

      {/* Bottom Navigation - 4 items */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb">
        <div className="flex justify-around items-center px-1 py-2">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center p-1.5 rounded-lg transition ${
                  activeTab === item.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <IconComponent size={18} className={activeTab === item.id ? 'text-blue-600' : 'text-gray-500'} />
                <span className={`text-xs mt-1 font-medium ${
                  activeTab === item.id ? 'text-blue-600' : 'text-gray-500'
                }`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}