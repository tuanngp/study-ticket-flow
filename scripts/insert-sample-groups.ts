import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertSampleGroups() {
  try {
    console.log('Inserting sample groups...');

    // First, get a user ID to use as creator
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (userError || !users?.length) {
      console.error('No users found:', userError);
      return;
    }

    const userId = users[0].id;
    console.log('Using user ID:', userId);

    // Insert sample groups
    const sampleGroups = [
      {
        name: 'PRJ301 Study Group',
        description: 'Java Web Development study group for PRJ301 course',
        course_code: 'PRJ301',
        class_name: 'SE1730',
        semester: '2025A',
        max_members: 50,
        is_public: true,
        allow_self_join: true,
        status: 'active',
        created_by: userId,
        instructor_id: userId,
      },
      {
        name: 'SWP391 Project Team',
        description: 'Software Engineering Project team collaboration',
        course_code: 'SWP391',
        class_name: 'SE1730',
        semester: '2025A',
        max_members: 30,
        is_public: true,
        allow_self_join: false,
        status: 'active',
        created_by: userId,
        instructor_id: userId,
      },
      {
        name: 'Math Study Circle',
        description: 'Mathematics study group for MAS291',
        course_code: 'MAS291',
        class_name: 'SE1730',
        semester: '2025A',
        max_members: 25,
        is_public: true,
        allow_self_join: true,
        status: 'active',
        created_by: userId,
        instructor_id: null,
      }
    ];

    const { data: groups, error: groupError } = await supabase
      .from('groups')
      .insert(sampleGroups)
      .select();

    if (groupError) {
      console.error('Error inserting groups:', groupError);
      return;
    }

    console.log('Inserted groups:', groups);

    // Add creator as member of each group
    for (const group of groups) {
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: userId,
          role: group.instructor_id ? 'group_leader' : 'instructor',
          status: 'active',
          joined_at: new Date().toISOString(),
        });

      if (memberError) {
        console.error('Error adding member:', memberError);
      }
    }

    console.log('Sample groups inserted successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

insertSampleGroups();
