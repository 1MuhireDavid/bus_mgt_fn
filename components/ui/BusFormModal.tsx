'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/store/authStore';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
  bus: any | null;
};


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export default function BusFormModal({ isOpen, onClose, refetch, bus }: Props) {

    const { user } = useAuthStore();
    console.log(user,"user,,,,")
  const [formData, setFormData] = useState({
    plate_number: '',
    model: '',
    capacity: '',
    status: 'available',
    year: "",
    company: "",
    created_by: ""
  });


  const isEdit = Boolean(bus);

  useEffect(() => {
    if (bus) {
      setFormData({
        plate_number: bus.plate_number || '',
        model: bus.model || '',
        capacity: String(bus.capacity || ''),
        status: bus.status || 'active',
        year: bus.year || "",
        company: user?.company || "",
        created_by: user?.id || ""

      });
    } else {
      setFormData({
        plate_number: '',
        model: '',
        capacity: '',
        status: 'active',
        year: "",
        company: "",
        created_by: ""
      });
    }
  }, [bus,user?.company, user?.id]);


  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('access_token');
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit
      ? `${API_BASE_URL}/fleet/buses/${bus.id}/`
      : `${API_BASE_URL}/fleet/buses/`;

    const payload = {
  plate_number: formData.plate_number,
  model: formData.model,
  year: parseInt(formData.year),
  capacity: parseInt(formData.capacity),
  status: formData.status,
  company: user?.company,
  created_by: user?.id
};


    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to save bus');
      toast.success(`Bus ${isEdit ? 'updated' : 'created'} successfully`);
      refetch();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error saving bus');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Bus' : 'Add New Bus'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            name="plate_number"
            placeholder="Plate Number"
            value={formData.plate_number}
            onChange={handleChange}
          />
          <Input
            name="model"
            placeholder="Model"
            value={formData.model}
            onChange={handleChange}
          />
          <Input
            name="capacity"
            type="number"
            placeholder="Capacity"
            value={formData.capacity}
            onChange={handleChange}
          />
          <Input
            name="year"
            type="number"
            placeholder="Year"
            value={formData.year}
            onChange={handleChange}
          />
          <select name="status" value={formData.status} onChange={handleChange} className="w-full border p-2 rounded">
  <option value="active">Active</option>
  <option value="under_maintenance">Under Maintenance</option>
  <option value="decommissioned">Decommissioned</option>
</select>

          <Button onClick={handleSubmit}>
            {isEdit ? 'Update Bus' : 'Create Bus'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
