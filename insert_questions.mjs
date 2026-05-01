import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://przkbwghllwzmlrxjamw.supabase.co';
const supabaseKey = 'sb_publishable_I0w4S48S2JNKOzntSpV9LA_Kkz7DRwD';

const supabase = createClient(supabaseUrl, supabaseKey);

const surveyId = 2; // From previous step

const questions = [
  {
    survey_id: surveyId,
    question_text: 'Which date would work best for you?',
    subtitle: 'More than one answers are possible.',
    options: [
      { label: 'A. 19.09.2025, Friday', percentage: 27 },
      { label: 'B. 10.10.2025, Friday', percentage: 44 },
      { label: 'C. 11.10.2025, Saturday', percentage: 3 },
      { label: 'D. 31.10.2025, Friday', percentage: 26 }
    ]
  },
  {
    survey_id: surveyId,
    question_text: 'Choose the activities you prefer',
    subtitle: 'More than one answers are possible.',
    options: [
      { label: 'A. Outdoor adventure like kayaking', percentage: 60 },
      { label: 'B. Office Costume Party', percentage: 0 },
      { label: 'C. Bowling, mini-golf, volleyball', percentage: 14 },
      { label: 'D. Beach party, Music & cocktails', percentage: 26 },
      { label: 'E. Escape room', percentage: 0 }
    ]
  },
  {
    survey_id: surveyId,
    question_text: 'What\'s most important to you in a team event?',
    subtitle: null,
    options: [
      { label: 'A. Team bonding', percentage: 44 },
      { label: 'B. Food and drinks', percentage: 3 },
      { label: 'C. Trying something new', percentage: 26 },
      { label: 'D. Keeping it low-key and stress-free', percentage: 27 }
    ]
  },
  {
    survey_id: surveyId,
    question_text: 'How long would you prefer the event to last?',
    subtitle: null,
    options: [
      { label: 'A. Half a day', percentage: 14 },
      { label: 'B. Full day', percentage: 86 },
      { label: 'C. Evening only', percentage: 0 }
    ]
  }
];

async function insertQuestions() {
  console.log('Inserting questions...');
  const { data, error } = await supabase
    .from('questions')
    .insert(questions);

  if (error) {
    console.error('Error inserting questions:', error);
  } else {
    console.log('Questions inserted successfully!');
  }
}

insertQuestions();
