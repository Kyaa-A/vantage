"use client";

import React, { useState, useMemo } from "react";
import { useUsers } from "@/hooks/useUsers";
import type {
  UserListResponse,
  User,
} from "@vantage/shared/src/generated/schemas/users";
import UserManagementTable from "./UserManagementTable";
import { UserForm } from "./UserForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Users,
  UserCheck,
  Building,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { UserManagementSkeleton } from "./UserManagementSkeleton";

export default function UserListSection() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;
  const { data, isLoading, error } = useUsers({
    page: 1,
    size: 100, // Fetch up to 100 users to show all users
  }) as {
    data?: UserListResponse;
    isLoading: boolean;
    error: unknown;
  };

  // Filter and paginate users
  const filteredAndPaginatedUsers = useMemo(() => {
    if (!data?.users) return { users: [], totalPages: 0, totalUsers: 0 };

    // Filter users based on search query
    const filtered = data.users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.phone_number && user.phone_number.includes(searchQuery))
    );

    // Calculate pagination
    const totalPages = Math.ceil(filtered.length / usersPerPage);
    const startIndex = (currentPage - 1) * usersPerPage;
    const paginatedUsers = filtered.slice(
      startIndex,
      startIndex + usersPerPage
    );

    return {
      users: paginatedUsers,
      totalPages,
      totalUsers: data.total || filtered.length, // Use API total if available
      allFilteredUsers: filtered,
    };
  }, [data?.users, data?.total, searchQuery, currentPage]);

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingUser(null);
  };

  if (isLoading) {
    return <UserManagementSkeleton />;
  }
  if (error) {
    console.error('User loading error:', error);
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-semibold mb-2">Error Loading Users</h3>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Unable to fetch user data. Please check your connection and try again.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  if (!data || !data.users) {
    return <div className="text-[var(--muted-foreground)]">No users found.</div>;
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Stats and Actions Header */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* User Statistics Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[var(--card)] border border-[var(--border)] shadow-lg rounded-sm p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--muted-foreground)]">
                  Total Users
                </p>
                <p className="text-3xl font-bold text-[var(--foreground)]">
                  {data.total || data.users.length}
                </p>
              </div>
              <div 
                className="w-12 h-12 rounded-sm flex items-center justify-center"
                style={{ backgroundColor: 'var(--kpi-blue-from)' }}
              >
                <Users className="h-6 w-6" style={{ color: 'var(--kpi-blue-text)' }} />
              </div>
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] shadow-lg rounded-sm p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--muted-foreground)]">
                  Active Users
                </p>
                <p className="text-3xl font-bold text-[var(--foreground)]">
                  {data.users.filter((u) => u.is_active).length}
                </p>
              </div>
              <div 
                className="w-12 h-12 rounded-sm flex items-center justify-center"
                style={{ backgroundColor: 'var(--analytics-success-bg)' }}
              >
                <UserCheck className="h-6 w-6" style={{ color: 'var(--analytics-success-text)' }} />
              </div>
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] shadow-lg rounded-sm p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--muted-foreground)]">
                  BLGU Users
                </p>
                <p className="text-3xl font-bold text-[var(--foreground)]">
                  {data.users.filter((u) => u.role === "BLGU_USER").length}
                </p>
              </div>
              <div 
                className="w-12 h-12 rounded-sm flex items-center justify-center"
                style={{ backgroundColor: 'var(--kpi-purple-from)' }}
              >
                <Building className="h-6 w-6" style={{ color: 'var(--kpi-purple-text)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Add User Button */}
        <div className="flex items-center justify-center lg:justify-end">
          <Button
            onClick={() => setIsFormOpen(true)}
            className="h-14 px-8 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-sm shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3"
          >
            <Plus className="h-5 w-5" />
            Add New User
          </Button>
        </div>
      </div>

      {/* Enhanced User Table with Search and Pagination */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-sm shadow-lg overflow-hidden">
        <div className="p-6 border-b border-[var(--border)]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-sm"></div>
                <h2 className="text-xl font-bold text-[var(--foreground)]">
                  User Accounts
                </h2>
              </div>
              <p className="text-[var(--muted-foreground)] mt-1">
                Manage user accounts, roles, and permissions
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full lg:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-[var(--muted-foreground)]" />
              </div>
              <Input
                type="text"
                placeholder="Search users by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full bg-[var(--background)] border-[var(--border)] rounded-sm focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
              />
            </div>
          </div>

          {/* Search Results Info */}
          {searchQuery && (
            <div className="mt-4 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <span>
                Showing {filteredAndPaginatedUsers.totalUsers} result
                {filteredAndPaginatedUsers.totalUsers !== 1 ? "s" : ""}
                {searchQuery && ` for "${searchQuery}"`}
              </span>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="h-6 px-2 text-xs hover:bg-[var(--kpi-blue-from)]"
                  style={{ color: 'var(--kpi-blue-text)' }}
                >
                  Clear search
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="p-6">
          <UserManagementTable
            users={filteredAndPaginatedUsers.users}
            onEditUser={handleEditUser}
          />

          {/* Pagination Controls */}
          {filteredAndPaginatedUsers.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-[var(--muted-foreground)]">
                Showing {(currentPage - 1) * usersPerPage + 1} to{" "}
                {Math.min(
                  currentPage * usersPerPage,
                  filteredAndPaginatedUsers.totalUsers
                )}{" "}
                of {filteredAndPaginatedUsers.totalUsers} users
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 bg-[var(--background)] hover:bg-[var(--hover)] border-[var(--border)] rounded-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: filteredAndPaginatedUsers.totalPages },
                    (_, i) => i + 1
                  ).map((pageNum) => {
                    // Show first page, last page, current page, and pages around current page
                    const showPage =
                      pageNum === 1 ||
                      pageNum === filteredAndPaginatedUsers.totalPages ||
                      Math.abs(pageNum - currentPage) <= 1;

                    if (!showPage && pageNum === 2 && currentPage > 4) {
                      return (
                        <span key={pageNum} className="px-2 text-gray-400">
                          ...
                        </span>
                      );
                    }

                    if (
                      !showPage &&
                      pageNum === filteredAndPaginatedUsers.totalPages - 1 &&
                      currentPage < filteredAndPaginatedUsers.totalPages - 3
                    ) {
                      return (
                        <span key={pageNum} className="px-2 text-gray-400">
                          ...
                        </span>
                      );
                    }

                    if (!showPage) return null;

                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-sm ${
                          currentPage === pageNum
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                            : "bg-[var(--background)] hover:bg-[var(--hover)] border-[var(--border)]"
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, filteredAndPaginatedUsers.totalPages)
                    )
                  }
                  disabled={
                    currentPage === filteredAndPaginatedUsers.totalPages
                  }
                  className="flex items-center gap-2 bg-[var(--background)] hover:bg-[var(--hover)] border-[var(--border)] rounded-sm"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* No Results Message */}
          {filteredAndPaginatedUsers.users.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[var(--hover)] rounded-sm flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-[var(--muted-foreground)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                No users found
              </h3>
              <p className="text-[var(--muted-foreground)] mb-4">
                No users match your search for &quot;{searchQuery}&quot;. Try
                adjusting your search terms.
              </p>
              <Button
                variant="outline"
                onClick={() => setSearchQuery("")}
                className="bg-[var(--background)] hover:bg-[var(--hover)] border-[var(--border)] rounded-sm"
              >
                Clear search
              </Button>
            </div>
          )}
        </div>
      </div>

      <UserForm
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        initialValues={
          editingUser
            ? {
                id: editingUser.id,
                name: editingUser.name,
                email: editingUser.email,
                role: editingUser.role,
                phone_number: editingUser.phone_number || undefined,
                validator_area_id: editingUser.validator_area_id || undefined,
                barangay_id: editingUser.barangay_id || undefined,
                is_active: editingUser.is_active,
                is_superuser: editingUser.is_superuser,
                must_change_password: editingUser.must_change_password,
              }
            : undefined
        }
        isEditing={!!editingUser}
      />
    </div>
  );
}
