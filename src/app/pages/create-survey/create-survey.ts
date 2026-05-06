import { ChangeDetectorRef, Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../shared/services/supabase';

@Component({
  selector: 'app-create-survey',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-survey.html',
  styleUrl: './create-survey.scss',
  encapsulation: ViewEncapsulation.None
})
export class CreateSurvey {
  private fb = inject(FormBuilder);
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  surveyForm: FormGroup;
  categories = ['Team activities', 'Work environment', 'Feedback', 'General'];
  isCategoryDropdownOpen = false;
  isPublishing = false;
  showToast = false;

  /**
   * Initializes the CreateSurvey component and sets up the form.
   */
  constructor() {
    this.surveyForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      ends_in: [''],
      category: [''],
      questions: this.fb.array([this.createQuestion()])
    });
  }

  /**
   * Retrieves the questions FormArray.
   * @returns FormArray containing questions.
   */
  get questions() {
    return this.surveyForm.get('questions') as FormArray;
  }

  /**
   * Retrieves the options FormArray for a specific question.
   * @param questionIndex The index of the question.
   * @returns FormArray containing answers.
   */
  getAnswers(questionIndex: number) {
    return this.questions.at(questionIndex).get('options') as FormArray;
  }

  /**
   * Creates a new question FormGroup.
   * @returns A FormGroup for a question.
   */
  createQuestion(): FormGroup {
    return this.fb.group({
      question_text: ['', Validators.required],
      allowMultiple: [false],
      options: this.fb.array([this.createAnswer(), this.createAnswer()])
    });
  }

  /**
   * Creates a new answer FormGroup.
   * @returns A FormGroup for an answer.
   */
  createAnswer(): FormGroup {
    return this.fb.group({
      label: [''],
      percentage: [0],
      votes: [0]
    });
  }

  /**
   * Adds a new question to the survey form.
   */
  addQuestion() {
    this.questions.push(this.createQuestion());
  }

  /**
   * Removes a question or resets if it's the last one.
   * @param index The index to remove.
   */
  removeQuestion(index: number) {
    if (this.questions.length > 1) {
      this.questions.removeAt(index);
    } else {
      this.resetFirstQuestion();
    }
  }

  /**
   * Resets the first question to its initial state.
   */
  private resetFirstQuestion() {
    const firstQ = this.questions.at(0) as FormGroup;
    firstQ.patchValue({ question_text: '', allowMultiple: false });
    const answersArray = firstQ.get('options') as FormArray;
    answersArray.clear();
    answersArray.push(this.createAnswer());
    answersArray.push(this.createAnswer());
  }

  /**
   * Adds a new answer option to a question.
   * @param questionIndex The question index.
   */
  addAnswer(questionIndex: number) {
    this.getAnswers(questionIndex).push(this.createAnswer());
  }

  /**
   * Removes an answer or resets if fewer than 3.
   * @param questionIndex The question index.
   * @param answerIndex The answer index.
   */
  removeAnswer(questionIndex: number, answerIndex: number) {
    const answers = this.getAnswers(questionIndex);
    if (answers.length > 2) {
      answers.removeAt(answerIndex);
    } else {
      answers.at(answerIndex).patchValue({ label: '', percentage: 0 });
    }
  }

  /**
   * Cancels the survey creation and navigates home.
   */
  cancel() {
    this.router.navigate(['/']);
  }

  /**
   * Publishes the survey if the form is valid.
   */
  async publish() {
    if (this.isPublishing || this.surveyForm.invalid) {
      this.surveyForm.markAllAsTouched();
      return;
    }
    this.isPublishing = true;
    const formValue = this.surveyForm.value;
    const ends_in = this.formatEndsIn(formValue.ends_in);
    const newSurvey = this.buildSurveyPayload(formValue, ends_in);
    const newQs = this.buildQuestionsPayload(formValue.questions);
    await this.submitSurvey(newSurvey, newQs);
  }

  /**
   * Formats the survey end date into ISO format.
   * @param ends_in Raw date string.
   * @returns Formatted date string or null.
   */
  private formatEndsIn(ends_in: string): string | null {
    if (!ends_in) return null;
    const trimmed = ends_in.trim();
    const gMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (gMatch) return `${gMatch[3]}-${gMatch[2].padStart(2, '0')}-${gMatch[1].padStart(2, '0')}`;
    const sMatch = trimmed.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (sMatch) return `${sMatch[1]}-${sMatch[2].padStart(2, '0')}-${sMatch[3].padStart(2, '0')}`;
    return ends_in;
  }

  /**
   * Builds the survey payload object.
   * @param formValue The form value.
   * @param ends_in Formatted end date.
   * @returns The survey payload.
   */
  private buildSurveyPayload(formValue: any, ends_in: string | null) {
    return {
      title: formValue.title,
      description: formValue.description,
      category: formValue.category,
      ends_in
    };
  }

  /**
   * Builds the questions payload array.
   * @param questions Raw questions array.
   * @returns Formatted questions payload.
   */
  private buildQuestionsPayload(questions: any[]) {
    return questions.map(q => ({
      question_text: q.question_text,
      subtitle: q.allowMultiple ? 'Allow multiple answers' : null,
      options: q.options,
      total_votes: 0
    }));
  }

  /**
   * Submits the survey to Supabase and handles the UI state.
   * @param newSurvey Survey payload.
   * @param newQs Questions payload.
   */
  private async submitSurvey(newSurvey: any, newQs: any[]) {
    try {
      await this.supabaseService.createSurvey(newSurvey, newQs);
      this.isPublishing = false;
      this.showToast = true;
      this.cdr.detectChanges();
      setTimeout(() => this.closeToast(), 2500);
    } catch (error) {
      this.isPublishing = false;
    }
  }

  /**
   * Generates a letter prefix for an option index.
   * @param index The zero-based index.
   * @returns A letter followed by a dot.
   */
  getAlphabetLetter(index: number): string {
    return String.fromCharCode(65 + index) + '.';
  }

  /**
   * Toggles the category selection dropdown.
   */
  toggleCategoryDropdown() {
    this.isCategoryDropdownOpen = !this.isCategoryDropdownOpen;
  }

  /**
   * Selects a category and closes the dropdown.
   * @param category The selected category.
   */
  selectCategory(category: string) {
    this.surveyForm.patchValue({ category });
    this.isCategoryDropdownOpen = false;
  }

  /**
   * Clears the value of a specific form control.
   * @param controlName The name of the control.
   */
  clearField(controlName: string) {
    this.surveyForm.get(controlName)?.setValue('');
  }

  /**
   * Closes the success toast and navigates home.
   */
  closeToast() {
    this.showToast = false;
    this.router.navigate(['/']);
  }
}
