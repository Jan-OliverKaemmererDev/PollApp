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
  hasAnswers = signal<boolean>(false);
  selectedOptions = signal<Record<number, string[]>>({}); // Key: question index or ID, Value: array of selected labels

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      try {
        const surveyData = await this.supabaseService.getSurveyById(id);
        this.survey.set(surveyData);
        
        const questionData = await this.supabaseService.getQuestions(id);
        this.questions.set(questionData || []);
      } catch (error) {
        console.error('Error loading survey:', error);
      }
    }
  }

  toggleOption(questionIndex: number, optionLabel: string) {
    if (this.hasAnswers()) return;

    const question = this.questions()[questionIndex];
    const sub = question.subtitle?.toLowerCase() || '';
    const isMultiple = sub.includes('multiple') || sub.includes('more than one');
    
    const current = { ...this.selectedOptions() };
    let selected = current[questionIndex] || [];

    if (isMultiple) {
      if (selected.includes(optionLabel)) {
        selected = selected.filter(l => l !== optionLabel);
      } else {
        selected = [...selected, optionLabel];
      }
    } else {
      // Single choice logic
      selected = [optionLabel];
    }

    current[questionIndex] = selected;
    this.selectedOptions.set(current);
  }

  isOptionSelected(questionIndex: number, optionLabel: string): boolean {
    return (this.selectedOptions()[questionIndex] || []).includes(optionLabel);
  }

  completeSurvey() {
    this.hasAnswers.set(true);
  }
}
