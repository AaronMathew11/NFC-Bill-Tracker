import React, { useState } from 'react';
import ViewBills from './viewBills';
import ViewUsers from './viewUsers';
import Overview from './overview';
import DirectPaymentForm from '../Components/DirectPaymentForm';
import EventLogs from './eventLogs';
import Ledger from './ledger';
import { BarChart3, FileText, Users, CreditCard, Activity, Book, User } from 'lucide-react';
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
    { id: 'viewUsers', label: 'Users', icon: Users },
    { id: 'directPayments', label: 'Payments', icon: CreditCard },
    { id: 'eventLogs', label: 'Logs', icon: Activity },
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

      {/* Tab Navigation (Mobile Pills) */}
      <div className="px-6 py-4 bg-white border-b">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  activeTab === item.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <IconComponent size={16} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">
        {activeTab === 'overview' && <Overview />}
        {activeTab === 'viewBills' && <ViewBills />}
        {activeTab === 'viewUsers' && <ViewUsers />}
        {activeTab === 'directPayments' && <DirectPaymentForm />}
        {activeTab === 'eventLogs' && <EventLogs />}
        {activeTab === 'ledger' && <Ledger />}
      </div>
    </div>
  );
}
