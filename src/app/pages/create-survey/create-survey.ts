import { Component, inject, ViewEncapsulation } from '@angular/core';
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

  surveyForm: FormGroup;
  categories = ['Team activities', 'Work environment', 'Feedback', 'General'];
  showToast = false;
  isCategoryDropdownOpen = false;
  isPublishing = false;

  constructor() {
    this.surveyForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      ends_in: [''],
      category: [''],
      questions: this.fb.array([this.createQuestion()])
    });
  }

  get questions() {
    return this.surveyForm.get('questions') as FormArray;
  }

  getAnswers(questionIndex: number) {
    return this.questions.at(questionIndex).get('options') as FormArray;
  }

  createQuestion(): FormGroup {
    return this.fb.group({
      question_text: ['', Validators.required],
      allowMultiple: [false],
      options: this.fb.array([
        this.createAnswer(),
        this.createAnswer()
      ])
    });
  }

  createAnswer(): FormGroup {
    return this.fb.group({
      label: [''],
      percentage: [0]
    });
  }

  addQuestion() {
    this.questions.push(this.createQuestion());
  }

  removeQuestion(index: number) {
    if (this.questions.length > 1) {
      this.questions.removeAt(index);
    } else {
      // If it's the only question, clear its content
      const firstQ = this.questions.at(0) as FormGroup;
      firstQ.patchValue({ question_text: '', allowMultiple: false });
      // Reset answers to 2 empty answers
      const answersArray = firstQ.get('options') as FormArray;
      answersArray.clear();
      answersArray.push(this.createAnswer());
      answersArray.push(this.createAnswer());
    }
  }

  addAnswer(questionIndex: number) {
    this.getAnswers(questionIndex).push(this.createAnswer());
  }

  removeAnswer(questionIndex: number, answerIndex: number) {
    const answers = this.getAnswers(questionIndex);
    if (answers.length > 2) {
      answers.removeAt(answerIndex);
    } else {
      // Clear the content instead of removing if we only have 2 answers
      answers.at(answerIndex).patchValue({ label: '', percentage: 0 });
    }
  }

  cancel() {
    this.router.navigate(['/']);
  }

  async publish() {
    if (this.isPublishing) return;

    if (this.surveyForm.invalid) {
      this.surveyForm.markAllAsTouched();
      return;
    }

    this.isPublishing = true;
    const formValue = this.surveyForm.value;

    const newSurvey = {
      title: formValue.title,
      category: formValue.category,
      ends_in: formValue.ends_in || null
    };

    const newQuestions = formValue.questions.map((q: any) => ({
      question_text: q.question_text,
      subtitle: q.allowMultiple ? 'Allow multiple answers.' : null,
      options: q.options
    }));

    try {
      await this.supabaseService.createSurvey(newSurvey, newQuestions);
      this.showToast = true;
      setTimeout(() => {
        this.showToast = false;
        this.isPublishing = false;
        this.router.navigate(['/']);
      }, 2000);
    } catch (error) {
      console.error('Error publishing survey:', error);
      this.isPublishing = false;
    }
  }

  getAlphabetLetter(index: number): string {
    return String.fromCharCode(65 + index) + '.';
  }

  toggleCategoryDropdown() {
    this.isCategoryDropdownOpen = !this.isCategoryDropdownOpen;
  }

  selectCategory(category: string) {
    this.surveyForm.patchValue({ category });
    this.isCategoryDropdownOpen = false;
  }

  clearField(controlName: string) {
    this.surveyForm.get(controlName)?.setValue('');
  }
}
