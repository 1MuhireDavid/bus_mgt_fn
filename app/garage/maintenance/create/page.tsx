'use client';

import { useState } from 'react';
import { maintenanceAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function NewMaintenancePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    bus_assignment: '',
    maintenance_type: '', 
    cost: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await maintenanceAPI.create(formData);
      router.push('/garage/maintenance');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit maintenance record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">New Maintenance Record</h1>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="bus_assignment"
          placeholder="Bus Assignment ID"
          value={formData.bus_assignment}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        
        <input
          type="text"
          name="maintenance_type"
          placeholder="Maintenance Type"
          value={formData.maintenance_type}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />

        <input
          type="number"
          name="cost"
          placeholder="Cost"
          value={formData.cost}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Record'}
        </button>
      </form>
    </div>
  );
}
