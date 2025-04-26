// components/Sidebar.js
import Link from 'next/link'; // Or any routing library you're using
import { useMediaQuery } from '@mui/material';  // To handle responsiveness

export default function Sidebar() {
  const isMobile = useMediaQuery('(max-width:600px)');  // Use breakpoint for mobile

  return (
    <div className="w-64 bg-gray-800 text-white h-screen p-4">
      <h2 className="text-xl font-semibold mb-6">Admin Dashboard</h2>
      {!isMobile && (
        <ul className="space-y-4">
          <li>
            <Link href="/admin/users">
              <a className="block py-2 px-4 hover:bg-gray-700 rounded">Users</a>
            </Link>
          </li>
          <li>
            <Link href="/admin/bills">
              <a className="block py-2 px-4 hover:bg-gray-700 rounded">Bills</a>
            </Link>
          </li>
          <li>
            <Link href="/admin/overview">
              <a className="block py-2 px-4 hover:bg-gray-700 rounded">Overview</a>
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}
