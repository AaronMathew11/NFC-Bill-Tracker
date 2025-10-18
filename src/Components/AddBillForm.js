import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserId } from '../hooks/useUserId';
import { Plus } from 'lucide-react';
import Compressor from 'compressorjs';
import { addBill, addBillJson, updateBillContent, updateBillContentJson, checkDuplicate } from '../services/dbService';

export default function AddBillForm({ editingBill = null, onSave = null }) {
  const { user } = useAuth();
  const userId = useUserId();

  const [billData, setBillData] = useState(editingBill ? {
    entryDate: editingBill.entryDate ? new Date(editingBill.entryDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    billDate: editingBill.billDate ? new Date(editingBill.billDate).toISOString().split('T')[0] : '',
    personName: editingBill.personName || '',
    amount: editingBill.amount || '',
    type: editingBill.type || 'debit',
    description: editingBill.description || '',
    category: editingBill.category || '',
    photo: null,
    isDraft: editingBill.isDraft || false,
  } : {
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
  const [photoPreview, setPhotoPreview] = useState(editingBill?.photoUrl || null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [isEditing] = useState(!!editingBill);

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
    setBillData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
      
      // Compress the image using Compressor.js
      new Compressor(file, {
        quality: 0.6,  // Adjust the quality (0 to 1)
        maxWidth: 1024,  // Set maximum width
        maxHeight: 1024, // Set maximum height
        success: async (result) => {
          try {
            // Convert compressed image to base64
            const base64 = await fileToBase64(result);
            setPhotoBase64(base64);
            setBillData((prev) => ({ ...prev, photo: result }));
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

  const saveDraftBill = async (draftData, showAlert = true) => {
    try {
      const jsonData = {
        entryDate: draftData.entryDate,
        billDate: draftData.billDate || '',
        category: draftData.category || '',
        isDraft: true,
        personName: draftData.personName || '',
        amount: draftData.amount || '0',
        type: draftData.type,
        description: draftData.description || '',
        userId: userId,
        photoBase64: photoBase64
      };

      const result = isEditing 
        ? await updateBillContentJson(editingBill._id, jsonData)
        : await addBillJson(jsonData);
      
      if (result.success) {
        if (showAlert) {
          alert(isEditing ? 'Draft updated successfully!' : 'Draft saved successfully!');
        }
        if (onSave) {
          onSave(result.bill);
        }
        return result.bill;
      } else {
        if (showAlert) {
          alert('Failed to save draft: ' + (result.message || 'Unknown error'));
        }
        return null;
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      if (showAlert) {
        alert('Failed to save draft. Please try again.');
      }
      return null;
    }
  };

  const checkForDuplicates = async (billData) => {
    try {
      const result = await checkDuplicate({
        billDate: billData.billDate,
        amount: billData.amount,
        description: billData.description,
        personName: billData.personName
      });
      return result.isDuplicate;
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields for submission (not draft)
    if (!billData.isDraft) {
      if (!billData.billDate || !billData.personName || !billData.amount || !billData.category) {
        alert('Please fill in all required fields: Bill Date, Person Name, Amount, and Category');
        return;
      }

      // Check for duplicates if not a draft and not editing
      if (!isEditing) {
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
    }

    try {
      const jsonData = {
        entryDate: billData.entryDate,
        billDate: billData.billDate,
        category: billData.category,
        isDraft: billData.isDraft,
        personName: billData.personName,
        amount: billData.amount,
        type: billData.type,
        description: billData.description,
        userId: userId,
        photoBase64: photoBase64
      };

      const result = isEditing 
        ? await updateBillContentJson(editingBill._id, jsonData)
        : await addBillJson(jsonData);

      if (result.success) {
        const message = billData.isDraft 
          ? (isEditing ? 'Draft updated successfully!' : 'Bill saved as draft!') 
          : (isEditing ? 'Bill updated successfully!' : 'Bill submitted successfully!');
        alert(message);
        
        if (onSave) {
          onSave(result.bill);
        } else {
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
          setPhotoPreview(null);
        }
      } else {
        alert('Failed to save bill: ' + (result.message || 'Unknown error'));
      }

    } catch (error) {
      console.error('Error during upload:', error);
      alert('Something went wrong. Please try again later.');
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Edit Bill' : 'Add New Bill'}
          </h2>
          {isEditing && (
            <button
              onClick={() => onSave && onSave(null)}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Cancel
            </button>
          )}
        </div>
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
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50"
              />
            </div>
          </div>

          {/* Person Name Input */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Person Name</label>
            <input
              type="text"
              name="personName"
              placeholder="Enter person name"
              value={billData.personName}
              onChange={handleChange}
              className="w-full p-4 rounded-xl focus:ring-2 focus:border-transparent outline-none"
              style={{
                backgroundColor: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                focusRingColor: 'var(--accent-primary)'
              }}
            />
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Amount (₹)</label>
            <input
              type="number"
              name="amount"
              placeholder="0.00"
              value={billData.amount}
              onChange={handleChange}
              className="w-full p-4 rounded-xl focus:ring-2 focus:border-transparent outline-none"
              style={{
                backgroundColor: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                focusRingColor: 'var(--accent-primary)'
              }}
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
              {photoPreview ? (
                <div className="space-y-3">
                  <img 
                    src={photoPreview} 
                    alt="Receipt preview" 
                    className="max-w-full h-32 object-cover rounded-lg mx-auto"
                  />
                  <div className="flex gap-2">
                    <label htmlFor="photo-upload" className="flex-1 bg-blue-100 text-blue-700 py-2 px-4 rounded-lg text-sm font-medium cursor-pointer hover:bg-blue-200 transition">
                      Change Photo
                    </label>
                    <button 
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null);
                        setPhotoBase64(null);
                        setBillData(prev => ({ ...prev, photo: null }));
                      }}
                      className="bg-red-100 text-red-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-200 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Upload Receipt</p>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG or PDF</p>
                </label>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                const draftData = { ...billData, isDraft: true };
                await saveDraftBill(draftData);
              }}
              className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl hover:bg-gray-200 transition font-medium"
            >
              {isEditing ? 'Update Draft' : 'Save Draft'}
            </button>
            <button
              type="submit"
              onClick={() => setBillData(prev => ({ ...prev, isDraft: false }))}
              className="flex-1 bg-blue-500 text-white py-4 rounded-xl hover:bg-blue-600 transition font-medium shadow-sm"
            >
              {isEditing ? 'Update Bill' : 'Submit Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
