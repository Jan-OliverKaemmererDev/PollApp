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
  activeFilter = signal<'active' | 'past'>('active');
  categories = [
    'Team Activities',
    'Health & Wellness',
    'Gaming & Entertainment',
    'Education & Learning',
    'Lifestyle & Preferences',
    'Technology & Innovation'
  ];

  surveys = signal<any[]>([]);

  /**
   * Parses a given date string into a Date object.
   * @param dateStr The date string to parse.
   * @returns A parsed Date object or an invalid Date.
   */
  private parseDate(dateStr: string): Date {
    if (!dateStr) return new Date('invalid');
    let normalized = dateStr.toLowerCase().trim();
    if (normalized.startsWith('ends on ')) {
      normalized = normalized.substring(8).trim();
    } else if (normalized.startsWith('ends in ')) {
      normalized = normalized.substring(8).trim();
    }
    const relativeDate = this.parseRelativeDate(normalized);
    if (relativeDate) return relativeDate;
    const germanDate = this.parseGermanDate(normalized);
    if (germanDate) return germanDate;
    return new Date(normalized.replace(/\//g, '-'));
  }

  /**
   * Parses a relative date string.
   * @param normalized The normalized date string.
   * @returns A Date object if successfully parsed, null otherwise.
   */
  private parseRelativeDate(normalized: string): Date | null {
    const match = normalized.match(/(\d+)\s*(tag|day|tage|days)/);
    if (!match) return null;
    const amount = parseInt(match[1], 10);
    const d = new Date();
    d.setDate(d.getDate() + amount);
    return d;
  }

  /**
   * Parses a date string in German format.
   * @param dateStr The date string.
   * @returns A Date object if successfully parsed, null otherwise.
   */
  private parseGermanDate(dateStr: string): Date | null {
    const parts = dateStr.split('.');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    if (parts[2].length === 2) year += 2000;
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  /**
   * Gets a human-readable text for the remaining time.
   * @param dateStr The date string.
   * @returns A formatted string representing the remaining time.
   */
  getEndsInText(dateStr: string): string {
    if (!dateStr) return '';
    const endDate = this.parseDate(dateStr);
    if (isNaN(endDate.getTime())) return dateStr;
    const diffDays = this.calculateDiffDays(endDate);
    return this.formatDiffDaysText(diffDays);
  }

  /**
   * Calculates the difference in days between a date and today.
   * @param endDate The end date to compare against today.
   * @returns The difference in days as an integer.
   */
  private calculateDiffDays(endDate: Date): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    return Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Formats the difference in days into a human-readable string.
   * @param diffDays The difference in days.
   * @returns A formatted string representing the remaining time.
   */
  private formatDiffDaysText(diffDays: number): string {
    if (diffDays < 0) return 'Ended';
    if (diffDays === 0) return 'Ends today';
    if (diffDays === 1) return 'Ends in 1 Day';
    return `Ends in ${diffDays} Days`;
  }

  /**
   * Computed signal that returns the filtered list of surveys.
   */
  filteredSurveys = computed(() => {
    let list = this.filterByCategory(this.surveys(), this.selectedCategory());
    return this.filterByStatus(list, this.activeFilter());
  });

  /**
   * Filters a list of surveys by category.
   * @param list The list of surveys to filter.
   * @param category The category to filter by.
   * @returns The filtered list of surveys.
   */
  private filterByCategory(list: any[], category: string | null): any[] {
    if (!category) return list;
    return list.filter(s => s.category?.toLowerCase() === category.toLowerCase());
  }

  /**
   * Filters a list of surveys by active/past status.
   * @param list The list of surveys.
   * @param filter The active or past filter.
   * @returns The filtered list of surveys.
   */
  private filterByStatus(list: any[], filter: 'active' | 'past'): any[] {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return list.filter(s => this.matchesStatusFilter(s, filter, now));
  }

  /**
   * Checks if a survey matches the specified status filter.
   * @param s The survey object.
   * @param filter The filter type.
   * @param now The current date.
   * @returns True if the survey matches the filter, false otherwise.
   */
  private matchesStatusFilter(s: any, filter: 'active' | 'past', now: Date): boolean {
    if (!s.ends_in) return filter === 'active';
    const endDate = this.parseDate(s.ends_in);
    if (isNaN(endDate.getTime())) return filter === 'active';
    return filter === 'active' ? endDate >= now : endDate < now;
  }

  /**
   * Computed signal that returns up to 3 surveys ending soon.
   */
  endingSoonSurveys = computed(() => {
    const activeSurveys = this.getActiveEndingSurveys(this.surveys());
    activeSurveys.sort((a, b) => this.compareEndDates(a, b));
    return activeSurveys.slice(0, 3);
  });

  /**
   * Filters active surveys that have a valid end date.
   * @param list The list of surveys.
   * @returns The filtered list of active surveys.
   */
  private getActiveEndingSurveys(list: any[]): any[] {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return list.filter(s => {
      if (!s.ends_in) return false;
      const endDate = this.parseDate(s.ends_in);
      return !isNaN(endDate.getTime()) && endDate >= now;
    });
  }

  /**
   * Compares two surveys by their end date.
   * @param a The first survey.
   * @param b The second survey.
   * @returns A negative number if a ends before b, positive otherwise.
   */
  private compareEndDates(a: any, b: any): number {
    const timeA = this.parseDate(a.ends_in).getTime();
    const timeB = this.parseDate(b.ends_in).getTime();
    return timeA - timeB;
  }

  /**
   * Initializes the component and fetches surveys.
   */
  async ngOnInit() {
    try {
      const data = await this.supabaseService.getSurveys();
      this.surveys.set(data || []);
    } catch (error) {
      console.error('Error fetching surveys:', error);
    }
  }

  /**
   * Toggles the category dropdown state.
   */
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  /**
   * Selects a category and closes the dropdown.
   * @param category The selected category.
   */
  selectCategory(category: string) {
    this.selectedCategory.set(category);
    this.isDropdownOpen = false;
  }

  /**
   * Toggles the active/past filter.
   * @param filter The filter to toggle.
   */
  toggleFilter(filter: 'active' | 'past') {
    this.activeFilter.set(filter);
  }
}
