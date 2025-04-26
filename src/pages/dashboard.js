import { useState, useEffect } from 'react';
import AddBillForm from '../Components/AddBillForm';
import { useUser, useClerk } from '@clerk/clerk-react';
import { Menu, X } from 'lucide-react';

export default function Dashboard() {
  const { user } = useUser();
  const { signOut } = useClerk();

  const [activePage, setActivePage] = useState('home'); // default is 'home'
  const [bills, setBills] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const firstName = user?.firstName || 'User';

  useEffect(() => {
    if (activePage === 'view' || activePage === 'home') {
      fetch(`http://localhost:3000/api/user-bills/${user?.publicMetadata?.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setBills(data.bills);
          } else {
            alert('Failed to load bills');
          }
        })
        .catch((error) => {
          console.error(error);
          alert('Failed to fetch bills');
        });
    }
  }, [activePage]);

  // Calculate Stats: Total Debit, Total Credit, Total Count, and Pending Bills
  const totalDebit = bills.reduce((sum, bill) => bill.type === 'debit' ? sum + (bill.amount || 0) : sum, 0);
  const totalCredit = bills.reduce((sum, bill) => bill.type === 'credit' ? sum + (bill.amount || 0) : sum, 0);
  const totalCount = bills.length;
  const pendingBills = bills.filter((bill) => bill.status === 'pending').length;

  return (
    <div className="flex min-h-screen bg-gray-50 relative">

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full bg-white shadow-lg p-6 w-64 flex flex-col justify-between transition-transform duration-300 z-50 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-8 mt-12 text-center">NFC Bill Tracker</h2>
          
          <nav className="space-y-4">
            <button
              onClick={() => { setActivePage('home'); setSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-100 ${activePage === 'home' ? 'bg-blue-200 font-semibold' : ''}`}
            >
              🏡 Home
            </button>
            <button
              onClick={() => { setActivePage('add'); setSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-100 ${activePage === 'add' ? 'bg-blue-200 font-semibold' : ''}`}
            >
              ➕ Add New Bill
            </button>
            <button
              onClick={() => { setActivePage('view'); setSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-lg text-gray-700 hover:bg-green-100 ${activePage === 'view' ? 'bg-green-200 font-semibold' : ''}`}
            >
              📄 Submitted Bills
            </button>
          </nav>
        </div>

        {/* Logout */}
        <button
          onClick={() => signOut()}
          className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition font-semibold mt-8"
        >
          🔒 Logout
        </button>
      </div>

      {/* Hamburger Button */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md md:hidden"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto ml-0 md:ml-64">

        {/* Home Screen */}
        {activePage === 'home' && (
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-semibold text-gray-900 mb-4 mt-6">Hello, {firstName}! 👋</h1>
            
            <p className="text-md text-gray-700 mb-16 pb-4">Stay on top of your transactions on behalf of NFC and manage your bills easily. Here's an overview of your recent activities.</p>

            {/* First Row - Total Debit, Total Credit, Total Count */}
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-6">
              {/* Total Debit */}
              <div className="bg-red-50 rounded-xl p-6 shadow-lg hover:shadow-xl transition">
                <h2 className="text-md font-semibold text-red-800 mb-2">Total Debit</h2>
                <p className="text-lg font-bold text-red-900">{totalDebit}</p>
              </div>

              {/* Total Credit */}
              <div className="bg-green-50 rounded-xl p-6 shadow-lg hover:shadow-xl transition">
                <h2 className="text-md font-semibold text-green-800 mb-2">Total Credit</h2>
                <p className="text-lg font-bold text-green-900">{totalCredit}</p>
              </div>

              {/* Total Count */}
              <div className="bg-blue-50 rounded-xl p-6 shadow-lg hover:shadow-xl transition">
                <h2 className="text-md font-semibold text-blue-800 mb-2">Total Count</h2>
                <p className="text-lg font-bold text-blue-900">{totalCount}</p>
              </div>
            </div>

            {/* Second Row - Number of Pending Bills */}
            <div className="bg-yellow-50 rounded-xl p-6 shadow-lg hover:shadow-xl transition mt-6">
              <h2 className="text-xl font-semibold text-yellow-800 mb-2">Pending Bills</h2>
              <p className="text-3xl font-bold text-yellow-900">{pendingBills}</p>
            </div>

          </div>
        )}

        {/* Add Bill Screen */}
        {activePage === 'add' && <AddBillForm />}

        {/* View Bills Screen */}
        {activePage === 'view' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4 ml-10">Previous Bills</h3>
            {bills.length === 0 ? (
              <p className="text-gray-600 text-center">No bills to show</p>
            ) : (
              <ul className="space-y-6">
                {bills.map((bill) => (
                  <li 
                    key={bill._id} 
                    className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-xl font-bold text-gray-900">{bill.amount} ₹</p>
                      <div className="flex flex-row items-end space-x-1">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${bill.type === 'debit' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                          {bill.type}
                        </span>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${bill.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {bill.status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-m font-semibold text-gray-800 mb-1">{bill.description}</h4>
                      <p className="text-sm text-gray-600">{bill.date}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Tip Section at the Bottom */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-md p-6 bg-gray-200 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900">Tip of the Day</h3>
          <p className="text-sm text-gray-600">Tracking bills regularly will help you stay ahead and avoid any unnecessary issues. Keep up the great work!</p>
        </div>

      </div>

    </div>
  );
}
