import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SupabaseService } from '../../shared/services/supabase';

@Component({
  selector: 'app-survey-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './survey-detail.html',
  styleUrl: './survey-detail.scss'
})
export class SurveyDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private supabaseService = inject(SupabaseService);

  survey = signal<any>(null);
  questions = signal<any[]>([]);
  hasAnswers = signal<boolean>(false); // Toggle this to show results

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      try {
        const surveyData = await this.supabaseService.getSurveyById(id);
        this.survey.set(surveyData);
        
        // Fetch real questions if they exist
        const questionData = await this.supabaseService.getQuestions(id);
        this.questions.set(questionData || []);
      } catch (error) {
        console.error('Error loading survey:', error);
      }
    }
  }

  completeSurvey() {
    this.hasAnswers.set(true);
  }
}
