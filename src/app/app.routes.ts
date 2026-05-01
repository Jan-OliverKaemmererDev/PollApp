import { Routes } from '@angular/router';
import { LandingPage } from './pages/landing-page/landing-page';
import { SurveyDetail } from './pages/survey-detail/survey-detail';

export const routes: Routes = [
  { path: '', component: LandingPage },
  { path: 'survey/:id', component: SurveyDetail },
  { path: '**', redirectTo: '' }
];
