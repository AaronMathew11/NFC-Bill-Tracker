import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register Pie chart components
ChartJS.register(ArcElement, Tooltip, Legend);

export default function Overview() {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(30000); // 🎯 Initial balance is 30000

  useEffect(() => {
    async function fetchStatistics() {
      try {
        const response = await fetch('http://localhost:3000/api/all-bills');
        const data = await response.json();
        if (data.success) {
          const bills = data.bills;
          const approvedBills = bills.filter(bill => bill.status === 'approved');
          const declinedBills = bills.filter(bill => bill.status === 'rejected');

          // Calculate balance
          let updatedBalance = 25131; // Starting balance
          approvedBills.forEach(bill => {
            if (bill.type === 'debit') {
              updatedBalance -= Number(bill.amount);
            } else if (bill.type === 'credit') {
              updatedBalance += Number(bill.amount);
            }
          });

          setBalance(updatedBalance);
          setStatistics({ approvedBills, declinedBills });
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStatistics();
  }, []);

  if (loading) {
    return <div className="text-center mt-10 text-gray-500">Loading Overview...</div>;
  }

  if (!statistics) {
    return <div className="text-center mt-10 text-red-500">Failed to load statistics.</div>;
  }

  const pieData = {
    labels: ['Approved', 'Rejected'],
    datasets: [
      {
        label: 'Bills Status',
        data: [
          statistics.approvedBills.length,
          statistics.declinedBills.length,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.7)', // Green
          'rgba(239, 68, 68, 0.7)', // Red
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
        ],
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
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Flow Analysis</h2>

      {/* Pie Chart Section */}
      <div className="w-full h-64 sm:h-80 relative mb-8">
        <Pie data={pieData} options={pieOptions} />
      </div>

      {/* Balance Section */}
      <div className="mb-8 text-center">
        <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
          <div className="text-md font-semibold text-gray-700">Remaining Balance</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            ₹{balance.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Approved Bills Table */}
      <div className="overflow-x-auto bg-white shadow-md rounded-lg border border-gray-200">
        <table className="min-w-full bg-white table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 text-left text-gray-600">Person Name</th>
              <th className="py-2 px-4 text-left text-gray-600">Description</th>
              <th className="py-2 px-4 text-left text-gray-600">Amount</th>
            </tr>
          </thead>
          <tbody>
            {statistics.approvedBills.map((bill) => (
              <tr key={bill._id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b text-gray-700">{bill.personName}</td>
                <td className="py-2 px-4 border-b text-gray-700">{bill.description}</td>
                <td className="py-2 px-4 border-b text-gray-700">
                  {bill.type === 'credit' ? '+' : '-'} ₹{Number(bill.amount).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* No data message */}
      {statistics.approvedBills.length === 0 && (
        <div className="text-center text-gray-500 mt-6">No approved bills to display.</div>
      )}
    </div>
  );
}
