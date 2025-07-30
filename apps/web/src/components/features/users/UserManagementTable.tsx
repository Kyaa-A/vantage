import type { User } from '@vantage/shared/src/generated/schemas/users';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Building, Users } from 'lucide-react';
import { useBarangays } from '@/hooks/useBarangays';
import { useGovernanceAreas } from '@/hooks/useGovernanceAreas';
import type { Barangay, GovernanceArea } from '@vantage/shared';

interface UserManagementTableProps {
  users: User[];
  onEditUser?: (user: User) => void;
}

export default function UserManagementTable({ users, onEditUser }: UserManagementTableProps) {
  // Fetch barangays and governance areas data
  const { data: barangaysData } = useBarangays();
  const { data: governanceAreasData } = useGovernanceAreas();
  
  // Type assertions and create lookup maps
  const barangays = barangaysData as Barangay[] | undefined;
  const governanceAreas = governanceAreasData as GovernanceArea[] | undefined;
  
  const barangayMap = new Map(barangays?.map(b => [b.id, b.name]) || []);
  const governanceAreaMap = new Map(governanceAreas?.map(g => [g.id, g.name]) || []);

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <div 
          key={user.id}
          className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-sm p-6 hover:border-gray-300/80 hover:shadow-md transition-all duration-200"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* User Info */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-sm flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-600">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 flex-wrap">
                <Badge 
                  variant="outline"
                  className={`px-3 py-1 rounded-sm font-medium ${
                    user.role === 'SUPERADMIN' ? 'bg-red-100 text-red-800 border-red-200' :
                    user.role === 'MLGOO_DILG' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                    user.role === 'AREA_ASSESSOR' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                    'bg-blue-100 text-blue-800 border-blue-200'
                  }`}
                >
                  {user.role}
                </Badge>
                
                <Badge 
                  variant="outline"
                  className={`px-3 py-1 rounded-sm font-medium ${
                    user.is_active 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}
                >
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
                
                {user.role === 'BLGU_USER' && user.barangay_id && (
                  <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-sm">
                    <Building className="h-3 w-3 text-gray-600" />
                    <span className="text-xs font-medium text-gray-700">
                      {barangayMap.get(user.barangay_id) || `Barangay #${user.barangay_id}`}
                    </span>
                  </div>
                )}
                
                {user.role === 'AREA_ASSESSOR' && user.governance_area_id && (
                  <div className="flex items-center gap-2 bg-purple-100 px-3 py-1 rounded-sm">
                    <span className="text-xs font-medium text-purple-700">
                      {governanceAreaMap.get(user.governance_area_id) || `Area #${user.governance_area_id}`}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Additional Info */}
              <div className="flex items-center gap-4 text-xs text-gray-600">
                {user.phone_number && (
                  <span>📞 {user.phone_number}</span>
                )}
                {user.is_superuser && (
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded-sm font-medium">
                    🔐 Superuser
                  </span>
                )}
                {user.must_change_password && (
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-sm font-medium">
                    🔄 Must Change Password
                  </span>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditUser?.(user)}
                className="bg-white/80 hover:bg-blue-50 border-blue-200 text-blue-700 hover:text-blue-800 rounded-sm font-medium transition-colors duration-200"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit User
              </Button>
            </div>
          </div>
        </div>
      ))}
      
      {users.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-sm flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600">Get started by adding your first user account.</p>
        </div>
      )}
    </div>
  );
} 