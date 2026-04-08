import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthFacade } from '../auth.facade';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class LoginPageComponent implements OnInit {
  protected login = '';
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
    this.authFacade.login({ login: this.login.trim(), password: this.password }, this.returnUrl).subscribe();
  }

  protected goToRegister(): void {
    this.router.navigate(['/auth/register']);
  }
}
