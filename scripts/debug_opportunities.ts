
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Supabase environment variables missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Fetching one course with details...');

  // 1. Get a course ID
  const { data: courses, error: courseError } = await supabase
    .from('courses')
    .select('id, course_name')
    .limit(1);

  if (courseError) {
    console.error('Error fetching courses:', courseError);
    return;
  }

  if (!courses || courses.length === 0) {
    console.log('No courses found.');
    return;
  }

  const courseId = courses[0].id;
  console.log(`Analyzing Course: ${courses[0].course_name} (${courseId})`);

  // 2. Run the detailed query
  const { data, error } = await supabase
    .from('courses')
    .select(`
      course_code,
      course_name,
      vacancies,
      opportunities (
        id,
        semester,
        shift,
        scholarship_type,
        cutoff_score,
        opportunity_type
      ),
      campus:campus_id (
        name,
        city,
        state,
        region,
        institutions:institution_id (
          id,
          name,
          external_code,
          institutionsinfoemec (
            phone,
            site,
            email,
            academic_organization,
            credentialing_type,
            administrative_category,
            creation_date,
            ci,
            ci_ead,
            igc
          ),
          institutionsinfosisu (
            acronym,
            academic_organization,
            administrative_category
          )
        )
      )
    `)
    .eq('id', courseId)
    .single();

  if (error) {
    console.error('Error fetching course details:', error);
  } else {
    console.log('--- Full Data Structure ---');
    console.log(JSON.stringify(data, null, 2));
    
    const campus = data.campus as any;
    const inst = campus?.institutions;
    const emec = inst?.institutionsinfoemec;
    const sisu = inst?.institutionsinfosisu;

    console.log('--- Summary ---');
    console.log('Institution Name:', inst?.name);
    console.log('External Code:', inst?.external_code);
    console.log('EMEC Data (Array?):', Array.isArray(emec) ? `Yes (len ${emec.length})` : 'No');
    console.log('SISU Data (Array?):', Array.isArray(sisu) ? `Yes (len ${sisu.length})` : 'No');
    console.log('First EMEC Item:', emec?.[0]);
  }
}

run();
