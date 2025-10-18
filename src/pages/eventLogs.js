import React, { useState, useEffect, useCallback } from 'react';
import { Download, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUserId } from '../hooks/useUserId';
import { getEventLogs } from '../services/dbService';

export default function EventLogs() {
  const { user } = useAuth();
  const userId = useUserId();
  
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    actor: '',
    action: '',
    search: ''
  });
  const [loading, setLoading] = useState(true);

  // Reset state when user changes
  useEffect(() => {
    setLogs([]);
    setFilteredLogs([]);
    setFilters({
      dateFrom: '',
      dateTo: '',
      actor: '',
      action: '',
      search: ''
    });
    setLoading(true);
  }, [userId]);

  const fetchEventLogs = useCallback(async (abortSignal) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const data = await getEventLogs();
      
      if (abortSignal?.aborted) return;
      
      if (data.success) {
        setLogs(data.logs || []);
        setFilteredLogs(data.logs || []);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching event logs:', error);
      }
    } finally {
      if (!abortSignal?.aborted) {
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchEventLogs(abortController.signal);
    
    return () => {
      abortController.abort();
    };
  }, [fetchEventLogs]);

  useEffect(() => {
    let filtered = logs;

    if (filters.dateFrom) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(filters.dateTo));
    }
    if (filters.actor) {
      filtered = filtered.filter(log => log.actor.toLowerCase().includes(filters.actor.toLowerCase()));
    }
    if (filters.action) {
      filtered = filtered.filter(log => log.action === filters.action);
    }
    if (filters.search) {
      filtered = filtered.filter(log => 
        JSON.stringify(log).toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  }, [filters, logs]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Actor', 'Action', 'Entity ID', 'Old Value', 'New Value', 'IP/Device'],
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.actor,
        log.action,
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

  if (loading) {
    return <div className="text-center mt-10 text-gray-500">Loading Event Logs...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Event Logs</h2>
        <button
          onClick={exportLogs}
          className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Actor</label>
            <input
              type="text"
              name="actor"
              placeholder="User/Admin name"
              value={filters.actor}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                name="search"
                placeholder="Search in logs..."
                value={filters.search}
                onChange={handleFilterChange}
                className="w-full pl-10 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Event Logs Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actor</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity ID</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-900">
                    {log.actor}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ 
                      log.action === 'approve' ? 'bg-green-100 text-green-800' :
                      log.action === 'decline' ? 'bg-red-100 text-red-800' :
                      log.action === 'return' ? 'bg-yellow-100 text-yellow-800' :
                      log.action === 'create' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-900">
                    {log.entityId || '-'}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {log.oldValue && log.newValue ? 
                      `${log.oldValue} → ${log.newValue}` : 
                      log.details || '-'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center text-gray-500 mt-6">No event logs match the current filters.</div>
      )}
    </div>
  );
}