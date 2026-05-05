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
  isSubmitting = signal<boolean>(false);
  isResultsVisible = signal<boolean>(false); // Default to closed, especially for mobile
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

  async completeSurvey() {
    if (this.hasAnswers() || this.isSubmitting()) return;
    
    this.isSubmitting.set(true);
    const currentQuestions = this.questions();
    const selections = this.selectedOptions();
    
    // We update each question that has at least one selection
    for (let i = 0; i < currentQuestions.length; i++) {
      const question = currentQuestions[i];
      const selectedLabels = selections[i] || [];
      
      if (selectedLabels.length === 0) continue;

      // Increment total participants/votes for this question
      const newTotalVotes = (question.total_votes || 0) + 1;
      
      // Update each option's vote count and percentage
      const newOptions = question.options.map((opt: any) => {
        const isSelected = selectedLabels.includes(opt.label);
        const currentVotes = opt.votes || 0;
        const newVotes = isSelected ? currentVotes + 1 : currentVotes;
        
        return {
          ...opt,
          votes: newVotes,
          percentage: Math.round((newVotes / newTotalVotes) * 100)
        };
      });

      try {
        await this.supabaseService.updateQuestion(question.id, {
          options: newOptions,
          total_votes: newTotalVotes
        });
        
        // Update local state
        question.options = newOptions;
        question.total_votes = newTotalVotes;
      } catch (error) {
        console.error(`Error updating question ${question.id}:`, error);
      }
    }

    this.hasAnswers.set(true);
    this.isSubmitting.set(false);
    this.questions.set([...currentQuestions]);
  }

  getAlphabetLetter(index: number): string {
    return String.fromCharCode(65 + index) + '.';
  }

  stripLetterPrefix(label: string): string {
    if (!label) return '';
    return label.replace(/^[A-Z]\.\s*/, '');
  }
}
