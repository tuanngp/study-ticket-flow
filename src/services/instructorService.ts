// services/instructorService.ts
import { supabase } from '@/integrations/supabase/client';

export interface Instructor {
    id: string;
    email: string;
    fullName: string;
    role: 'instructor' | 'admin';
    avatarUrl?: string;
    expertiseAreas?: string[];
    isAvailable?: boolean;
}

export class InstructorService {
    /**
     * Get all available instructors
     */
    static async getAvailableInstructors(): Promise<Instructor[]> {
        try {
            console.log('Fetching instructors...');
            const { data, error } = await supabase
                .from('profiles')
                .select('id, email, full_name, role, avatar_url')
                .in('role', ['instructor'])
                .order('full_name');

            if (error) {
                console.error('Database error:', error);
                throw new Error(error.message);
            }

            const instructors = (data || []).map(instructor => ({
                id: instructor.id,
                email: instructor.email,
                fullName: instructor.full_name || instructor.email.split('@')[0],
                role: instructor.role as 'instructor' | 'admin',
                avatarUrl: instructor.avatar_url,
            }));

            return instructors;
        } catch (error: any) {
            console.error('Error fetching instructors:', error);
            throw new Error('Không thể lấy danh sách giảng viên');
        }
    }

    /**
     * Get instructors by course code (if you have course-instructor mapping)
     */
    static async getInstructorsByCourse(courseCode: string): Promise<Instructor[]> {
        try {
            return await this.getAvailableInstructors();
        } catch (error: any) {
            console.error('Error fetching instructors by course:', error);
            throw new Error('Không thể lấy giảng viên theo môn học');
        }
    }

    /**
     * Get instructor by ID
     */
    static async getInstructorById(instructorId: string): Promise<Instructor | null> {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, email, full_name, role, avatar_url')
                .eq('id', instructorId)
                .in('role', ['instructor', 'admin'])
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw new Error(error.message);
            }

            return {
                id: data.id,
                email: data.email,
                fullName: data.full_name || data.email.split('@')[0],
                role: data.role as 'instructor' | 'admin',
                avatarUrl: data.avatar_url,
                expertiseAreas: [], // Default empty array since column doesn't exist
                isAvailable: true, // Default to true since column doesn't exist
            };
        } catch (error: any) {
            console.error('Error fetching instructor:', error);
            throw new Error('Không thể lấy thông tin giảng viên');
        }
    }
}
