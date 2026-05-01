import { Component, inject, OnInit, signal } from '@angular/core';
import { SupabaseService } from '../../shared/services/supabase';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
})
export class LandingPage implements OnInit {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  isDropdownOpen = false;
  selectedCategory: string | null = null;
  categories = [
    'Team Activities',
    'Health & Wellness',
    'Gaming & Entertainment',
    'Education & Learning',
    'Lifestyle & Preferences',
    'Technology & Innovation'
  ];

  surveys = signal<any[]>([]);

  async ngOnInit() {
    try {
      const data = await this.supabaseService.getSurveys();
      this.surveys.set(data || []);
    } catch (error) {
      console.error('Error fetching surveys:', error);
    }
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.isDropdownOpen = false;
  }
}
