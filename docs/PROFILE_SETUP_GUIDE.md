# Profile Management Setup Guide

## Overview
This guide will help you set up the profile management functionality for the Study Ticket Flow application.

## Prerequisites
- Supabase project configured
- Database migrations applied
- Storage bucket setup

## Setup Steps

### 1. Database Setup
The profile table is already defined in the schema. If you haven't run migrations yet:

```bash
npm run db:generate
npm run db:push
```

### 2. Storage Setup
Create the avatars storage bucket in Supabase:

1. Go to your Supabase Dashboard
2. Navigate to Storage
3. Create a new bucket named `avatars`
4. Set it as public
5. Run the SQL script in `scripts/setup-avatar-storage.sql` to set up policies

Or run the SQL script directly in the SQL Editor:

```sql
-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow authenticated users to update their own avatars
CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow public read access to avatars
CREATE POLICY "Public can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Create policy to allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. Features Included

#### Profile Page (`/profile`)
- View and edit personal information
- Upload and manage avatar
- Edit address information
- Real-time updates with React Query

#### Profile Fields
- **Personal Information**: First Name, Last Name, Phone, Bio
- **Address**: Country, State, Postal Code, TAX ID
- **Avatar**: Image upload with preview

#### Security Features
- Protected routes (authentication required)
- User can only edit their own profile
- Avatar upload restricted to authenticated users
- Input validation and sanitization

### 4. Usage

#### Accessing Profile
1. Navigate to `/profile` (requires authentication)
2. Click "Edit" buttons to modify sections
3. Upload avatar by hovering over avatar and clicking "Upload"

#### API Endpoints
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `POST /api/profile/avatar` - Upload avatar

### 5. Components

#### Profile Components
- `Profile.tsx` - Main profile page
- `ProfileLayout.tsx` - Layout with sidebar
- `AvatarUpload.tsx` - Avatar upload component
- `ProtectedRoute.tsx` - Route protection

#### Services
- `ProfileService.ts` - Profile CRUD operations
- `AuthService.ts` - Authentication management

### 6. Styling
The profile page uses shadcn/ui components with Tailwind CSS:
- Cards for sections
- Form components for editing
- Responsive design
- Dark/light theme support

### 7. Testing
To test the profile functionality:

1. Sign up or sign in to the application
2. Navigate to `/profile`
3. Try editing different sections
4. Upload an avatar image
5. Verify changes are saved

### 8. Troubleshooting

#### Common Issues
- **Avatar not uploading**: Check storage bucket policies
- **Profile not loading**: Verify database connection
- **Edit not working**: Check authentication status

#### Debug Steps
1. Check browser console for errors
2. Verify Supabase connection
3. Check network requests in DevTools
4. Verify storage bucket permissions

## File Structure
```
src/
├── components/
│   ├── AvatarUpload.tsx
│   ├── ProfileLayout.tsx
│   └── ProtectedRoute.tsx
├── pages/
│   └── Profile.tsx
├── services/
│   └── profileService.ts
├── hooks/
│   └── useAuth.ts
└── db/
    └── schema.ts (profiles table)
```
