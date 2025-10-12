import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserId } from '../hooks/useUserId';

export default function ViewBills() {
  const { user } = useAuth();
  const userId = useUserId();
  
  const [pendingBills, setPendingBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [remark, setRemark] = useState('');
  const [actionType, setActionType] = useState('');
  const [loading, setLoading] = useState(true);

  // Reset state when user changes
  useEffect(() => {
    setPendingBills([]);
    setSelectedBill(null);
    setRemark('');
    setActionType('');
    setLoading(true);
  }, [userId]);

  const fetchBills = useCallback(async (abortSignal) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await fetch('https://api-lyymlpizsa-uc.a.run.app/api/all-bills', {
        signal: abortSignal
      });
      
      if (abortSignal?.aborted) return;
      
      const data = await response.json();
      if (data.success) {
        const bills = data.bills.filter(bill => bill.status === 'pending');
        setPendingBills(bills);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching bills:', error);
      }
    } finally {
      if (!abortSignal?.aborted) {
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchBills(abortController.signal);
    
    return () => {
      abortController.abort();
    };
  }, [fetchBills]);

  function closeModal() {
    setSelectedBill(null);
    setRemark('');
    setActionType('');
  }

  async function handleUpdateStatus(billId, status) {
    if (!remark.trim() && (status === 'rejected' || status === 'returned')) {
      alert('Please enter a remark before proceeding.');
      return;
    }

    try {
      const response = await fetch(`https://api-lyymlpizsa-uc.a.run.app/api/update-bill-status/${billId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, remark }),
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      if (result.success) {
        setPendingBills((prevBills) => prevBills.filter((bill) => bill._id !== billId));
        sendEmailNotification(selectedBill, status, remark);
        
        // Add Date of Settlement for approved bills
        if (status === 'approved') {
          const settlementDate = new Date().toISOString().split('T')[0];
          console.log(`Bill ${billId} approved with settlement date: ${settlementDate}`);
        }
        
        closeModal();
      } else {
        console.error('Failed to update bill:', result.error);
      }
    } catch (error) {
      console.error('Error updating bill:', error);
    }
  }

  function sendEmailNotification(bill, status, remark) {
    // TODO: Implement email service integration
    const emailData = {
      to: bill.userEmail,
      subject: `Bill ${status.charAt(0).toUpperCase() + status.slice(1)} - ${bill.description}`,
      message: `Hello ${bill.personName}, your bill "${bill.description}" for ₹${bill.amount} has been ${status}.${remark ? `\nRemark: ${remark}` : ''}`
    };
    
    console.log('Email notification would be sent:', emailData);
    // For now, just show an alert
    alert(`Email notification sent to user: Bill ${status}`);
  }

  function onApproveClick() {
    setActionType('approved');
  }

  function onRejectClick() {
    setActionType('rejected');
  }

  function onReturnClick() {
    setActionType('returned');
  }

  if (loading) {
    return <div className="text-center mt-10 text-gray-500">Loading bills...</div>;
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
              onClick={() => setSelectedBill(bill)}
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
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-600 text-lg font-bold"
            >
              &times;
            </button>

            {/* Bill Image */}
            <div className="mb-4">
              {selectedBill.photoUrl ? (
                <img
                  src={selectedBill.photoUrl}
                  alt="Bill Image"
                  className="w-full h-auto rounded-lg object-contain mb-4"
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

            {/* Remark input */}
            {actionType && (
              <div className="mb-4">
                <textarea
                  placeholder="Enter remark before proceeding..."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                />
              </div>
            )}

            {/* Action Buttons */}
            {!actionType ? (
              <div className="mt-4 flex justify-between gap-2">
                <button
                  className="flex-1 bg-green-500 text-white py-2 px-3 rounded text-sm"
                  onClick={onApproveClick}
                >
                  Approve
                </button>
                <button
                  className="flex-1 bg-yellow-500 text-white py-2 px-3 rounded text-sm"
                  onClick={onReturnClick}
                >
                  Return
                </button>
                <button
                  className="flex-1 bg-red-500 text-white py-2 px-3 rounded text-sm"
                  onClick={onRejectClick}
                >
                  Decline
                </button>
              </div>
            ) : (
              <div className="mt-4 flex justify-center gap-4">
                <button
                  className="bg-blue-600 text-white py-2 px-6 rounded"
                  onClick={() => handleUpdateStatus(selectedBill._id, actionType)}
                >
                  Confirm {actionType === 'approved' ? 'Approval' : actionType === 'rejected' ? 'Rejection' : 'Return for Update'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
