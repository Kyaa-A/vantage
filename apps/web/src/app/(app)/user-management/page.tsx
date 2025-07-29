'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { UserListSection } from '@/components/features/users';

export default function UserManagementPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  // Redirect non-admin users to their dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const isAdmin = user.role === 'SUPERADMIN' || user.role === 'MLGOO_DILG';
      if (!isAdmin) {
        router.replace('/blgu/dashboard');
      }
    }
  }, [isAuthenticated, user, router]);

  // Show loading if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Show loading if user is not admin
  if (user && user.role !== 'SUPERADMIN' && user.role !== 'MLGOO_DILG') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage user accounts and permissions
          </p>
        </div>
      </div>

      <UserListSection />
    </div>
  );
} 