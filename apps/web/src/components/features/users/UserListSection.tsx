'use client';

import React from 'react';
import { useUsers } from '@/hooks/useUsers';
import type { UserListResponse, User } from '@vantage/shared/src/generated/schemas/users';
import UserManagementTable from './UserManagementTable';
import { UserForm } from './UserForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function UserListSection() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const { data, isLoading, error } = useUsers() as { data?: UserListResponse, isLoading: boolean, error: unknown };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingUser(null);
  };

  if (isLoading) {
    return <div>Loading users...</div>;
  }
  if (error) {
    return <div className="text-red-500">Error loading users.</div>;
  }
  if (!data || !data.users) {
    return <div>No users found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button 
          onClick={() => setIsFormOpen(true)} 
          className="flex items-center gap-2 px-4 py-2"
          size="default"
        >
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>
      
      <UserManagementTable 
        users={data.users} 
        onEditUser={handleEditUser}
      />
      
      <UserForm
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        initialValues={editingUser ? {
          id: editingUser.id,
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          phone_number: editingUser.phone_number || undefined,
          governance_area_id: editingUser.governance_area_id || undefined,
          barangay_id: editingUser.barangay_id || undefined,
          is_active: editingUser.is_active,
          is_superuser: editingUser.is_superuser,
          must_change_password: editingUser.must_change_password,
        } : undefined}
        isEditing={!!editingUser}
      />
    </div>
  );
} 