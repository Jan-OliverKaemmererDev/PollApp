import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://przkbwghllwzmlrxjamw.supabase.co';
const supabaseKey = 'sb_publishable_I0w4S48S2JNKOzntSpV9LA_Kkz7DRwD';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findSurveyId() {
    const { data, error } = await supabase
        .from('surveys')
        .select('id, title')
        .eq('title', 'Let’s Plan the Next Team Event Together')
        .single();

    if (error) {
        console.error('Error finding survey:', error);
    } else {
        console.log('Survey ID:', data.id);
    }
}

findSurveyId();
