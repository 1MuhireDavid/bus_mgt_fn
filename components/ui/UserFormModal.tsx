"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { User } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

type Props = {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
};

type Role = {
  id: string;
  name: string;
};

export default function UserFormModal({
  user,
  isOpen,
  onClose,
  refetch,
}: Props) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    password: "",
    confirm_password: "",
    role_id: "",
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        role_id: user.roles?.[0]?.id || "",
      });
    } else {
      setFormData({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        role_id: "",
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/roles/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setRoles(data.data || []);
        } else {
          toast.error("Failed to load roles");
        }
      } catch (err) {
        toast.error("Error loading roles");
      } finally {
        setLoadingRoles(false);
      }
    };

    if (isOpen) fetchRoles();
  }, [isOpen]);

  const handleChange = (e: any) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("access_token");
    const isEdit = Boolean(user);
    const endpoint = isEdit
      ? `${API_BASE_URL}/auth/${user?.id}/`
      : `${API_BASE_URL}/auth/register/`;
    const method = isEdit ? "PUT" : "POST";

    try {
      const bodyData: any = {
  username: formData.username,
  email: formData.email,
  first_name: formData.first_name,
  last_name: formData.last_name,
  phone: formData.phone,
  roles: formData.role_id ? [formData.role_id] : [],
};
if (!isEdit) {
  bodyData.password = formData.password;
  bodyData.confirm_password = formData.confirm_password;
}




      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(`User ${isEdit ? "updated" : "created"} successfully`);
      refetch();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Add New User"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
          />
          <Input
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />
          <Input
            name="first_name"
            placeholder="First Name"
            value={formData.first_name}
            onChange={handleChange}
          />
          <Input
            name="last_name"
            placeholder="Last Name"
            value={formData.last_name}
            onChange={handleChange}
          />
          <Input
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange}
          />
          {!user && (
            <>
              <Input
                name="password"
                placeholder="Password"
                type="password"
                value={formData.password}
                onChange={handleChange}
              />
              <Input
                name="confirm_password"
                placeholder="Confirm Password"
                type="password"
                value={formData.confirm_password}
                onChange={handleChange}
              />
            </>
          )}

          <select
            name="role_id"
            className="w-full border p-2 rounded"
            value={formData.role_id}
            onChange={handleChange}
            disabled={loadingRoles}
          >
            <option value="">Select Role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <Button onClick={handleSubmit}>{user ? "Update" : "Create"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
