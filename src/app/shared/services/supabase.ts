import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  get client() {
    return this.supabase;
  }

  async getSurveys() {
    const { data, error } = await this.supabase
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getSurveyById(id: string) {
    const { data, error } = await this.supabase
      .from('surveys')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async getQuestions(surveyId: string) {
    const { data, error } = await this.supabase
      .from('questions')
      .select('*')
      .eq('survey_id', surveyId)
      .order('id', { ascending: true });

    if (error) throw error;
    return data;
  }

  async createSurvey(survey: any, questions: any[]) {
    // 1. Insert survey
    const { data: newSurvey, error: surveyError } = await this.supabase
      .from('surveys')
      .insert([survey])
      .select()
      .single();

    if (surveyError) throw surveyError;

    // 2. Insert questions with the new survey ID
    const questionsWithSurveyId = questions.map(q => ({
      ...q,
      survey_id: newSurvey.id
    }));

    const { error: questionsError } = await this.supabase
      .from('questions')
      .insert(questionsWithSurveyId);

    if (questionsError) throw questionsError;

    return newSurvey;
  }

  async updateQuestion(id: string, updates: any) {
    const { data, error } = await this.supabase
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
