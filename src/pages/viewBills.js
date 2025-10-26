import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserId } from '../hooks/useUserId';
import { getUserSubmittedBills, getAllBills, updateBillStatus } from '../services/dbService';
import { sendEmailNotification, emailTemplates } from '../services/emailService';

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
  }, [userId, user]);

  const fetchBills = useCallback(async (abortSignal) => {
    if (!userId || !user) return;
    
    try {
      setLoading(true);
      
      // Admins should see all pending bills, users see only their own
      const isAdmin = user?.role === 'admin' || user?.publicMetadata?.role === 'admin';
      const data = isAdmin ? await getAllBills() : await getUserSubmittedBills();
      
      if (abortSignal?.aborted) return;
      
      if (data.success) {
        const bills = data.bills.filter(bill => bill.status === 'pending');
        setPendingBills(bills);
        console.log(`Fetched ${bills.length} pending bills for ${isAdmin ? 'admin' : 'user'}`);
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
  }, [userId, user]);

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
      const statusData = { 
        status, 
        remarks: remark,
        adminId: userId,
        adminName: user?.firstName || 'Admin'
      };
      
      const result = await updateBillStatus(billId, statusData);
      
      if (result.success) {
        setPendingBills((prevBills) => prevBills.filter((bill) => bill._id !== billId));
        
        // Send proper email notification
        try {
          let emailData;
          const userForEmail = { email: selectedBill.userEmail, firstName: selectedBill.personName };
          
          if (status === 'approved') {
            emailData = emailTemplates.billApproved(selectedBill, userForEmail);
          } else if (status === 'rejected') {
            emailData = emailTemplates.billRejected(selectedBill, userForEmail, remark);
          } else if (status === 'returned') {
            emailData = emailTemplates.billNeedsUpdate(selectedBill, userForEmail, remark);
          }
          
          if (emailData) {
            await sendEmailNotification(emailData);
          }
        } catch (emailError) {
          console.error('Error sending email notification:', emailError);
        }
        
        closeModal();
      } else {
        console.error('Failed to update bill:', result.error);
      }
    } catch (error) {
      console.error('Error updating bill:', error);
    }
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-lg relative overflow-hidden max-h-[90vh] overflow-y-auto">
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
                  alt="Receipt"
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
              <div className="mt-4 flex flex-col sm:flex-row justify-between gap-2">
                <button
                  className="flex-1 bg-green-500 text-white py-3 px-4 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                  onClick={onApproveClick}
                >
                  Approve
                </button>
                <button
                  className="flex-1 bg-yellow-500 text-white py-3 px-4 rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors"
                  onClick={onReturnClick}
                >
                  Return
                </button>
                <button
                  className="flex-1 bg-red-500 text-white py-3 px-4 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                  onClick={onRejectClick}
                >
                  Decline
                </button>
              </div>
            ) : (
              <div className="mt-4 flex justify-center">
                <button
                  className="w-full sm:w-auto bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
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
