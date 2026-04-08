import { Component, HostListener, OnInit } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ToastContainerComponent } from './common/toast/toast-container.component';
import { AuthFacade } from './features/auth/auth.facade';
import { AuthState } from './features/auth/store/auth.store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, ToastContainerComponent, AsyncPipe, NgIf],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected currentTheme: 'light' | 'dark' = 'light';
  protected isAuthRoute = false;
  protected isAccountMenuOpen = false;

  constructor(private readonly authFacade: AuthFacade, private readonly router: Router) {}

  protected get authState$() {
    return this.authFacade.state$;
  }

  ngOnInit(): void {
    const stored = localStorage.getItem('booker-theme');
    this.currentTheme = stored === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', this.currentTheme);

    this.authFacade.initializeFromStorage();
    if (this.authFacade.snapshot.token) {
      this.authFacade.validateToken().subscribe();
    }

    this.isAuthRoute = this.router.url.startsWith('/auth');
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const navigationEnd = event as NavigationEnd;
        this.isAuthRoute = navigationEnd.urlAfterRedirects.startsWith('/auth');
        this.isAccountMenuOpen = false;
      });
  }

  @HostListener('document:click')
  protected handleDocumentClick(): void {
    this.isAccountMenuOpen = false;
  }

  @HostListener('document:keydown.escape')
  protected handleEscapeKey(): void {
    this.isAccountMenuOpen = false;
  }

  protected toggleAccountMenu(event: Event): void {
    event.stopPropagation();
    this.isAccountMenuOpen = !this.isAccountMenuOpen;
  }

  protected closeAccountMenu(event?: Event): void {
    event?.stopPropagation();
    this.isAccountMenuOpen = false;
  }

  protected toggleTheme(): void {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    localStorage.setItem('booker-theme', this.currentTheme);
    this.isAccountMenuOpen = false;
  }

  protected logout(): void {
    this.isAccountMenuOpen = false;
    this.authFacade.logout();
  }

  protected isBusinessOwner(auth: AuthState): boolean {
    return (auth.user as { role?: string } | null)?.role === 'BUSINESS_OWNER';
  }
}
