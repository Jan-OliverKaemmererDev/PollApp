import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FirebaseService } from '../../shared/services/firebase';

@Component({
  selector: 'app-survey-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './survey-detail.html',
  styleUrl: './survey-detail.scss'
})
export class SurveyDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private supabaseService = inject(FirebaseService);

  survey = signal<any>(null);
  questions = signal<any[]>([]);
  hasAnswers = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isResultsVisible = signal<boolean>(true);
  selectedOptions = signal<Record<number, string[]>>({});

  /**
   * Computed signal that checks if any question has received answers.
   */
  hasAnyAnswers = computed(() => {
    return this.questions().some(q => (q.total_votes || 0) > 0);
  });

  /**
   * Formats the end date string for display.
   * @param dateStr The raw date string from the database.
   * @returns Formatted date string starting with 'Ends on'.
   */
  getFormattedDate(dateStr: string): string {
    if (!dateStr) return '';
    let normalized = dateStr.trim();
    let lower = normalized.toLowerCase();
    if (lower.startsWith('ends on ')) {
      normalized = normalized.substring(8).trim();
    } else if (lower.startsWith('ends in ')) {
      normalized = normalized.substring(8).trim();
    }
    
    // Check if it's YYYY-MM-DD and convert to DD.MM.YYYY
    const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      normalized = `${isoMatch[3]}.${isoMatch[2]}.${isoMatch[1]}`;
    }
    
    return `Ends on ${normalized}`;
  }

  /**
   * Initializes the component by fetching survey and question data.
   */
  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    try {
      const surveyData = await this.supabaseService.getSurveyById(id);
      this.survey.set(surveyData);
      const questionData = await this.supabaseService.getQuestions(id);
      this.questions.set(questionData || []);
    } catch (error) {
      console.error('Error loading survey:', error);
    }
  }

  /**
   * Toggles the selection of an option for a given question.
   * @param questionIndex The index of the question.
   * @param optionLabel The label of the option toggled.
   */
  toggleOption(questionIndex: number, optionLabel: string) {
    if (this.hasAnswers()) return;
    const isMultiple = this.isQuestionMultipleChoice(questionIndex);
    const current = { ...this.selectedOptions() };
    let selected = current[questionIndex] || [];
    selected = this.updateSelection(selected, optionLabel, isMultiple);
    current[questionIndex] = selected;
    this.selectedOptions.set(current);
  }

  /**
   * Determines if a question allows multiple choices.
   * @param index The question index.
   * @returns True if multiple choices are allowed, false otherwise.
   */
  private isQuestionMultipleChoice(index: number): boolean {
    const subtitle = this.questions()[index].subtitle?.toLowerCase() || '';
    return subtitle.includes('multiple') || subtitle.includes('more than one');
  }

  /**
   * Updates the selected options array based on the choice type.
   * @param selected Current selected options.
   * @param label The new option label.
   * @param isMultiple Whether multiple selections are allowed.
   * @returns The updated array of selected options.
   */
  private updateSelection(selected: string[], label: string, isMultiple: boolean): string[] {
    if (!isMultiple) return [label];
    if (selected.includes(label)) return selected.filter(l => l !== label);
    return [...selected, label];
  }

  /**
   * Checks if a specific option is currently selected.
   * @param questionIndex The index of the question.
   * @param optionLabel The label of the option.
   * @returns True if the option is selected, false otherwise.
   */
  isOptionSelected(questionIndex: number, optionLabel: string): boolean {
    return (this.selectedOptions()[questionIndex] || []).includes(optionLabel);
  }

  /**
   * Submits the survey answers to the backend.
   */
  async completeSurvey() {
    if (this.hasAnswers() || this.isSubmitting()) return;
    this.isSubmitting.set(true);
    const currentQuestions = this.questions();
    const selections = this.selectedOptions();
    for (let i = 0; i < currentQuestions.length; i++) {
      await this.processQuestion(currentQuestions[i], selections[i] || []);
    }
    this.hasAnswers.set(true);
    this.isSubmitting.set(false);
    this.questions.set([...currentQuestions]);
  }

  /**
   * Processes the vote update for a single question.
   * @param question The question to update.
   * @param selectedLabels The labels selected by the user.
   */
  private async processQuestion(question: any, selectedLabels: string[]) {
    if (selectedLabels.length === 0) return;
    const newTotalVotes = (question.total_votes || 0) + 1;
    const newOptions = this.calculateNewOptions(question.options, selectedLabels, newTotalVotes);
    try {
      await this.supabaseService.updateQuestion(question.id, { options: newOptions, total_votes: newTotalVotes });
      question.options = newOptions;
      question.total_votes = newTotalVotes;
    } catch (error) {
      console.error(`Error updating question ${question.id}:`, error);
    }
  }

  /**
   * Calculates new option percentages and votes.
   * @param options The existing options.
   * @param selectedLabels The user selections.
   * @param totalVotes The new total votes count.
   * @returns The updated options array.
   */
  private calculateNewOptions(options: any[], selectedLabels: string[], totalVotes: number): any[] {
    return options.map((opt: any) => {
      const isSelected = selectedLabels.includes(opt.label);
      const newVotes = (opt.votes || 0) + (isSelected ? 1 : 0);
      return {
        ...opt,
        votes: newVotes,
        percentage: Math.round((newVotes / totalVotes) * 100)
      };
    });
  }

  /**
   * Generates a letter prefix for an option index.
   * @param index The zero-based index.
   * @returns A letter followed by a dot (e.g., 'A.').
   */
  getAlphabetLetter(index: number): string {
    return String.fromCharCode(65 + index) + '.';
  }

  /**
   * Removes the letter prefix from an option label.
   * @param label The original option label.
   * @returns The label without the prefix.
   */
  stripLetterPrefix(label: string): string {
    if (!label) return '';
    return label.replace(/^[A-Z]\.\s*/, '');
  }
}
