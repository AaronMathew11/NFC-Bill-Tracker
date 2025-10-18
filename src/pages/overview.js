import React, { useState, useEffect, useCallback } from 'react';
import { Pie, Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement } from 'chart.js';
import { useAuth } from '../hooks/useAuth';
import { useUserId } from '../hooks/useUserId';
import { getAllBills, getLedger } from '../services/dbService';

// Register chart components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement);

export default function Overview() {
  const { user } = useAuth();
  const userId = useUserId();
  
  const [allBills, setAllBills] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [ledgerBalance, setLedgerBalance] = useState(0);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [pendingByUser, setPendingByUser] = useState([]);
  const [filters, setFilters] = useState({
    dateRange: 'month',
    category: '',
    billType: '',
    status: ''
  });

  // Reset state when user changes
  useEffect(() => {
    setAllBills([]);
    setStatistics(null);
    setLoading(true);
    setBalance(0);
    setTotalBalance(0);
    setMonthlyData([]);
    setCategoryData([]);
    setPendingByUser([]);
    setFilters({
      dateRange: 'month',
      category: '',
      billType: '',
      status: ''
    });
  }, [userId]);

  const fetchStatistics = useCallback(async (abortSignal) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const [billsData, ledgerData] = await Promise.all([
        getAllBills(),
        getLedger()
      ]);
      
      if (abortSignal?.aborted) return;
      if (billsData.success) {
        setAllBills(billsData.bills);
        
        // Debug: Compare our calculation with ledger's final balance
        if (ledgerData.success && ledgerData.ledger.length > 0) {
          const ledgerFinalBalance = ledgerData.ledger[ledgerData.ledger.length - 1].balance;
          console.log('Ledger final balance:', ledgerFinalBalance);
          setLedgerBalance(ledgerFinalBalance);
          
          const approvedBills = billsData.bills.filter(bill => bill.status === 'approved');
          let calculatedBalance = 0;
          approvedBills.forEach(bill => {
            if (bill.type === 'debit') {
              calculatedBalance -= Number(bill.amount);
            } else if (bill.type === 'credit') {
              calculatedBalance += Number(bill.amount);
            }
          });
          console.log('Overview calculated balance:', calculatedBalance);
          console.log('Total approved bills:', approvedBills.length);
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching statistics:', error);
      }
    } finally {
      if (!abortSignal?.aborted) {
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchStatistics(abortController.signal);
    
    return () => {
      abortController.abort();
    };
  }, [fetchStatistics]);

  // Filter bills based on current filters
  const filterBills = useCallback((bills) => {
    let filtered = bills;

    // Date range filter
    const now = new Date();
    let startDate;
    
    if (filters.dateRange === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (filters.dateRange === 'quarter') {
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
    } else if (filters.dateRange === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    if (startDate) {
      filtered = filtered.filter(bill => {
        const billDate = new Date(bill.billDate || bill.entryDate);
        return billDate >= startDate;
      });
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(bill => bill.category === filters.category);
    }

    // Bill type filter (reimbursement vs direct)
    if (filters.billType) {
      filtered = filtered.filter(bill => bill.paymentType === filters.billType);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(bill => bill.status === filters.status);
    }

    return filtered;
  }, [filters]);

  // Calculate statistics when bills or filters change
  useEffect(() => {
    if (allBills.length === 0) return;

    const filteredBills = filterBills(allBills);
    const approvedBills = filteredBills.filter(bill => bill.status === 'approved');
    const declinedBills = filteredBills.filter(bill => bill.status === 'rejected');

    // Calculate filtered balance (for current period)
    let updatedBalance = 0;
    approvedBills.forEach(bill => {
      if (bill.type === 'debit') {
        updatedBalance -= Number(bill.amount);
      } else if (bill.type === 'credit') {
        updatedBalance += Number(bill.amount);
      }
    });

    // Calculate total balance (all approved bills, matching ledger logic)
    const allApprovedBills = allBills.filter(bill => bill.status === 'approved');
    let updatedTotalBalance = 0;
    allApprovedBills.forEach(bill => {
      if (bill.type === 'debit') {
        updatedTotalBalance -= Number(bill.amount);
      } else if (bill.type === 'credit') {
        updatedTotalBalance += Number(bill.amount);
      }
    });

    setBalance(updatedBalance);
    setTotalBalance(updatedTotalBalance);
    setStatistics({ approvedBills, declinedBills });
    
    // Generate monthly trend data
    const monthlyTrend = generateMonthlyTrend(approvedBills);
    setMonthlyData(monthlyTrend);
    
    // Generate category breakdown
    const categoryBreakdown = generateCategoryBreakdown(approvedBills);
    setCategoryData(categoryBreakdown);
    
    // Generate pending by user data - use all pending bills regardless of other filters
    const allPendingBills = allBills.filter(b => b.status === 'pending');
    const pendingUserData = generatePendingByUser(allPendingBills);
    setPendingByUser(pendingUserData);
  }, [allBills, filterBills]);

  const generateMonthlyTrend = (bills) => {
    const monthlyExpenses = {};
    bills.forEach(bill => {
      if (bill.type === 'debit') {
        const month = new Date(bill.billDate || bill.entryDate).toLocaleString('default', { month: 'short', year: 'numeric' });
        monthlyExpenses[month] = (monthlyExpenses[month] || 0) + Number(bill.amount);
      }
    });
    return Object.entries(monthlyExpenses).sort(([a], [b]) => new Date(a) - new Date(b));
  };

  const generateCategoryBreakdown = (bills) => {
    const categoryTotals = {};
    bills.forEach(bill => {
      const category = bill.category || 'Other';
      categoryTotals[category] = (categoryTotals[category] || 0) + Number(bill.amount);
    });
    return Object.entries(categoryTotals).sort(([,a], [,b]) => b - a);
  };

  const generatePendingByUser = (pendingBills) => {
    const userCounts = {};
    pendingBills.forEach(bill => {
      const user = bill.personName || 'Unknown';
      userCounts[user] = (userCounts[user] || 0) + 1;
    });
    return Object.entries(userCounts).sort(([,a], [,b]) => b - a);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return <div className="text-center mt-10 text-gray-500">Loading Overview...</div>;
  }

  if (!statistics) {
    return <div className="text-center mt-10 text-red-500">Failed to load statistics.</div>;
  }

  const statusPieData = {
    labels: ['Approved', 'Rejected'],
    datasets: [
      {
        label: 'Bills Status',
        data: [
          statistics.approvedBills.length,
          statistics.declinedBills.length,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.7)',
          'rgba(239, 68, 68, 0.7)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const monthlyLineData = {
    labels: monthlyData.map(([month]) => month),
    datasets: [
      {
        label: 'Monthly Expenses',
        data: monthlyData.map(([, amount]) => amount),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
    ],
  };

  const categoryBarData = {
    labels: categoryData.slice(0, 8).map(([category]) => category),
    datasets: [
      {
        label: 'Amount Spent',
        data: categoryData.slice(0, 8).map(([, amount]) => amount),
        backgroundColor: 'rgba(168, 85, 247, 0.7)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 1,
      },
    ],
  };

  const pendingUserBarData = {
    labels: pendingByUser.slice(0, 10).map(([user]) => user),
    datasets: [
      {
        label: 'Pending Bills',
        data: pendingByUser.slice(0, 10).map(([, count]) => count),
        backgroundColor: 'rgba(245, 158, 11, 0.7)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 1,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50">
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Dashboard Overview</h2>

      {/* Mobile Filters */}
      <div className="space-y-3 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Time Period</h3>
          <select
            name="dateRange"
            value={filters.dateRange}
            onChange={handleFilterChange}
            className="w-full p-3 bg-blue-50 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-blue-700 font-medium"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-sm"
            >
              <option value="">All Categories</option>
              <option value="Events">Events</option>
              <option value="Supplies">Supplies</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Travel">Travel</option>
              <option value="Food">Food</option>
              <option value="Utilities">Utilities</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
            <select
              name="billType"
              value={filters.billType}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-sm"
            >
              <option value="">All Types</option>
              <option value="reimbursement">Reimbursements</option>
              <option value="direct">Direct Payments</option>
            </select>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-sm"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards - Mobile First */}
      <div className="space-y-4 mb-6">
        {/* Primary Balance Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-500 mb-2">Current Balance</div>
            <div className={`text-4xl font-bold mb-2 ${
              totalBalance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ₹{totalBalance.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mb-3">
              {filters.dateRange === 'month' ? 'This Month' : 
               filters.dateRange === 'quarter' ? 'This Quarter' : 
               filters.dateRange === 'year' ? 'This Year' : 'Filtered'}: <span className={`font-semibold ${
                balance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>₹{balance.toLocaleString()}</span>
            </div>
            <div className="text-xs text-gray-400">Updated just now</div>
          </div>
        </div>
        
        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-3">
              <div className="w-6 h-6 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-sm font-medium text-gray-500">Total Credit</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              ₹{statistics?.approvedBills.filter(b => b.type === 'credit').reduce((sum, b) => sum + Number(b.amount), 0).toLocaleString() || 0}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-3">
              <div className="w-6 h-6 bg-red-500 rounded-full"></div>
            </div>
            <div className="text-sm font-medium text-gray-500">Total Debit</div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              ₹{statistics?.approvedBills.filter(b => b.type === 'debit').reduce((sum, b) => sum + Number(b.amount), 0).toLocaleString() || 0}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-500">Pending Requests</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">
                {pendingByUser.reduce((sum, [, count]) => sum + count, 0)}
              </div>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
              <div className="w-6 h-6 bg-amber-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Charts */}
      <div className="space-y-6 mb-8">
        {/* Monthly Trend - Simplified */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Monthly Trends</h3>
            <div className="text-xs text-gray-500">Last 6 months</div>
          </div>
          <div className="h-48">
            <Line data={monthlyLineData} options={{ 
              responsive: true, 
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              },
              scales: {
                x: { display: false },
                y: { display: false }
              },
              elements: {
                point: { radius: 4 },
                line: { borderWidth: 3 }
              }
            }} />
          </div>
        </div>

        {/* Top Categories - List View */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top Categories</h3>
          <div className="space-y-3">
            {categoryData.slice(0, 5).map(([category, amount], index) => {
              const maxAmount = Math.max(...categoryData.map(([, amt]) => amt));
              const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
              return (
                <div key={category} className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-blue-500' :
                    index === 1 ? 'bg-purple-500' :
                    index === 2 ? 'bg-green-500' :
                    index === 3 ? 'bg-orange-500' :
                    'bg-gray-400'
                  }`}></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-900">{category}</span>
                      <span className="text-sm font-bold text-gray-900">₹{amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          index === 0 ? 'bg-blue-500' :
                          index === 1 ? 'bg-purple-500' :
                          index === 2 ? 'bg-green-500' :
                          index === 3 ? 'bg-orange-500' :
                          'bg-gray-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Users - Card View */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Pending by User</h3>
          <div className="space-y-3">
            {pendingByUser.slice(0, 5).map(([userName, count]) => (
              <div key={userName} className="flex items-center justify-between p-3 bg-amber-50 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{userName.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{userName}</span>
                </div>
                <div className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  {count}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions - Mobile Cards */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
          <span className="text-xs text-gray-500">Last 10 bills</span>
        </div>
        <div className="space-y-3">
          {statistics.approvedBills.slice(0, 8).map((bill) => (
            <div key={bill._id} className="flex items-center space-x-4 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                bill.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <div className={`w-6 h-6 rounded-full ${
                  bill.type === 'credit' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{bill.description}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-xs text-gray-500">{bill.personName || bill.vendorName}</p>
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  <p className="text-xs text-gray-500">{new Date(bill.billDate || bill.entryDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${
                  bill.type === 'credit' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {bill.type === 'credit' ? '+' : '-'}₹{Number(bill.amount).toLocaleString()}
                </div>
                <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                  bill.paymentType === 'direct' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {bill.paymentType === 'direct' ? 'Direct' : 'Reimb'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {statistics.approvedBills.length === 0 && (
        <div className="text-center text-gray-500 mt-6">No approved bills to display.</div>
      )}
    </div>
  );
}
