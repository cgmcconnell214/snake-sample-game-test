import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trash2, UserPlus, Shield } from 'lucide-react';

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  assigned_at: string;
  assigned_by: string | null;
  profiles?: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

export function RoleManagement() {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('user');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserRoles();
  }, []);

  const fetchUserRoles = async () => {
    try {
      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('assigned_at', { ascending: false });

      if (rolesError) throw rolesError;

      if (rolesData && rolesData.length > 0) {
        // Get user IDs
        const userIds = rolesData.map(role => role.user_id);
        
        // Fetch profile data separately
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, email, first_name, last_name')
          .in('user_id', userIds);

        if (profilesError) {
          console.warn('Could not fetch profiles:', profilesError);
        }

        // Combine the data
        const rolesWithProfiles = rolesData.map(role => ({
          ...role,
          profiles: profilesData?.find(profile => profile.user_id === role.user_id) || null
        }));

        setUserRoles(rolesWithProfiles);
      } else {
        setUserRoles([]);
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user roles",
        variant: "destructive"
      });
    }
  };

  const assignRole = async () => {
    if (!newUserEmail.trim() || !selectedRole) {
      toast({
        title: "Validation Error",
        description: "Please enter an email and select a role",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Use the secure function to assign admin role
      const { data, error } = await supabase
        .rpc('assign_admin_role', { user_email: newUserEmail.trim() });

      if (error) throw error;

      if (data) {
        toast({
          title: "Success",
          description: `Role assigned successfully to ${newUserEmail}`,
        });
        setNewUserEmail('');
        fetchUserRoles();
      } else {
        toast({
          title: "Error",
          description: "User not found or role assignment failed",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: "Error",
        description: "Failed to assign role",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role removed successfully",
      });
      fetchUserRoles();
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: "Error",
        description: "Failed to remove role",
        variant: "destructive"
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'compliance_officer':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Management
          </CardTitle>
          <CardDescription>
            Manage user roles and permissions. Only admins can assign compliance officers and other admin roles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Enter user email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="flex-1"
            />
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="compliance_officer">Compliance Officer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={assignRole} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Assign Role
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current User Roles</CardTitle>
          <CardDescription>
            View and manage existing user role assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {userRoles.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No roles assigned yet
              </p>
            ) : (
              userRoles.map((userRole) => (
                <div
                  key={userRole.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">
                        {userRole.profiles?.email || 'Unknown User'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {userRole.profiles?.first_name} {userRole.profiles?.last_name}
                      </p>
                    </div>
                    <Badge className={getRoleBadgeColor(userRole.role)}>
                      {userRole.role.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(userRole.assigned_at).toLocaleDateString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRole(userRole.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">Security Notice</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-yellow-700 space-y-2">
            <p><strong>KYC Data Access:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Users can only access their own KYC verification data</li>
              <li>Compliance Officers can access any user's KYC data for regulatory purposes</li>
              <li>Admins have full access to all KYC data and can manage roles</li>
              <li>All KYC data access is logged for audit purposes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}