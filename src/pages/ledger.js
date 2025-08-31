import React, { useState, useEffect, useCallback } from 'react';
import { Download } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUserId } from '../hooks/useUserId';

export default function Ledger() {
  const { user } = useAuth();
  const userId = useUserId();
  
  const [ledgerData, setLedgerData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    category: '',
    type: ''
  });
  const [loading, setLoading] = useState(true);

  // Reset state when user changes
  useEffect(() => {
    setLedgerData([]);
    setFilteredData([]);
    setFilters({
      dateFrom: '',
      dateTo: '',
      category: '',
      type: ''
    });
    setLoading(true);
  }, [userId]);

  const fetchLedgerData = useCallback(async (abortSignal) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await fetch('https://nfc-bill-tracker-backend.onrender.com/api/ledger', {
        signal: abortSignal
      });
      
      if (abortSignal?.aborted) return;
      
      const data = await response.json();
      if (data.success) {
        setLedgerData(data.ledger || []);
        setFilteredData(data.ledger || []);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching ledger:', error);
      }
    } finally {
      if (!abortSignal?.aborted) {
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchLedgerData(abortController.signal);
    
    return () => {
      abortController.abort();
    };
  }, [fetchLedgerData]);

  useEffect(() => {
    let filtered = ledgerData;

    if (filters.dateFrom) {
      filtered = filtered.filter(entry => new Date(entry.entryDate) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(entry => new Date(entry.entryDate) <= new Date(filters.dateTo));
    }
    if (filters.category) {
      filtered = filtered.filter(entry => entry.category === filters.category);
    }
    if (filters.type) {
      filtered = filtered.filter(entry => entry.type === filters.type);
    }

    setFilteredData(filtered);
  }, [filters, ledgerData]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const exportLedger = (format = 'csv') => {
    const headers = [
      'Entry Date', 'Date of Settlement', 'Bill Date', 'Description', 
      'Credit (INR)', 'Debit (INR)', 'Balance', 'Remarks', 'Bill Softcopy'
    ];
    
    const csvContent = [
      headers,
      ...filteredData.map(entry => [
        entry.entryDate,
        entry.dateOfSettlement || '',
        entry.billDate,
        entry.description,
        entry.type === 'credit' ? entry.amount : '',
        entry.type === 'debit' ? entry.amount : '',
        entry.balance,
        entry.remarks || '',
        entry.billSoftcopyUrl || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ledger-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-center mt-10 text-gray-500">Loading Ledger...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Ledger</h2>
        <div className="flex gap-2">
          <button
            onClick={() => exportLedger('csv')}
            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            onClick={() => exportLedger('xlsx')}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            <Download size={16} />
            Export XLSX
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">All Types</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry Date</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Settlement Date</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Date</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit (INR)</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Debit (INR)</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((entry, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(entry.entryDate).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.dateOfSettlement ? new Date(entry.dateOfSettlement).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(entry.billDate).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900 max-w-xs truncate">
                    {entry.description}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-green-600 font-medium">
                    {entry.type === 'credit' ? `₹${Number(entry.amount).toLocaleString()}` : '-'}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-red-600 font-medium">
                    {entry.type === 'debit' ? `₹${Number(entry.amount).toLocaleString()}` : '-'}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    ₹{Number(entry.balance || 0).toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900 max-w-xs truncate">
                    {entry.remarks || '-'}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm">
                    {entry.billSoftcopyUrl ? (
                      <a 
                        href={entry.billSoftcopyUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        View
                      </a>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredData.length === 0 && (
        <div className="text-center text-gray-500 mt-6">No ledger entries match the current filters.</div>
      )}
    </div>
  );
}