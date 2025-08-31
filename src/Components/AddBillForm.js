import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserId } from '../hooks/useUserId';
import { Plus } from 'lucide-react';
import Compressor from 'compressorjs';

export default function AddBillForm() {
  const { user } = useAuth();
  const userId = useUserId();

  const [billData, setBillData] = useState({
    entryDate: new Date().toISOString().split('T')[0],
    billDate: '',
    personName: '',
    amount: '',
    type: 'debit',
    description: '',
    category: '',
    photo: null,
    isDraft: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBillData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Compress the image using Compressor.js
      new Compressor(file, {
        quality: 0.6,  // Adjust the quality (0 to 1)
        maxWidth: 1024,  // Set maximum width
        maxHeight: 1024, // Set maximum height
        success(result) {
          setBillData((prev) => ({ ...prev, photo: result }));
        },
        error(err) {
          console.error('Image compression failed:', err);
        },
      });
    }
  };

  const checkForDuplicates = async (billData) => {
    try {
      const response = await fetch('https://nfc-bill-tracker-backend.onrender.com/api/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billDate: billData.billDate,
          amount: billData.amount,
          description: billData.description,
          personName: billData.personName
        })
      });
      const result = await response.json();
      return result.isDuplicate;
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check for duplicates if not a draft
    if (!billData.isDraft) {
      const isDuplicate = await checkForDuplicates(billData);
      if (isDuplicate) {
        const confirmSubmit = window.confirm(
          'A similar bill already exists with the same date, amount, and description. Do you want to proceed anyway?'
        );
        if (!confirmSubmit) {
          return;
        }
      }
    }

    try {
      const formData = new FormData();
      formData.append('entryDate', billData.entryDate);
      formData.append('billDate', billData.billDate);
      formData.append('category', billData.category);
      formData.append('isDraft', billData.isDraft);
      formData.append('personName', billData.personName);
      formData.append('amount', billData.amount);
      formData.append('type', billData.type);
      formData.append('description', billData.description);
      formData.append('userId', userId);
      if (billData.photo) {
        formData.append('photo', billData.photo);
      }

      const response = await fetch('https://nfc-bill-tracker-backend.onrender.com/api/upload-bill', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log(result);  // Log the result to debug

      if (response.ok) {
        const message = billData.isDraft ? 'Bill saved as draft!' : 'Bill submitted successfully!';
        alert(message);
        setBillData({
          entryDate: new Date().toISOString().split('T')[0],
          billDate: '',
          personName: '',
          amount: '',
          type: 'debit',
          description: '',
          category: '',
          photo: null,
          isDraft: false,
        });
      } else {
        alert('Failed to upload bill: ' + (result.message || 'Unknown error'));
      }

    } catch (error) {
      console.error('Error during upload:', error);
      alert('Something went wrong. Please try again later.');
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Add New Bill</h2>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Date Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Entry Date</label>
              <input
                type="date"
                name="entryDate"
                value={billData.entryDate}
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
                value={billData.billDate}
                onChange={handleChange}
                required
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50"
              />
            </div>
          </div>

          {/* Person Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Person Name</label>
            <input
              type="text"
              name="personName"
              placeholder="Enter person name"
              value={billData.personName}
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
              value={billData.amount}
              onChange={handleChange}
              required
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50"
            />
          </div>

          {/* Category and Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                name="category"
                value={billData.category}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                name="type"
                value={billData.type}
                onChange={handleChange}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50"
              >
                <option value="debit">Expense</option>
                <option value="credit">Income</option>
              </select>
            </div>
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              placeholder="Enter bill description"
              value={billData.description}
              onChange={handleChange}
              rows="3"
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 resize-none"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Photo</label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-gray-300 transition">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="cursor-pointer">
                <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700">Upload Receipt</p>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG or PDF</p>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={(e) => {
                setBillData(prev => ({ ...prev, isDraft: true }));
                setTimeout(() => handleSubmit(e), 0);
              }}
              className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl hover:bg-gray-200 transition font-medium"
            >
              Save Draft
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white py-4 rounded-xl hover:bg-blue-600 transition font-medium shadow-sm"
            >
              Submit Bill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
