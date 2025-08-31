import React, { useState, useEffect, useCallback } from 'react';
import { Pie, Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement } from 'chart.js';
import { useAuth } from '../hooks/useAuth';
import { useUserId } from '../hooks/useUserId';

// Register chart components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement);

export default function Overview() {
  const { user } = useAuth();
  const userId = useUserId();
  
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
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
    setStatistics(null);
    setLoading(true);
    setBalance(0);
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
      const response = await fetch('https://nfc-bill-tracker-backend.onrender.com/api/all-bills', {
        signal: abortSignal
      });
      
      if (abortSignal?.aborted) return;
      
      const data = await response.json();
      if (data.success) {
        const bills = data.bills;
        const approvedBills = bills.filter(bill => bill.status === 'approved');
        const declinedBills = bills.filter(bill => bill.status === 'rejected');

        // Calculate balance - start from 0 for each user session
        let updatedBalance = 0;
        approvedBills.forEach(bill => {
          if (bill.type === 'debit') {
            updatedBalance -= Number(bill.amount);
          } else if (bill.type === 'credit') {
            updatedBalance += Number(bill.amount);
          }
        });

        setBalance(updatedBalance);
        setStatistics({ approvedBills, declinedBills });
        
        // Generate monthly trend data
        const monthlyTrend = generateMonthlyTrend(approvedBills);
        setMonthlyData(monthlyTrend);
        
        // Generate category breakdown
        const categoryBreakdown = generateCategoryBreakdown(approvedBills);
        setCategoryData(categoryBreakdown);
        
        // Generate pending by user data
        const pendingUserData = generatePendingByUser(bills.filter(b => b.status === 'pending'));
        setPendingByUser(pendingUserData);
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            name="dateRange"
            value={filters.dateRange}
            onChange={handleFilterChange}
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Categories</option>
            <option value="Events">Events</option>
            <option value="Supplies">Supplies</option>
            <option value="Maintenance">Maintenance</option>
          </select>
          <select
            name="billType"
            value={filters.billType}
            onChange={handleFilterChange}
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Types</option>
            <option value="reimbursement">Reimbursements</option>
            <option value="direct">Direct Payments</option>
          </select>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm font-medium text-gray-500">Total Credit</div>
          <div className="text-2xl font-bold text-green-600 mt-2">
            ₹{statistics?.approvedBills.filter(b => b.type === 'credit').reduce((sum, b) => sum + Number(b.amount), 0).toLocaleString() || 0}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm font-medium text-gray-500">Total Debit</div>
          <div className="text-2xl font-bold text-red-600 mt-2">
            ₹{statistics?.approvedBills.filter(b => b.type === 'debit').reduce((sum, b) => sum + Number(b.amount), 0).toLocaleString() || 0}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm font-medium text-gray-500">Current Balance</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            ₹{balance.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm font-medium text-gray-500">Pending Count</div>
          <div className="text-2xl font-bold text-yellow-600 mt-2">
            {pendingByUser.reduce((sum, [, count]) => sum + count, 0)}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Trend Line Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Expense Trend</h3>
          <div className="h-64">
            <Line data={monthlyLineData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Bills Status Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Bills Status</h3>
          <div className="h-64">
            <Pie data={statusPieData} options={pieOptions} />
          </div>
        </div>

        {/* Top Categories Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Categories</h3>
          <div className="h-64">
            <Bar data={categoryBarData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Pending by User Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Pending by User</h3>
          <div className="h-64">
            <Bar data={pendingUserBarData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Recent Approved Bills Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Recent Approved Bills</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white table-auto">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Person/Vendor</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {statistics.approvedBills.slice(0, 10).map((bill) => (
                <tr key={bill._id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(bill.billDate || bill.entryDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                    {bill.personName || bill.vendorName}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 max-w-xs truncate">
                    {bill.description}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">
                    {bill.category || 'Other'}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm font-medium">
                    <span className={bill.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                      {bill.type === 'credit' ? '+' : '-'} ₹{Number(bill.amount).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      bill.paymentType === 'direct' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {bill.paymentType === 'direct' ? 'Direct' : 'Reimbursement'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {statistics.approvedBills.length === 0 && (
        <div className="text-center text-gray-500 mt-6">No approved bills to display.</div>
      )}
    </div>
  );
}
