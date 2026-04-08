import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthFacade } from '../auth.facade';

@Component({
  selector: 'app-register-page',
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class RegisterPageComponent implements OnInit {
  protected name = '';
  protected login = '';
  protected email = '';
  protected password = '';
  private returnUrl = '/';

  constructor(
    private readonly authFacade: AuthFacade,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  protected get state$() {
    return this.authFacade.state$;
  }

  ngOnInit(): void {
    this.authFacade.initializeFromStorage();
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';

    if (this.authFacade.snapshot.token) {
      this.authFacade.validateToken().subscribe((ok) => {
        if (ok) {
          this.router.navigateByUrl(this.returnUrl);
        }
      });
    }
  }

  protected submit(): void {
    this.authFacade
      .register({
        name: this.name.trim(),
        login: this.login.trim(),
        email: this.email.trim(),
        password: this.password
      }, this.returnUrl)
      .subscribe();
  }

  protected goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
