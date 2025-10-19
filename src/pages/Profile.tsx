import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SmartAvatar } from '@/components/SmartAvatar';
import { AvatarUpload } from '@/components/AvatarUpload';
import { ProfileService, ProfileData, UpdateProfileData } from '@/services/profileService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  Edit, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  Save,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Profile = () => {
  const { user, profile: authProfile, loading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateProfileData>({});
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient();

  // Fetch profile data
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => ProfileService.getProfile(user!.id),
    enabled: !!user?.id,
  });

  // Update avatar URL when profile changes
  useEffect(() => {
    if (profile?.avatarUrl) {
      setCurrentAvatarUrl(profile.avatarUrl);
    }
  }, [profile?.avatarUrl]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileData) =>
      ProfileService.updateProfile(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success('Profile updated successfully');
      setIsEditing(false);
      setEditingSection(null);
      setFormData({});
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });

  const handleAvatarUpdate = async (newAvatarUrl: string) => {
    try {
      await ProfileService.updateProfile(user!.id, { avatarUrl: newAvatarUrl });
      setCurrentAvatarUrl(newAvatarUrl);
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update avatar');
    }
  };

  const handleEdit = (section: string) => {
    setEditingSection(section);
    setIsEditing(true);
    
    // Pre-populate form with current data
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        career: profile.career || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        country: profile.country || '',
        state: profile.state || '',
        postalCode: profile.postalCode || '',
        taxId: profile.taxId || '',
      });
    }
  };

  const handleSave = () => {
    const validation = ProfileService.validateProfileData(formData);
    if (!validation.isValid) {
      toast.error(validation.errors.join(', '));
      return;
    }

    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingSection(null);
    setFormData({});
  };

  const handleInputChange = (field: keyof UpdateProfileData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (authLoading || isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-32"></div>
          <div className="h-64 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error Loading Profile</h1>
          <p className="text-muted-foreground">Failed to load profile data. Please try again.</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground">No profile data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Profile</h1>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <AvatarUpload
              userId={user!.id}
              currentAvatarUrl={currentAvatarUrl}
              userName={profile.fullName || profile.email || 'User'}
              onAvatarUpdate={handleAvatarUpdate}
            />
            <div>
                <h2 className="text-2xl font-semibold">
                  {profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email}
                </h2>
                <p className="text-muted-foreground capitalize">
                  {profile.career || profile.role} | {profile.country || 'Location not set'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Social Media Icons */}
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Instagram className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                variant="outline"
                onClick={() => handleEdit('header')}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-xl font-semibold">Personal Information</h3>
          <Button
            variant="outline"
            onClick={() => handleEdit('personal')}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          {editingSection === 'personal' && isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName || ''}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName || ''}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio || ''}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about yourself"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={updateProfileMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">First Name</Label>
                <p className="font-medium">{profile.firstName || 'Not provided'}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Last Name</Label>
                <p className="font-medium">{profile.lastName || 'Not provided'}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Email Address</Label>
                <p className="font-medium">{profile.email}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Phone</Label>
                <p className="font-medium">{profile.phone || 'Not provided'}</p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm text-muted-foreground">Bio</Label>
                <p className="font-medium">{profile.bio || 'Not provided'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-xl font-semibold">Address</h3>
          <Button
            variant="outline"
            onClick={() => handleEdit('address')}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          {editingSection === 'address' && isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country || ''}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="Enter country"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">City/State</Label>
                  <Input
                    id="state"
                    value={formData.state || ''}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="Enter city/state"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode || ''}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    placeholder="Enter postal code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">TAX ID</Label>
                  <div className="space-y-2">
                    <Badge variant="secondary" className="text-xs">TAX ID</Badge>
                    <Input
                      id="taxId"
                      value={formData.taxId || ''}
                      onChange={(e) => handleInputChange('taxId', e.target.value)}
                      placeholder="Enter TAX ID"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={updateProfileMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Country</Label>
                <p className="font-medium">{profile.country || 'Not provided'}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">City/State</Label>
                <p className="font-medium">{profile.state || 'Not provided'}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Postal Code</Label>
                <p className="font-medium">{profile.postalCode || 'Not provided'}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">TAX ID</Badge>
                </div>
                <p className="font-medium">{profile.taxId || 'Not provided'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default Profile;
