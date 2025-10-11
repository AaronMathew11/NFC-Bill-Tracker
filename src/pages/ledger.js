import React, { useState, useEffect, useCallback } from 'react';
import { Download, Activity, Book, Search, Filter, Calendar } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUserId } from '../hooks/useUserId';

export default function Ledger() {
  const { user } = useAuth();
  const userId = useUserId();
  
  const [activeTab, setActiveTab] = useState('ledger');
  const [ledgerData, setLedgerData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [eventLogs, setEventLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    category: '',
    type: '',
    search: ''
  });
  const [logFilters, setLogFilters] = useState({
    dateFrom: '',
    dateTo: '',
    actor: '',
    action: '',
    search: ''
  });
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);

  // Reset state when user changes
  useEffect(() => {
    setLedgerData([]);
    setFilteredData([]);
    setEventLogs([]);
    setFilteredLogs([]);
    setFilters({
      dateFrom: '',
      dateTo: '',
      category: '',
      type: '',
      search: ''
    });
    setLogFilters({
      dateFrom: '',
      dateTo: '',
      actor: '',
      action: '',
      search: ''
    });
    setLoading(true);
    setLogsLoading(true);
  }, [userId]);

  const fetchLedgerData = useCallback(async (abortSignal) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/ledger', {
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

  const fetchEventLogs = useCallback(async (abortSignal) => {
    if (!userId) return;
    
    try {
      setLogsLoading(true);
      const response = await fetch('http://localhost:5001/api/event-logs', {
        signal: abortSignal
      });
      
      if (abortSignal?.aborted) return;
      
      const data = await response.json();
      if (data.success) {
        setEventLogs(data.logs || []);
        setFilteredLogs(data.logs || []);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching event logs:', error);
      }
    } finally {
      if (!abortSignal?.aborted) {
        setLogsLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchLedgerData(abortController.signal);
    fetchEventLogs(abortController.signal);
    
    return () => {
      abortController.abort();
    };
  }, [fetchLedgerData, fetchEventLogs]);

  useEffect(() => {
    let filtered = ledgerData;

    if (filters.dateFrom) {
      filtered = filtered.filter(entry => {
        const entryDate = entry.entryDate ? new Date(entry.entryDate) : null;
        return entryDate && entryDate >= new Date(filters.dateFrom);
      });
    }
    if (filters.dateTo) {
      filtered = filtered.filter(entry => {
        const entryDate = entry.entryDate ? new Date(entry.entryDate) : null;
        return entryDate && entryDate <= new Date(filters.dateTo);
      });
    }
    if (filters.category) {
      filtered = filtered.filter(entry => entry.category === filters.category);
    }
    if (filters.type) {
      filtered = filtered.filter(entry => entry.type === filters.type);
    }
    if (filters.search) {
      filtered = filtered.filter(entry => 
        JSON.stringify(entry).toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredData(filtered);
  }, [filters, ledgerData]);

  useEffect(() => {
    let filtered = eventLogs;

    if (logFilters.dateFrom) {
      filtered = filtered.filter(log => {
        const logDate = log.timestamp ? new Date(log.timestamp) : null;
        return logDate && logDate >= new Date(logFilters.dateFrom);
      });
    }
    if (logFilters.dateTo) {
      filtered = filtered.filter(log => {
        const logDate = log.timestamp ? new Date(log.timestamp) : null;
        return logDate && logDate <= new Date(logFilters.dateTo);
      });
    }
    if (logFilters.actor) {
      filtered = filtered.filter(log => log.actor && log.actor.toLowerCase().includes(logFilters.actor.toLowerCase()));
    }
    if (logFilters.action) {
      filtered = filtered.filter(log => log.action === logFilters.action);
    }
    if (logFilters.search) {
      filtered = filtered.filter(log => 
        JSON.stringify(log).toLowerCase().includes(logFilters.search.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  }, [logFilters, eventLogs]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleLogFilterChange = (e) => {
    const { name, value } = e.target;
    setLogFilters(prev => ({ ...prev, [name]: value }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return '-';
    }
  };

  const exportLedger = (format = 'csv') => {
    const headers = [
      'Entry Date', 'Date of Settlement', 'Bill Date', 'Description', 
      'Credit (INR)', 'Debit (INR)', 'Balance', 'Remarks', 'Bill Softcopy'
    ];
    
    const csvContent = [
      headers,
      ...filteredData.map(entry => [
        formatDate(entry.entryDate),
        formatDate(entry.dateOfSettlement),
        formatDate(entry.billDate),
        entry.description || '',
        entry.type === 'credit' ? entry.amount : '',
        entry.type === 'debit' ? entry.amount : '',
        entry.balance || '',
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

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Actor', 'Action', 'Entity ID', 'Old Value', 'New Value', 'IP/Device'],
      ...filteredLogs.map(log => [
        formatDate(log.timestamp),
        log.actor || '',
        log.action || '',
        log.entityId || '',
        log.oldValue || '',
        log.newValue || '',
        log.ipDevice || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `event-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading && logsLoading) {
    return <div className="text-center mt-10 text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Financial Records</h2>
        <p className="text-gray-600">Manage ledger entries and audit logs</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'ledger'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Book size={18} />
              Ledger
            </div>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'logs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity size={18} />
              Event Logs
            </div>
          </button>
        </nav>
      </div>

      {/* Ledger Tab */}
      {activeTab === 'ledger' && (
        <>
          {/* Ledger Header & Export */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Transaction Ledger</h3>
              <p className="text-sm text-gray-600">View all financial transactions</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => exportLedger('csv')}
                className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition text-sm"
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
          </div>

          {/* Ledger Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={14} className="inline mr-1" />
                  From Date
                </label>
                <input
                  type="date"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={14} className="inline mr-1" />
                  To Date
                </label>
                <input
                  type="date"
                  name="dateTo"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Filter size={14} className="inline mr-1" />
                  Category
                </label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Filter size={14} className="inline mr-1" />
                  Type
                </label>
                <select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                >
                  <option value="">All Types</option>
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Search size={14} className="inline mr-1" />
                  Search
                </label>
                <input
                  type="text"
                  name="search"
                  placeholder="Search transactions..."
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading ledger...</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Settlement</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((entry, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(entry.entryDate)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(entry.dateOfSettlement)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(entry.billDate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                          <div className="truncate" title={entry.description}>
                            {entry.description || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                          {entry.type === 'credit' ? (
                            <span className="text-green-600">+₹{Number(entry.amount || 0).toLocaleString()}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                          {entry.type === 'debit' ? (
                            <span className="text-red-600">-₹{Number(entry.amount || 0).toLocaleString()}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                          ₹{Number(entry.balance || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {entry.billSoftcopyUrl ? (
                            <a 
                              href={entry.billSoftcopyUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {!loading && filteredData.length === 0 && (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg border">
              No ledger entries match the current filters.
            </div>
          )}
        </>
      )}

      {/* Event Logs Tab */}
      {activeTab === 'logs' && (
        <>
          {/* Logs Header & Export */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Event Logs</h3>
              <p className="text-sm text-gray-600">Audit trail of all system activities</p>
            </div>
            <button
              onClick={exportLogs}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition text-sm"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>

          {/* Logs Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={14} className="inline mr-1" />
                  From Date
                </label>
                <input
                  type="date"
                  name="dateFrom"
                  value={logFilters.dateFrom}
                  onChange={handleLogFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={14} className="inline mr-1" />
                  To Date
                </label>
                <input
                  type="date"
                  name="dateTo"
                  value={logFilters.dateTo}
                  onChange={handleLogFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actor</label>
                <input
                  type="text"
                  name="actor"
                  placeholder="User/Admin name"
                  value={logFilters.actor}
                  onChange={handleLogFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Filter size={14} className="inline mr-1" />
                  Action
                </label>
                <select
                  name="action"
                  value={logFilters.action}
                  onChange={handleLogFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                >
                  <option value="">All Actions</option>
                  <option value="create">Create</option>
                  <option value="edit">Edit</option>
                  <option value="approve">Approve</option>
                  <option value="decline">Decline</option>
                  <option value="return">Return</option>
                  <option value="export">Export</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Search size={14} className="inline mr-1" />
                  Search
                </label>
                <input
                  type="text"
                  name="search"
                  placeholder="Search in logs..."
                  value={logFilters.search}
                  onChange={handleLogFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Event Logs Table */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
            <div className="overflow-x-auto">
              {logsLoading ? (
                <div className="text-center py-8 text-gray-500">Loading event logs...</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLogs.map((log, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(log.timestamp)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {log.actor || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ 
                            log.action === 'approve' ? 'bg-green-100 text-green-800' :
                            log.action === 'decline' ? 'bg-red-100 text-red-800' :
                            log.action === 'return' ? 'bg-yellow-100 text-yellow-800' :
                            log.action === 'create' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {log.action || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {log.entityId || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                          <div className="truncate" title={log.oldValue && log.newValue ? `${log.oldValue} → ${log.newValue}` : log.details}>
                            {log.oldValue && log.newValue ? 
                              `${log.oldValue} → ${log.newValue}` : 
                              log.details || '-'
                            }
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {!logsLoading && filteredLogs.length === 0 && (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg border">
              No event logs match the current filters.
            </div>
          )}
        </>
      )}
    </div>
  );
}