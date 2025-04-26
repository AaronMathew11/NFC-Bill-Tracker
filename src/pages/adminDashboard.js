import React, { useState } from 'react';
import ViewBills from './viewBills';
import ViewUsers from './viewUsers';
import Overview from './overview';
import { Menu, X } from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';


export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut } = useClerk();


  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full bg-white shadow-lg p-6 w-64 flex flex-col justify-between transition-transform duration-300 z-50 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-8 mt-12 text-center">NFC Bill Tracker</h2>
          
          <nav className="space-y-4">
            <button
              onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-100 ${activeTab === 'overview' ? 'bg-blue-200 font-semibold' : ''}`}
            >
              Overview
            </button>
            <button
              onClick={() => { setActiveTab('viewBills'); setSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-100 ${activeTab === 'viewBills' ? 'bg-blue-200 font-semibold' : ''}`}
            >
              View Bills
            </button>
            <button
              onClick={() => { setActiveTab('viewUsers'); setSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-100 ${activeTab === 'viewUsers' ? 'bg-blue-200 font-semibold' : ''}`}
            >
              View Users
            </button>
          </nav>
        </div>

        {/* Logout Button */}
        <div className="mt-10">
          <button
             onClick={() => signOut()}
            className="w-full text-left px-4 py-3 rounded-lg text-red-500 hover:bg-red-100"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Hamburger Button */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md md:hidden"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto ml-0 md:ml-64">

        {/* Tabs Navigation (Desktop version) */}
        <div className="hidden md:flex justify-center mb-6">
          <div className="flex space-x-4 border-b border-gray-300">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 px-4 text-lg font-semibold ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            >
              Overview
            </button>

            <button
              onClick={() => setActiveTab('viewBills')}
              className={`pb-2 px-4 text-lg font-semibold ${activeTab === 'viewBills' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            >
              View Bills
            </button>

            <button
              onClick={() => setActiveTab('viewUsers')}
              className={`pb-2 px-4 text-lg font-semibold ${activeTab === 'viewUsers' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            >
              View Users
            </button>
          </div>
        </div>

        {/* Content Display */}
        <div className="max-w-7xl mx-auto">
          {activeTab === 'overview' && <Overview />}
          {activeTab === 'viewBills' && <ViewBills />}
          {activeTab === 'viewUsers' && <ViewUsers />}
        </div>
      </div>
    </div>
  );
}
