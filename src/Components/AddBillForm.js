import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';

export default function AddBillForm() {
  const { user } = useUser();  // Using Clerk's user hook to get the user data

  const [billData, setBillData] = useState({
    date: '',
    personName: '',
    amount: '',
    type: 'debit',
    description: '',
    photo: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBillData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBillData((prev) => ({ ...prev, photo: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const formData = new FormData();
      formData.append('date', billData.date);
      formData.append('personName', billData.personName);
      formData.append('amount', billData.amount);
      formData.append('type', billData.type);
      formData.append('description', billData.description);
      formData.append('userId', user?.publicMetadata?.id);
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
        alert('Bill uploaded successfully!');
        setBillData({
          date: '',
          personName: '',
          amount: '',
          type: 'debit',
          description: '',
          photo: null,
        });
        setImagePreview(null);
      } else {
        alert('Failed to upload bill: ' + (result.message || 'Unknown error'));
      }
  
    } catch (error) {
      console.error('Error during upload:', error);
      alert('Something went wrong. Please try again later.');
    }
  };
  

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg max-w-lg mx-auto">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Add New Bill</h2>

      {/* Date Input */}
      <input
        type="date"
        name="date"
        value={billData.date}
        onChange={handleChange}
        required
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
      />

      {/* Person Name Input */}
      <input
        type="text"
        name="personName"
        placeholder="Person Name"
        value={billData.personName}
        onChange={handleChange}
        required
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
      />

      {/* Amount Input */}
      <input
        type="number"
        name="amount"
        placeholder="Amount"
        value={billData.amount}
        onChange={handleChange}
        required
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
      />

      {/* Type Select (Debit/Credit) */}
      <select
        name="type"
        value={billData.type}
        onChange={handleChange}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
      >
        <option value="debit">Debit</option>
        <option value="credit">Credit</option>
      </select>

      {/* Description Input */}
      <textarea
        name="description"
        placeholder="Description"
        value={billData.description}
        onChange={handleChange}
        rows="4"
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
      />

      {/* Capture Image */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoChange}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
      />

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition duration-300"
      >
        Submit Bill
      </button>
    </form>
  );
}
