import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserId } from '../hooks/useUserId';
import { getPendingDirectPayments, updateBillStatus } from '../services/dbService';

export default function DirectPaymentApprovals() {
  const { user } = useAuth();
  const userId = useUserId();
  
  const [pendingPayments, setPendingPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [remark, setRemark] = useState('');
  const [actionType, setActionType] = useState('');
  const [loading, setLoading] = useState(true);

  // Reset state when user changes
  useEffect(() => {
    setPendingPayments([]);
    setSelectedPayment(null);
    setRemark('');
    setActionType('');
    setLoading(true);
  }, [userId]);

  const fetchPendingPayments = useCallback(async (abortSignal) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const data = await getPendingDirectPayments(userId);
      
      if (abortSignal?.aborted) return;
      
      if (data.success) {
        setPendingPayments(data.bills);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching pending payments:', error);
      }
    } finally {
      if (!abortSignal?.aborted) {
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchPendingPayments(abortController.signal);
    
    return () => {
      abortController.abort();
    };
  }, [fetchPendingPayments]);

  function closeModal() {
    setSelectedPayment(null);
    setRemark('');
    setActionType('');
  }

  async function handleUpdateStatus(paymentId, status) {
    if (!remark.trim() && status === 'rejected') {
      alert('Please enter a remark before rejecting.');
      return;
    }

    try {
      const statusData = { 
        status, 
        remarks: remark,
        adminId: userId,
        adminName: user?.firstName || 'Admin'
      };
      
      const result = await updateBillStatus(paymentId, statusData);
      
      if (result.success) {
        setPendingPayments((prevPayments) => 
          prevPayments.filter((payment) => payment._id !== paymentId)
        );
        
        const message = status === 'approved' 
          ? 'Direct payment approved successfully!' 
          : 'Direct payment rejected successfully!';
        alert(message);
        
        closeModal();
      } else {
        if (result.error?.includes('cannot be approved by the same admin')) {
          alert('You cannot approve direct payments that you created yourself.');
        } else {
          alert('Failed to update payment: ' + (result.error || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Failed to update payment. Please try again.');
    }
  }

  function onApproveClick() {
    setActionType('approved');
  }

  function onRejectClick() {
    setActionType('rejected');
  }

  if (loading) {
    return <div className="text-center mt-10 text-gray-500">Loading pending payments...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4 mt-6">Pending Direct Payment Approvals</h2>

      {/* Mobile View (Card style) */}
      <div className="md:hidden">
        {pendingPayments.length > 0 ? (
          pendingPayments.map((payment) => (
            <div
              key={payment._id}
              className="bg-white p-4 mb-4 shadow-md rounded-lg border cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedPayment(payment)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm text-gray-600">{payment.vendorName || payment.personName}</div>
                <div className="text-sm font-semibold text-red-600">
                  - ₹{Number(payment.amount).toLocaleString()}
                </div>
              </div>
              <div className="text-md font-semibold text-gray-800 mb-2">{payment.description}</div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{payment.category}</span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                  Pending Approval
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">💳</span>
            </div>
            <p className="text-gray-500">No pending direct payments to approve</p>
            <p className="text-sm text-gray-400 mt-2">Direct payments from other admins will appear here</p>
          </div>
        )}
      </div>

      {/* Modal for showing payment details */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-lg relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-600 text-lg font-bold hover:text-gray-800"
            >
              &times;
            </button>

            {/* Payment Image */}
            <div className="mb-4">
              {selectedPayment.photoUrl ? (
                <img
                  src={selectedPayment.photoUrl}
                  alt="Payment Receipt"
                  className="w-full h-auto rounded-lg object-contain mb-4"
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                  No Receipt Image
                </div>
              )}
            </div>

            {/* Payment Details */}
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Direct Payment Details</h3>
              <div className="space-y-2">
                <p className="text-gray-700"><strong>Vendor:</strong> {selectedPayment.vendorName || selectedPayment.personName}</p>
                <p className="text-gray-700"><strong>Description:</strong> {selectedPayment.description}</p>
                <p className="text-gray-700"><strong>Amount:</strong> - ₹{Number(selectedPayment.amount).toLocaleString()}</p>
                <p className="text-gray-700"><strong>Category:</strong> {selectedPayment.category}</p>
                <p className="text-gray-700"><strong>Date:</strong> {new Date(selectedPayment.billDate).toLocaleDateString()}</p>
                <p className="text-gray-700"><strong>Created by:</strong> Admin</p>
              </div>
            </div>

            {/* Remark input */}
            {actionType && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {actionType === 'approved' ? 'Approval Note (Optional)' : 'Rejection Reason (Required)'}
                </label>
                <textarea
                  placeholder={actionType === 'approved' 
                    ? "Enter any notes about this approval..." 
                    : "Please explain why this payment is being rejected..."
                  }
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                  Approve Payment
                </button>
                <button
                  className="flex-1 bg-red-500 text-white py-3 px-4 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                  onClick={onRejectClick}
                >
                  Reject Payment
                </button>
              </div>
            ) : (
              <div className="mt-4 flex justify-center">
                <button
                  className="w-full sm:w-auto bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  onClick={() => handleUpdateStatus(selectedPayment._id, actionType)}
                >
                  Confirm {actionType === 'approved' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}