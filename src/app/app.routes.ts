import { Routes } from '@angular/router';
import { LandingPage } from './pages/landing-page/landing-page';
import { SurveyDetail } from './pages/survey-detail/survey-detail';
import { CreateSurvey } from './pages/create-survey/create-survey';

export const routes: Routes = [
  { path: '', component: LandingPage },
  { path: 'survey/:id', component: SurveyDetail },
  { path: 'create-survey', component: CreateSurvey },
  { path: '**', redirectTo: '' }
];
