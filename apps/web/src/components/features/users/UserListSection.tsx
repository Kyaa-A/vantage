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

export default function UserListSection() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;
  const { data, isLoading, error } = useUsers() as {
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
      totalUsers: filtered.length,
      allFilteredUsers: filtered,
    };
  }, [data?.users, searchQuery, currentPage]);

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
    return <div>Loading users...</div>;
  }
  if (error) {
    return <div className="text-red-500">Error loading users.</div>;
  }
  if (!data || !data.users) {
    return <div>No users found.</div>;
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Stats and Actions Header */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* User Statistics Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/40 border-0 shadow-lg rounded-sm p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  Total Users
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {data.users.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-sm flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50/80 via-emerald-50/60 to-teal-50/40 border-0 shadow-lg rounded-sm p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  Active Users
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {data.users.filter((u) => u.is_active).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-sm flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50/80 via-violet-50/60 to-indigo-50/40 border-0 shadow-lg rounded-sm p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  BLGU Users
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {data.users.filter((u) => u.role === "BLGU_USER").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-sm flex items-center justify-center">
                <Building className="h-6 w-6 text-purple-600" />
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
      <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-sm shadow-lg border-0 overflow-hidden">
        <div className="p-6 border-b border-gray-200/60">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-sm"></div>
                <h2 className="text-xl font-bold text-gray-900">
                  User Accounts
                </h2>
              </div>
              <p className="text-gray-600 mt-1">
                Manage user accounts, roles, and permissions
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full lg:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search users by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full bg-white/80 backdrop-blur-sm border-gray-300 rounded-sm focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
              />
            </div>
          </div>

          {/* Search Results Info */}
          {searchQuery && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
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
                  className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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
              <div className="text-sm text-gray-600">
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
                  className="flex items-center gap-2 bg-white/80 hover:bg-gray-50 border-gray-300 rounded-sm"
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
                            : "bg-white/80 hover:bg-gray-50 border-gray-300"
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
                  className="flex items-center gap-2 bg-white/80 hover:bg-gray-50 border-gray-300 rounded-sm"
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
              <div className="w-16 h-16 bg-gray-100 rounded-sm flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No users found
              </h3>
              <p className="text-gray-600 mb-4">
                No users match your search for &quot;{searchQuery}&quot;. Try adjusting
                your search terms.
              </p>
              <Button
                variant="outline"
                onClick={() => setSearchQuery("")}
                className="bg-white/80 hover:bg-gray-50 border-gray-300 rounded-sm"
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
                governance_area_id: editingUser.governance_area_id || undefined,
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
