import React, { useState, useEffect } from 'react';

export default function ViewBills() {
  const [pendingBills, setPendingBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);  // For selected bill in the modal

  useEffect(() => {
    async function fetchBills() {
      try {
        const response = await fetch('http://localhost:3000/api/all-bills');
        const data = await response.json();

        if (data.success) {
          const bills = data.bills;

          // Filter for pending bills (those that are neither approved nor rejected)
          const pendingBills = bills.filter(bill => bill.status === 'pending');

          setPendingBills(pendingBills);
        }
      } catch (error) {
        console.error('Error fetching bills:', error);
      }
    }

    fetchBills();
  }, []);

  // Close the modal
  function closeModal() {
    setSelectedBill(null);
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4 mt-6">Pending Bills</h2>

      {/* Mobile View (Card style) */}
      <div className="md:hidden">
        {pendingBills.length > 0 ? (
          pendingBills.map((bill) => (
            <div
              key={bill._id}
              className="bg-white p-4 mb-4 shadow-md rounded-lg border cursor-pointer"
              onClick={() => setSelectedBill(bill)}  // Open the modal with bill details
            >
              <div className="flex justify-between">
                <div className="text-sm text-gray-600">{bill.personName}</div>
                <div className={`text-sm font-semibold ${bill.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                  {bill.type === 'credit' ? '+' : '-'} ₹{Number(bill.amount).toLocaleString()}
                </div>
              </div>
              <div className="text-md font-semibold text-gray-800 mt-2">{bill.description}</div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No pending bills</p>
        )}
      </div>

      {/* Modal for showing bill details */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-11/12 max-w-lg relative overflow-hidden">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-600 text-lg font-bold"
            >
              &times;
            </button>

            <div className="mb-4">
              {/* If there's an image URL, show it */}
              {selectedBill.photoUrl ? (
                <img
                  src={selectedBill.photoUrl}
                  alt="Bill Image"
                  className="w-full h-auto rounded-lg object-contain mb-4"  // Make the image fit well
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                  No Image
                </div>
              )}
            </div>

            {/* Bill Details */}
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Bill Details</h3>
              <p className="text-gray-700"><strong>Person Name:</strong> {selectedBill.personName}</p>
              <p className="text-gray-700"><strong>Description:</strong> {selectedBill.description}</p>
              <p className="text-gray-700"><strong>Amount:</strong> {selectedBill.type === 'credit' ? '+' : '-'} ₹{Number(selectedBill.amount).toLocaleString()}</p>
              <p className="text-gray-700"><strong>Status:</strong> {selectedBill.status}</p>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex justify-between gap-4">
              <button
                className="w-1/2 bg-green-500 text-white py-2 px-3 rounded"
                onClick={() => handleApprove(selectedBill._id)}
              >
                Approve
              </button>
              <button
                className="w-1/2 bg-red-500 text-white py-2 px-3 rounded"
                onClick={() => handleDecline(selectedBill._id)}
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Approve Bill Handler
  async function handleApprove(billId) {
    try {
      const response = await fetch(`https://nfc-bill-tracker-backend.onrender.com/api/update-bill-status/${billId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      if (result.success) {
        // Refresh the list after approving
        setPendingBills((prevBills) => prevBills.filter((bill) => bill._id !== billId));
        closeModal();  // Close the modal after approving
      } else {
        console.error('Failed to approve bill:', result.error);
      }
    } catch (error) {
      console.error('Error approving bill:', error);
    }
  }

  // Decline Bill Handler
  async function handleDecline(billId) {
    try {
      const response = await fetch(`http://localhost:3000/api/update-bill-status/${billId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'rejected' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      if (result.success) {
        // Refresh the list after declining
        setPendingBills((prevBills) => prevBills.filter((bill) => bill._id !== billId));
        closeModal();  // Close the modal after declining
      } else {
        console.error('Failed to decline bill:', result.error);
      }
    } catch (error) {
      console.error('Error declining bill:', error);
    }
  }
}
