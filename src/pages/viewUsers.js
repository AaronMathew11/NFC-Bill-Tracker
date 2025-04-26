import React, { useState, useEffect } from 'react';

export default function ViewUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Simulate fetching the list of users
    fetch('http://localhost:3000/api/users') // Adjust this URL to match your backend API
      .then((res) => res.json())
      .then((data) => setUsers(data.users))
      .catch((err) => console.error('Error fetching users:', err));
  }, []);

  return (
    <div className="users-container">
      <h2 className="text-xl mb-4 mt-8">View Users</h2>
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
    </div>
  );
}
