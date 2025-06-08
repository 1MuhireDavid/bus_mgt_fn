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
import { Role, User } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

type Props = {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
};

type Company = {
  id: string;
  name: string;
  tin: string;
  is_active: boolean;
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
    company_id: "",
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
        role_id: user.roles?.[0]?.id || "",
        company_id: user.company || "",
        password: "",
        confirm_password: "",
      });
    } else {
      setFormData({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        phone: "",
        role_id: "",
        company_id: "",
        password: "",
        confirm_password: "",
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen) return;

      try {
        const token = localStorage.getItem("access_token");
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        // Fetch roles
        setLoadingRoles(true);
        const rolesRes = await fetch(`${API_BASE_URL}/roles/`, { headers });
        const rolesData = await rolesRes.json();
        if (rolesRes.ok) {
          setRoles(rolesData.data || []);
        } else {
          toast.error("Failed to load roles");
        }

        // Fetch companies
        setLoadingCompanies(true);
        const companiesRes = await fetch(
          `${API_BASE_URL}/companies/companies/`,
          { headers }
        );
        const companiesData = await companiesRes.json();
        if (companiesRes.ok) {
          // Filter only active companies
          const activeCompanies = (
            companiesData.data ||
            companiesData ||
            []
          ).filter((company: Company) => company.is_active);
          setCompanies(activeCompanies);
        } else {
          toast.error("Failed to load companies");
        }
      } catch (err) {
        toast.error("Error loading data");
        console.error("Error:", err);
      } finally {
        setLoadingRoles(false);
        setLoadingCompanies(false);
      }
    };

    fetchData();
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.username.trim()) errors.push("Username is required");
    if (!formData.first_name.trim()) errors.push("First name is required");
    if (!formData.last_name.trim()) errors.push("Last name is required");
    if (!formData.company_id) errors.push("Company is required");
    if (!formData.role_id) errors.push("Role is required");

    if (!user) {
      // For new users, password is required
      if (!formData.password) errors.push("Password is required");
      if (formData.password !== formData.confirm_password) {
        errors.push("Passwords do not match");
      }
      if (formData.password && formData.password.length < 8) {
        errors.push("Password must be at least 8 characters long");
      }
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.push("Please enter a valid email address");
    }

    return errors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("access_token");
    const isEdit = Boolean(user);
    const endpoint = isEdit
      ? `${API_BASE_URL}/auth/${user?.id}/`
      : `${API_BASE_URL}/auth/register/`;
    const method = isEdit ? "PUT" : "POST";
console.log(formData.company_id,"formData.company_id")
    try {
      const bodyData: any = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        company: formData.company_id,
        roles: formData.role_id ? [formData.role_id] : [],
      };

      // Only include password fields for new users
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

      if (!res.ok) {
        // Handle specific error messages
        if (data.errors) {
          Object.values(data.errors)
            .flat()
            .forEach((error: any) => {
              toast.error(error);
            });
        } else {
          throw new Error(data.message || "Something went wrong");
        }
        return;
      }

      toast.success(`User ${isEdit ? "updated" : "created"} successfully`);
      refetch();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Add New User"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username *</label>
            <Input
              name="username"
              placeholder="Enter username"
              value={formData.username}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              name="email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">
                First Name *
              </label>
              <Input
                name="first_name"
                placeholder="First name"
                value={formData.first_name}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Last Name *
              </label>
              <Input
                name="last_name"
                placeholder="Last name"
                value={formData.last_name}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <Input
              name="phone"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Company *</label>
            <select
              name="company_id"
              className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.company_id}
              onChange={handleChange}
              disabled={loadingCompanies || isSubmitting}
            >
              <option value="">
                {loadingCompanies ? "Loading companies..." : "Select Company"}
              </option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} ({company.tin})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role *</label>
            <select
              name="role_id"
              className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.role_id}
              onChange={handleChange}
              disabled={loadingRoles || isSubmitting}
            >
              <option value="">
                {loadingRoles ? "Loading roles..." : "Select Role"}
              </option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          {!user && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Password *
                </label>
                <Input
                  name="password"
                  placeholder="Enter password (min 8 characters)"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Confirm Password *
                </label>
                <Input
                  name="confirm_password"
                  placeholder="Confirm password"
                  type="password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || loadingRoles || loadingCompanies}
              className="flex-1"
            >
              {isSubmitting ? "Saving..." : user ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
