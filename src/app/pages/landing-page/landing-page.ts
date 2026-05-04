import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../shared/services/supabase';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
})
export class LandingPage implements OnInit {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  isDropdownOpen = false;
  selectedCategory = signal<string | null>(null);
  activeFilter = signal<'active' | 'past' | null>(null);
  categories = [
    'Team Activities',
    'Health & Wellness',
    'Gaming & Entertainment',
    'Education & Learning',
    'Lifestyle & Preferences',
    'Technology & Innovation'
  ];

  surveys = signal<any[]>([]);

  // Hilfsfunktion zum Parsen von Daten (unterstützt auch deutsches Format DD.MM.YYYY)
  // Hilfsfunktion zum Parsen von Daten (unterstützt ISO, Deutsch und relative Angaben wie "1 Tag")
  private parseDate(dateStr: string): Date {
    if (!dateStr) return new Date('invalid');
    const now = new Date();
    const normalized = dateStr.toLowerCase().trim();
    
    // 1. Relative Angaben prüfen (z.B. "1 Tag", "2 Days")
    const match = normalized.match(/(\d+)\s*(tag|day|tage|days)/);
    if (match) {
      const amount = parseInt(match[1], 10);
      const d = new Date();
      d.setDate(now.getDate() + amount);
      return d;
    }

    // 2. Fallback für deutsches Format DD.MM.YYYY (Vor Standard-Parsing, da Standard-Parsing DD.MM oft falsch interpretiert)
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parts[2].length === 2 ? 2000 + parseInt(parts[2], 10) : parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }

    // 3. Standard JS-Parsing versuchen (für YYYY-MM-DD oder YYYY/MM/DD)
    const d = new Date(dateStr.replace(/\//g, '-')); // Normalisiere / zu - für bessere Kompatibilität
    return d;
  }

  getEndsInText(dateStr: string): string {
    if (!dateStr) return '';
    const endDate = this.parseDate(dateStr);
    if (isNaN(endDate.getTime())) return dateStr;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Ended';
    if (diffDays === 0) return 'Ends today';
    if (diffDays === 1) return 'Ends in 1 Day';
    return `Ends in ${diffDays} Days`;
  }

  filteredSurveys = computed(() => {
    let list = this.surveys();
    const category = this.selectedCategory();
    const filter = this.activeFilter();
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Heute berücksichtigen

    if (category) {
      list = list.filter(s => s.category?.toLowerCase() === category.toLowerCase());
    }

    if (filter) {
      list = list.filter(s => {
        if (!s.ends_in) return filter === 'active';
        const endDate = this.parseDate(s.ends_in);
        if (isNaN(endDate.getTime())) return filter === 'active';
        
        return filter === 'active' ? endDate >= now : endDate < now;
      });
    }

    return list;
  });

  endingSoonSurveys = computed(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return this.surveys()
      .filter(s => {
        if (!s.ends_in) return false;
        const endDate = this.parseDate(s.ends_in);
        return !isNaN(endDate.getTime()) && endDate >= now;
      })
      .sort((a, b) => this.parseDate(a.ends_in).getTime() - this.parseDate(b.ends_in).getTime())
      .slice(0, 3);
  });

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
    this.selectedCategory.set(category);
    this.isDropdownOpen = false;
  }

  toggleFilter(filter: 'active' | 'past') {
    this.activeFilter.update(current => current === filter ? null : filter);
  }
}
