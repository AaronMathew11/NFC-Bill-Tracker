import { useState, useEffect, useRef } from 'react';
import AddBillForm from '../Components/AddBillForm';
import { useAuth, useUserId } from '../hooks/useAuth';
import { firebaseSignOut } from '../firebase';
import { getUserBills, getUserReturnedBills, deleteBill } from '../services/dbService';
import { Home, Plus, FileText, User, Search, Filter, ChevronDown } from 'lucide-react';

export default function Dashboard() {
  const { user, authType } = useAuth();
  const userId = useUserId();

  const handleSignOut = async () => {
    try {
      await firebaseSignOut();
      // React Router will automatically redirect to login via useAuth hook
    } catch (error) {
      console.error('Sign out error:', error);
      // Still let React Router handle redirect even on error
    }
  };

  const [activePage, setActivePage] = useState('home');
  const [bills, setBills] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingBill, setEditingBill] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const firstName = user?.firstName || 'User';
  
  console.log('Dashboard - User data:', { user, userId, authType });

  useEffect(() => {
    // Reset state when user changes
    setActivePage('home');
    setBills([]);
    setStatusFilter('all');
    setEditingBill(null);
    setSearchQuery('');
    setShowFilterDropdown(false);
  }, [userId]);

  useEffect(() => {
    const fetchUserBills = async () => {
      if ((activePage === 'view' || activePage === 'home') && userId) {
        try {
          // Fetch both regular bills and returned bills
          const [userBillsData, returnedBillsData] = await Promise.all([
            getUserBills(userId),
            getUserReturnedBills(userId)
          ]);

          // Combine all bills, avoiding duplicates
          const allUserBills = [...userBillsData.bills];
          
          // Add returned bills that aren't already in the main list
          returnedBillsData.bills.forEach(returnedBill => {
            if (!allUserBills.find(bill => bill._id === returnedBill._id)) {
              allUserBills.push(returnedBill);
            }
          });

          setBills(allUserBills);
        } catch (error) {
          console.error('Error fetching bills:', error);
          alert('Failed to fetch bills');
        }
      }
    };

    fetchUserBills();
  }, [activePage, userId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBillSave = (savedBill) => {
    if (savedBill) {
      // Update the bills array with the saved bill
      setBills(prevBills => {
        const updatedBills = prevBills.map(bill => 
          bill._id === savedBill._id ? savedBill : bill
        );
        // If it's a new bill, add it to the array
        if (!prevBills.find(bill => bill._id === savedBill._id)) {
          updatedBills.push(savedBill);
        }
        return updatedBills;
      });
    }
    
    // Reset editing state and go back to bills page
    setEditingBill(null);
    setActivePage('view');
    // If the saved bill is a draft, switch to drafts filter
    if (savedBill && savedBill.isDraft) {
      setStatusFilter('drafts');
    }
  };

  const handleDeleteDraft = async (billId) => {
    if (window.confirm('Are you sure you want to delete this draft?')) {
      try {
        await deleteBill(billId);
        setBills(prevBills => prevBills.filter(bill => bill._id !== billId));
        alert('Draft deleted successfully!');
      } catch (error) {
        console.error('Error deleting draft:', error);
        alert('Failed to delete draft');
      }
    }
  };

  // Filter bills based on search query and status filter
  const getFilteredBills = () => {
    let filteredBills = bills;

    // Apply status filter
    if (statusFilter === 'drafts') {
      filteredBills = filteredBills.filter(bill => bill.isDraft);
    } else if (statusFilter !== 'all') {
      // For 'returned' status, include drafts because returned bills become drafts for editing
      // For other statuses, exclude drafts
      if (statusFilter === 'returned') {
        filteredBills = filteredBills.filter(bill => bill.status === statusFilter);
      } else {
        filteredBills = filteredBills.filter(bill => !bill.isDraft && bill.status === statusFilter);
      }
    } else {
      filteredBills = filteredBills.filter(bill => !bill.isDraft);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredBills = filteredBills.filter(bill => 
        (bill.description || '').toLowerCase().includes(query) ||
        (bill.personName || '').toLowerCase().includes(query) ||
        (bill.category || '').toLowerCase().includes(query) ||
        (bill.amount || '').toString().includes(query)
      );
    }

    return filteredBills;
  };

  const getFilterDisplayName = () => {
    switch (statusFilter) {
      case 'all': return 'All Bills';
      case 'pending': return 'Pending';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'returned': return 'Returned';
      case 'drafts': return 'Drafts';
      default: return 'Bills';
    }
  };

  // Calculate Request Counts by Status (consistent with filtering logic)
  const pendingCount = bills.filter((bill) => bill.status === 'pending' && !bill.isDraft).length;
  const approvedCount = bills.filter((bill) => bill.status === 'approved' && !bill.isDraft).length;
  const rejectedCount = bills.filter((bill) => bill.status === 'rejected' && !bill.isDraft).length;
  const needsUpdateCount = bills.filter((bill) => bill.status === 'returned').length; // Include drafts for returned bills
  const draftCount = bills.filter((bill) => bill.isDraft).length;
  const totalCount = bills.filter((bill) => !bill.isDraft).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Main Content */}
      <div className={activePage === 'home' ? 'px-6 py-6' : 'px-6 py-6'}>

        {/* Home Screen */}
        {activePage === 'home' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white shadow-sm border-b rounded-xl">
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
                onClick={() => { setActivePage('view'); setStatusFilter('returned'); }}
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
                onClick={() => { setActivePage('view'); setStatusFilter('drafts'); }}
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
            {bills.filter(bill => !bill.isDraft).length > 0 && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                </div>
                <div className="space-y-4">
                  {bills.filter(bill => !bill.isDraft).slice(0, 3).map((bill) => (
                    <div key={bill._id} className="flex items-center space-x-4 p-3 rounded-2xl bg-gray-50">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        bill.status === 'approved' ? 'bg-green-100' :
                        bill.status === 'pending' ? 'bg-amber-100' :
                        bill.status === 'rejected' ? 'bg-red-100' :
                        bill.status === 'returned' ? 'bg-orange-100' :
                        'bg-gray-100'
                      }`}>
                        <div className={`w-3 h-3 rounded-full ${
                          bill.status === 'approved' ? 'bg-green-500' :
                          bill.status === 'pending' ? 'bg-amber-500' :
                          bill.status === 'rejected' ? 'bg-red-500' :
                          bill.status === 'returned' ? 'bg-orange-500' :
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
                          bill.status === 'returned' ? 'text-orange-600' :
                          'text-gray-600'
                        }`}>
                          {bill.status === 'returned' ? 'Returned' : bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
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
        {activePage === 'add' && <AddBillForm editingBill={editingBill} onSave={handleBillSave} />}

        {/* View Bills Screen */}
        {activePage === 'view' && (
          <div className="space-y-4">
            {/* Header */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">My Bills</h3>
              
              {/* Search Bar with Filter */}
              <div className="relative">
                <div className="flex gap-3">
                  {/* Search Input */}
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search bills by description, person, category, or amount..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-gray-900 placeholder-gray-500"
                    />
                  </div>
                  
                  {/* Filter Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                      className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                    >
                      <Filter className="h-5 w-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">{getFilterDisplayName()}</span>
                      <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Filter Dropdown Menu */}
                    {showFilterDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-10">
                        <button
                          onClick={() => { setStatusFilter('all'); setShowFilterDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                            statusFilter === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                          }`}
                        >
                          All Bills ({totalCount})
                        </button>
                        <button
                          onClick={() => { setStatusFilter('pending'); setShowFilterDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                            statusFilter === 'pending' ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-700'
                          }`}
                        >
                          Pending ({pendingCount})
                        </button>
                        <button
                          onClick={() => { setStatusFilter('approved'); setShowFilterDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                            statusFilter === 'approved' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'
                          }`}
                        >
                          Approved ({approvedCount})
                        </button>
                        <button
                          onClick={() => { setStatusFilter('rejected'); setShowFilterDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                            statusFilter === 'rejected' ? 'bg-red-50 text-red-700 font-medium' : 'text-gray-700'
                          }`}
                        >
                          Rejected ({rejectedCount})
                        </button>
                        <button
                          onClick={() => { setStatusFilter('returned'); setShowFilterDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                            statusFilter === 'returned' ? 'bg-orange-50 text-orange-700 font-medium' : 'text-gray-700'
                          }`}
                        >
                          Returned ({needsUpdateCount})
                        </button>
                        <button
                          onClick={() => { setStatusFilter('drafts'); setShowFilterDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                            statusFilter === 'drafts' ? 'bg-gray-50 text-gray-700 font-medium' : 'text-gray-700'
                          }`}
                        >
                          Drafts ({draftCount})
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Active Filters Display */}
                {(searchQuery.trim() || statusFilter !== 'all') && (
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {searchQuery.trim() && (
                      <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        <span>Search: "{searchQuery}"</span>
                        <button
                          onClick={() => setSearchQuery('')}
                          className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    {statusFilter !== 'all' && (
                      <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        <span>Filter: {getFilterDisplayName()}</span>
                        <button
                          onClick={() => setStatusFilter('all')}
                          className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    {(searchQuery.trim() && statusFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('all');
                        }}
                        className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bills List */}
            {(() => {
              const filteredBills = getFilteredBills();
                
              if (filteredBills.length === 0) {
                return (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">
                      {searchQuery.trim() 
                        ? `No bills found matching "${searchQuery}"` 
                        : statusFilter === 'drafts' 
                          ? 'No draft bills to show' 
                          : `No bills to show for ${getFilterDisplayName().toLowerCase()}`
                      }
                    </p>
                    {searchQuery.trim() && (
                      <p className="text-sm text-gray-400 mt-2">Try adjusting your search or filters</p>
                    )}
                    {!searchQuery.trim() && statusFilter === 'drafts' && (
                      <p className="text-sm text-gray-400 mt-2">Create a draft to save your work</p>
                    )}
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {filteredBills.map((bill) => (
                    <div 
                      key={bill._id} 
                      className={`relative bg-white rounded-2xl p-4 shadow-sm border active:scale-95 transition-all duration-200 ${
                        bill.isDraft ? 'border-yellow-200 bg-yellow-50/50' : 'border-gray-100'
                      }`}
                    >
                      {bill.isDraft && (
                        <div className="absolute top-4 right-4">
                          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 text-xs font-medium rounded-full">
                            Draft
                          </span>
                        </div>
                      )}
                      
                      <div className={`${bill.isDraft ? 'pr-16' : ''} flex justify-between items-start mb-3`}>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{bill.description || 'Untitled'}</h4>
                          <p className="text-sm text-gray-600">
                            {bill.category || 'No category'} • {bill.billDate ? new Date(bill.billDate).toLocaleDateString() : 'No date'}
                          </p>
                        </div>
                        {!bill.isDraft && (
                          <div className="text-right">
                            <p className="font-bold text-gray-900">₹{Number(bill.amount).toLocaleString()}</p>
                            <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mt-1 ${
                              bill.status === 'approved' ? 'bg-green-100 text-green-700' : 
                              bill.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              bill.status === 'returned' ? 'bg-orange-100 text-orange-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {bill.status === 'returned' ? 'Needs Update' : bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                            </span>
                          </div>
                        )}
                        {bill.isDraft && (
                          <div className="text-right">
                            <p className="font-bold text-gray-900">₹{Number(bill.amount || 0).toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                      
                      {bill.remarks && (
                        <div className="bg-gray-50 rounded-lg p-3 mt-3">
                          <p className="text-sm text-gray-700"><span className="font-medium">Remarks:</span> {bill.remarks}</p>
                        </div>
                      )}
                      
                      {bill.isDraft && (
                        <div className="flex gap-2 mt-4">
                          <button 
                            className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition font-medium"
                            onClick={() => {
                              setEditingBill(bill);
                              setActivePage('add');
                            }}
                          >
                            Edit
                          </button>
                          <button 
                            className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition font-medium"
                            onClick={() => handleDeleteDraft(bill._id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                      
                      {bill.status === 'returned' && (
                        <button 
                          className="mt-3 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition font-medium"
                          onClick={() => {
                            setEditingBill(bill);
                            setActivePage('add');
                          }}
                        >
                          Edit & Resubmit
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}


      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 safe-area-pb">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button
            onClick={() => {
              setActivePage('home');
              setEditingBill(null);
            }}
            className={`flex flex-col items-center p-3 rounded-2xl transition ${
              activePage === 'home' ? 'bg-blue-100' : 'hover:bg-gray-100'
            }`}
          >
            <Home size={22} className={activePage === 'home' ? 'text-blue-600' : 'text-gray-600'} />
            <span className={`text-xs mt-1 font-medium ${
              activePage === 'home' ? 'text-blue-600' : 'text-gray-600'
            }`}>Home</span>
          </button>
          
          <button
            onClick={() => {
              setActivePage('add');
              setEditingBill(null);
            }}
            className={`flex flex-col items-center p-3 rounded-2xl transition ${
              activePage === 'add' ? 'bg-blue-100' : 'hover:bg-gray-100'
            }`}
          >
            <Plus size={22} className={activePage === 'add' ? 'text-blue-600' : 'text-gray-600'} />
            <span className={`text-xs mt-1 font-medium ${
              activePage === 'add' ? 'text-blue-600' : 'text-gray-600'
            }`}>Add Bill</span>
          </button>
          
          <button
            onClick={() => { 
              setActivePage('view'); 
              setStatusFilter('all');
              setEditingBill(null);
            }}
            className={`flex flex-col items-center p-3 rounded-2xl transition ${
              activePage === 'view' ? 'bg-blue-100' : 'hover:bg-gray-100'
            }`}
          >
            <FileText size={22} className={activePage === 'view' ? 'text-blue-600' : 'text-gray-600'} />
            <span className={`text-xs mt-1 font-medium ${
              activePage === 'view' ? 'text-blue-600' : 'text-gray-600'
            }`}>Bills</span>
          </button>
        </div>
      </div>

    </div>
  );
}