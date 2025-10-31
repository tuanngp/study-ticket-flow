import { AvatarUpload } from '@/components/AvatarUpload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { ProfileService, UpdateProfileData } from '@/services/profileService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Edit,
  Save,
  Twitter,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const Profile = () => {
  const { user, profile: authProfile, loading: authLoading, refreshAuth } = useAuth();
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
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      // Refresh auth context to update profile in sidebar
      await refreshAuth();
      toast.success('Cập nhật hồ sơ thành công');
      setIsEditing(false);
      setEditingSection(null);
      setFormData({});
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể cập nhật hồ sơ');
    },
  });

  const handleAvatarUpdate = async (newAvatarUrl: string) => {
    try {
      await ProfileService.updateProfile(user!.id, { avatarUrl: newAvatarUrl });
      setCurrentAvatarUrl(newAvatarUrl);
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      
      // Refresh auth context to update profile in sidebar
      await refreshAuth();
    } catch (error: any) {
      toast.error(error.message || 'Không thể cập nhật ảnh đại diện');
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
          <h1 className="text-2xl font-bold text-destructive mb-4">Lỗi Tải Hồ Sơ</h1>
          <p className="text-muted-foreground">Không thể tải dữ liệu hồ sơ. Vui lòng thử lại.</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Không Tìm Thấy Hồ Sơ</h1>
          <p className="text-muted-foreground">Không có dữ liệu hồ sơ.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Hồ Sơ</h1>

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
                  {profile.career || profile.role} | {profile.country || 'Chưa đặt vị trí'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Social Media Icons */}
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </Button>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </Button>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={() => handleEdit('header')}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Chỉnh sửa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-xl font-semibold">Thông Tin Cá Nhân</h3>
          <Button
            variant="outline"
            onClick={() => handleEdit('personal')}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Chỉnh sửa
          </Button>
        </CardHeader>
        <CardContent>
          {editingSection === 'personal' && isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Tên</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName || ''}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Nhập tên"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Họ</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName || ''}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Nhập họ"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio">Tiểu sử</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio || ''}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Hãy kể về bản thân bạn"
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
                <Label className="text-sm text-muted-foreground">Tên</Label>
                <p className="font-medium">{profile.firstName || 'Chưa cung cấp'}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Họ</Label>
                <p className="font-medium">{profile.lastName || 'Chưa cung cấp'}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Địa chỉ Email</Label>
                <p className="font-medium">{profile.email}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Số điện thoại</Label>
                <p className="font-medium">{profile.phone || 'Chưa cung cấp'}</p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm text-muted-foreground">Tiểu sử</Label>
                <p className="font-medium">{profile.bio || 'Chưa cung cấp'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-xl font-semibold">Địa Chỉ</h3>
          <Button
            variant="outline"
            onClick={() => handleEdit('address')}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Chỉnh sửa
          </Button>
        </CardHeader>
        <CardContent>
          {editingSection === 'address' && isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Quốc gia</Label>
                  <Input
                    id="country"
                    value={formData.country || ''}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="Nhập quốc gia"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Thành phố/Tỉnh</Label>
                  <Input
                    id="state"
                    value={formData.state || ''}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="Nhập thành phố/tỉnh"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Mã bưu điện</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode || ''}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    placeholder="Nhập mã bưu điện"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">Mã số thuế</Label>
                  <div className="space-y-2">
                    <Badge variant="secondary" className="text-xs">Mã số thuế</Badge>
                    <Input
                      id="taxId"
                      value={formData.taxId || ''}
                      onChange={(e) => handleInputChange('taxId', e.target.value)}
                      placeholder="Nhập mã số thuế"
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
                <Label className="text-sm text-muted-foreground">Quốc gia</Label>
                <p className="font-medium">{profile.country || 'Chưa cung cấp'}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Thành phố/Tỉnh</Label>
                <p className="font-medium">{profile.state || 'Chưa cung cấp'}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Mã bưu điện</Label>
                <p className="font-medium">{profile.postalCode || 'Chưa cung cấp'}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">Mã số thuế</Badge>
                </div>
                <p className="font-medium">{profile.taxId || 'Chưa cung cấp'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default Profile;
