import { useState, useEffect } from 'react';
import AddBillForm from '../Components/AddBillForm';
import { useClerk } from '@clerk/clerk-react';
import { useAuth } from '../hooks/useAuth';
import { useUserId } from '../hooks/useUserId';
import { useDevMode } from '../contexts/DevModeContext';
import { Home, Plus, FileText, Edit3, User } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const userId = useUserId();
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

  const [activePage, setActivePage] = useState('home');
  const [bills, setBills] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');

  const firstName = user?.firstName || 'User';

  useEffect(() => {
    // Reset state when user changes
    setActivePage('home');
    setBills([]);
    setStatusFilter('all');
  }, [userId]);

  useEffect(() => {
    if ((activePage === 'view' || activePage === 'home') && userId) {
      fetch(`https://nfc-bill-tracker-backend.onrender.com/api/user-bills/${userId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setBills(data.bills);
          } else {
            alert('Failed to load bills');
          }
        })
        .catch((error) => {
          console.error(error);
          alert('Failed to fetch bills');
        });
    }
  }, [activePage, userId]);

  // Calculate Request Counts by Status
  const pendingCount = bills.filter((bill) => bill.status === 'pending' && !bill.isDraft).length;
  const approvedCount = bills.filter((bill) => bill.status === 'approved').length;
  const rejectedCount = bills.filter((bill) => bill.status === 'rejected').length;
  const needsUpdateCount = bills.filter((bill) => bill.status === 'needs_update').length;
  const draftCount = bills.filter((bill) => bill.isDraft).length;
  const totalCount = bills.filter((bill) => !bill.isDraft).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Hello, {firstName}!</h1>
            <p className="text-sm text-gray-600">Manage your bills and expenses</p>
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
      <div className="px-6 py-6">

        {/* Home Screen */}
        {activePage === 'home' && (
          <div className="space-y-6">
            {/* Overview Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Request Overview</h2>
                  <p className="text-sm text-gray-500">{totalCount} total requests</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{totalCount}</div>
              <div className="text-sm text-gray-500">Total Requests Submitted</div>
            </div>

            {/* Status Cards Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div 
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 active:scale-95 transition cursor-pointer"
                onClick={() => { setActivePage('view'); setStatusFilter('pending'); }}
              >
                <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center mb-3">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{pendingCount}</div>
                <div className="text-sm font-medium text-gray-700">Pending</div>
                <div className="text-xs text-gray-500 mt-1">Under review</div>
              </div>

              <div 
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 active:scale-95 transition cursor-pointer"
                onClick={() => { setActivePage('view'); setStatusFilter('approved'); }}
              >
                <div className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center mb-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{approvedCount}</div>
                <div className="text-sm font-medium text-gray-700">Approved</div>
                <div className="text-xs text-gray-500 mt-1">Payment ready</div>
              </div>

              <div 
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 active:scale-95 transition cursor-pointer"
                onClick={() => { setActivePage('view'); setStatusFilter('needs_update'); }}
              >
                <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center mb-3">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{needsUpdateCount}</div>
                <div className="text-sm font-medium text-gray-700">Returned</div>
                <div className="text-xs text-gray-500 mt-1">Action needed</div>
              </div>

              <div 
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 active:scale-95 transition cursor-pointer"
                onClick={() => setActivePage('drafts')}
              >
                <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{draftCount}</div>
                <div className="text-sm font-medium text-gray-700">Drafts</div>
                <div className="text-xs text-gray-500 mt-1">Saved work</div>
              </div>
            </div>

            {/* Recent Activity */}
            {bills.length > 0 && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                  <button 
                    onClick={() => setActivePage('view')}
                    className="text-blue-600 text-sm font-medium"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {bills.slice(0, 3).map((bill) => (
                    <div key={bill._id} className="flex items-center space-x-4 p-3 rounded-2xl bg-gray-50">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        bill.status === 'approved' ? 'bg-green-100' :
                        bill.status === 'pending' ? 'bg-amber-100' :
                        bill.status === 'rejected' ? 'bg-red-100' :
                        'bg-gray-100'
                      }`}>
                        <div className={`w-3 h-3 rounded-full ${
                          bill.status === 'approved' ? 'bg-green-500' :
                          bill.status === 'pending' ? 'bg-amber-500' :
                          bill.status === 'rejected' ? 'bg-red-500' :
                          'bg-gray-500'
                        }`}></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{bill.description}</p>
                        <p className="text-xs text-gray-500">{new Date(bill.billDate || bill.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">₹{Number(bill.amount).toLocaleString()}</div>
                        <div className={`text-xs font-medium ${
                          bill.status === 'approved' ? 'text-green-600' :
                          bill.status === 'pending' ? 'text-amber-600' :
                          bill.status === 'rejected' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* Add Bill Screen */}
        {activePage === 'add' && <AddBillForm />}

        {/* View Bills Screen */}
        {activePage === 'view' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {statusFilter === 'all' ? 'All Bills' :
                 statusFilter === 'pending' ? 'Pending Bills' :
                 statusFilter === 'approved' ? 'Approved Bills' :
                 statusFilter === 'rejected' ? 'Rejected Bills' :
                 statusFilter === 'needs_update' ? 'Bills Needing Update' : 'Bills'}
              </h3>
            </div>
            
            {/* Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  statusFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  statusFilter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('approved')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  statusFilter === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setStatusFilter('rejected')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  statusFilter === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rejected
              </button>
              <button
                onClick={() => setStatusFilter('needs_update')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  statusFilter === 'needs_update' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Needs Update
              </button>
            </div>

            {bills.filter(bill => !bill.isDraft && (statusFilter === 'all' || bill.status === statusFilter)).length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No bills to show for this filter</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bills.filter(bill => !bill.isDraft && (statusFilter === 'all' || bill.status === statusFilter)).map((bill) => (
                  <div 
                    key={bill._id} 
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-95 transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{bill.description}</h4>
                        <p className="text-sm text-gray-600">{bill.category || 'Other'} • {new Date(bill.billDate || bill.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">₹{Number(bill.amount).toLocaleString()}</p>
                        <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mt-1 ${
                          bill.status === 'approved' ? 'bg-green-100 text-green-700' : 
                          bill.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          bill.status === 'needs_update' ? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {bill.status === 'needs_update' ? 'Needs Update' : bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    {bill.remarks && (
                      <div className="bg-gray-50 rounded-lg p-3 mt-3">
                        <p className="text-sm text-gray-700"><span className="font-medium">Remarks:</span> {bill.remarks}</p>
                      </div>
                    )}
                    {bill.status === 'needs_update' && (
                      <button 
                        className="mt-3 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition font-medium"
                        onClick={() => {
                          alert('Edit functionality for returned bills to be implemented');
                        }}
                      >
                        Edit & Resubmit
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Draft Bills Screen */}
        {activePage === 'drafts' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Draft Bills</h3>
            {bills.filter(bill => bill.isDraft).length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Edit3 className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No draft bills to show</p>
                <p className="text-sm text-gray-400 mt-2">Create a draft to save your work</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bills.filter(bill => bill.isDraft).map((bill) => (
                  <div 
                    key={bill._id} 
                    className="bg-white rounded-2xl p-4 shadow-sm border border-yellow-200 relative"
                  >
                    <div className="absolute top-4 right-4">
                      <span className="bg-yellow-100 text-yellow-700 px-3 py-1 text-xs font-medium rounded-full">
                        Draft
                      </span>
                    </div>
                    <div className="pr-20">
                      <h4 className="font-semibold text-gray-900 mb-1">{bill.description}</h4>
                      <p className="text-sm text-gray-600 mb-2">{bill.category || 'Other'} • {new Date(bill.billDate || bill.date).toLocaleDateString()}</p>
                      <p className="text-lg font-bold text-gray-900">₹{Number(bill.amount).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button 
                        className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition font-medium"
                        onClick={() => {
                          alert('Edit functionality to be implemented');
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition font-medium"
                        onClick={() => {
                          alert('Delete functionality to be implemented');
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 safe-area-pb">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button
            onClick={() => setActivePage('home')}
            className={`flex flex-col items-center p-3 rounded-2xl transition ${
              activePage === 'home' ? 'bg-blue-100' : 'hover:bg-gray-100'
            }`}
          >
            <Home size={20} className={activePage === 'home' ? 'text-blue-600' : 'text-gray-600'} />
            <span className={`text-xs mt-1 font-medium ${
              activePage === 'home' ? 'text-blue-600' : 'text-gray-600'
            }`}>Home</span>
          </button>
          
          <button
            onClick={() => setActivePage('add')}
            className={`flex flex-col items-center p-3 rounded-2xl transition ${
              activePage === 'add' ? 'bg-blue-100' : 'hover:bg-gray-100'
            }`}
          >
            <Plus size={20} className={activePage === 'add' ? 'text-blue-600' : 'text-gray-600'} />
            <span className={`text-xs mt-1 font-medium ${
              activePage === 'add' ? 'text-blue-600' : 'text-gray-600'
            }`}>Add Bill</span>
          </button>
          
          <button
            onClick={() => { setActivePage('view'); setStatusFilter('all'); }}
            className={`flex flex-col items-center p-3 rounded-2xl transition ${
              activePage === 'view' ? 'bg-blue-100' : 'hover:bg-gray-100'
            }`}
          >
            <FileText size={20} className={activePage === 'view' ? 'text-blue-600' : 'text-gray-600'} />
            <span className={`text-xs mt-1 font-medium ${
              activePage === 'view' ? 'text-blue-600' : 'text-gray-600'
            }`}>Bills</span>
          </button>
          
          <button
            onClick={() => setActivePage('drafts')}
            className={`flex flex-col items-center p-3 rounded-2xl transition ${
              activePage === 'drafts' ? 'bg-blue-100' : 'hover:bg-gray-100'
            }`}
          >
            <Edit3 size={20} className={activePage === 'drafts' ? 'text-blue-600' : 'text-gray-600'} />
            <span className={`text-xs mt-1 font-medium ${
              activePage === 'drafts' ? 'text-blue-600' : 'text-gray-600'
            }`}>Drafts</span>
          </button>
        </div>
      </div>

    </div>
  );
}