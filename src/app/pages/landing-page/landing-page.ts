import { Component } from '@angular/core';

@Component({
  selector: 'app-landing-page',
  imports: [],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
})
export class LandingPage {
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

  surveys = [
    { title: 'Let’s Plan the Next Team Event Together', category: 'Team activities', endsIn: '1 Day' },
    { title: 'Gaming habits and favorite games!', category: 'Gaming', endsIn: '3 Days' },
    { title: 'Healthier future: Fit & wellness survey!', category: 'Healthy Lifestyle', endsIn: '2 Days' },
    { title: 'Quarterly Feedback Loop', category: 'Team activities', endsIn: '5 Days' },
    { title: 'New Tech Stack Workshop', category: 'Education & Learning', endsIn: '7 Days' },
    { title: 'Coffee vs Tea: The Office Debate', category: 'Lifestyle & Preferences', endsIn: '1 Day' },
    { title: 'Best Console of 2026', category: 'Gaming & Entertainment', endsIn: '4 Days' },
    { title: 'Remote Work Ergonomics', category: 'Health & Wellness', endsIn: '10 Days' },
    { title: 'Summer Party Ideas', category: 'Team activities', endsIn: '2 Days' },
    { title: 'Learning Path Survey', category: 'Education & Learning', endsIn: '6 Days' }
  ];

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.isDropdownOpen = false;
  }
}
