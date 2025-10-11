import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserId } from '../hooks/useUserId';
import { Users } from 'lucide-react';

export default function ViewUsers() {
  const { user } = useAuth();
  const userId = useUserId();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reset state when user changes
  useEffect(() => {
    setUsers([]);
    setLoading(true);
  }, [userId]);

  const fetchUsers = useCallback(async (abortSignal) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/users', {
        signal: abortSignal
      });
      
      if (abortSignal?.aborted) return;
      
      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching users:', error);
      }
    } finally {
      if (!abortSignal?.aborted) {
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchUsers(abortController.signal);
    
    return () => {
      abortController.abort();
    };
  }, [fetchUsers]);

  if (loading) {
    return <div className="text-center mt-10 text-gray-500">Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Users Overview</h2>
        <span className="text-sm text-gray-500">{users.length} users</span>
      </div>
      
      {users.length > 0 ? (
        <div className="space-y-3">
          {users.map((user, index) => (
            <div key={user.name} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-600">{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">₹{user.totalAmount.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{user.totalBills} bills</div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-amber-600">{user.pendingBills}</div>
                  <div className="text-xs text-amber-700">Pending</div>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-green-600">{user.approvedBills}</div>
                  <div className="text-xs text-green-700">Approved</div>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-red-600">{user.rejectedBills}</div>
                  <div className="text-xs text-red-700">Rejected</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">No users found</p>
          <p className="text-sm text-gray-400 mt-2">Users will appear when bills are submitted</p>
        </div>
      )}
    </div>
  );
}
