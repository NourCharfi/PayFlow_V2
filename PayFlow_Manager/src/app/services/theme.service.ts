import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkMode = new BehaviorSubject<boolean>(false);
  darkMode$ = this.darkMode.asObservable();

  constructor() {
    // Check for user's preferred theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.darkMode.next(savedTheme === 'dark');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.darkMode.next(prefersDark);
    }
  }

  toggleTheme(): void {
    this.darkMode.next(!this.darkMode.value);
    localStorage.setItem('theme', this.darkMode.value ? 'dark' : 'light');
    this.updateTheme();
  }

  private updateTheme(): void {
    if (this.darkMode.value) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }
}
