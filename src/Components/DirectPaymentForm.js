import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserId } from '../hooks/useUserId';
import { Plus } from 'lucide-react';
import Compressor from 'compressorjs';
import { addDirectPayment, addDirectPaymentJson } from '../services/dbService';

export default function DirectPaymentForm() {
  const { user } = useAuth();
  const userId = useUserId();

  const [paymentData, setPaymentData] = useState({
    entryDate: new Date().toISOString().split('T')[0],
    billDate: '',
    vendorName: '',
    amount: '',
    description: '',
    category: '',
    photo: null,
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);

  // Helper function to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPaymentData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
      
      new Compressor(file, {
        quality: 0.6,
        maxWidth: 1024,
        maxHeight: 1024,
        success: async (result) => {
          try {
            // Convert compressed image to base64
            const base64 = await fileToBase64(result);
            setPhotoBase64(base64);
            setPaymentData((prev) => ({ ...prev, photo: result }));
          } catch (error) {
            console.error('Failed to convert image to base64:', error);
            setPhotoPreview(null);
            setPhotoBase64(null);
          }
        },
        error(err) {
          console.error('Image compression failed:', err);
          setPhotoPreview(null);
          setPhotoBase64(null);
        },
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const jsonData = {
        entryDate: paymentData.entryDate,
        billDate: paymentData.billDate,
        vendorName: paymentData.vendorName,
        amount: paymentData.amount,
        description: paymentData.description,
        category: paymentData.category,
        type: 'debit', // Direct payments are typically debits
        paymentType: 'direct',
        status: 'pending', // Direct payments require approval from another admin
        dateOfSettlement: new Date().toISOString().split('T')[0],
        adminId: userId,
        adminName: user?.firstName || user?.fullName || 'Admin',
        photoBase64: photoBase64
      };

      const result = await addDirectPaymentJson(jsonData);

      if (result.success) {
        alert('Direct payment logged successfully! It requires approval from another admin before appearing in the ledger.');
        setPaymentData({
          entryDate: new Date().toISOString().split('T')[0],
          billDate: '',
          vendorName: '',
          amount: '',
          description: '',
          category: '',
          photo: null,
        });
        setPhotoPreview(null);
        setPhotoBase64(null);
      } else {
        alert('Failed to log payment: ' + (result.message || 'Unknown error'));
      }

    } catch (error) {
      console.error('Error during payment logging:', error);
      alert('Something went wrong. Please try again later.');
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Log Direct Payment</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Note:</span> Direct payments require approval from another admin before they appear in the ledger and affect the balance.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Date Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Entry Date</label>
              <input
                type="date"
                name="entryDate"
                value={paymentData.entryDate}
                onChange={handleChange}
                required
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bill's Date</label>
              <input
                type="date"
                name="billDate"
                value={paymentData.billDate}
                onChange={handleChange}
                required
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50"
              />
            </div>
          </div>

          {/* Vendor Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vendor/Supplier Name</label>
            <input
              type="text"
              name="vendorName"
              placeholder="Enter vendor name"
              value={paymentData.vendorName}
              onChange={handleChange}
              required
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50"
            />
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹)</label>
            <input
              type="number"
              name="amount"
              placeholder="0.00"
              value={paymentData.amount}
              onChange={handleChange}
              required
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50"
            />
          </div>

          {/* Category Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              name="category"
              value={paymentData.category}
              onChange={handleChange}
              required
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50"
            >
              <option value="">Select Category</option>
              <option value="Events">Events</option>
              <option value="Supplies">Supplies</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Travel">Travel</option>
              <option value="Food">Food</option>
              <option value="Utilities">Utilities</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              placeholder="Enter payment description"
              value={paymentData.description}
              onChange={handleChange}
              required
              rows="3"
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 resize-none"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Receipt/Invoice (Optional)</label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-gray-300 transition">
              <input
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
                id="payment-photo-upload"
              />
              {photoPreview ? (
                <div className="space-y-3">
                  <img 
                    src={photoPreview} 
                    alt="Receipt preview" 
                    className="max-w-full h-32 object-cover rounded-lg mx-auto"
                  />
                  <div className="flex gap-2">
                    <label htmlFor="payment-photo-upload" className="flex-1 bg-purple-100 text-purple-700 py-2 px-4 rounded-lg text-sm font-medium cursor-pointer hover:bg-purple-200 transition">
                      Change Photo
                    </label>
                    <button 
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null);
                        setPhotoBase64(null);
                        setPaymentData(prev => ({ ...prev, photo: null }));
                      }}
                      className="bg-red-100 text-red-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-200 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label htmlFor="payment-photo-upload" className="cursor-pointer">
                  <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Upload Receipt</p>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG or PDF</p>
                </label>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-purple-500 text-white py-4 rounded-xl hover:bg-purple-600 transition font-medium shadow-sm mt-6"
          >
            Log Direct Payment
          </button>
        </form>
      </div>
    </div>
  );
}