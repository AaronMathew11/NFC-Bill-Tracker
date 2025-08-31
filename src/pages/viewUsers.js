import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserId } from '../hooks/useUserId';

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
      const response = await fetch('https://nfc-bill-tracker-backend.onrender.com/api/users', {
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
    <div className="users-container">
      <h2 className="text-xl mb-4 mt-8">View Users</h2>
      {users.length > 0 ? (
        <ul>
          {users.map((user) => (
            <li key={user._id} className="flex justify-between items-center mb-4 p-4 border rounded">
              <div>
                <h3>{user.name}</h3>
                <p>Email: {user.email}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center text-gray-500 mt-6">No users found</div>
      )}
    </div>
  );
}
