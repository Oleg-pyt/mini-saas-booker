import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { authRoutes } from './auth.routes';
import { LoginPageComponent } from './login-page/login-page.component';
import { RegisterPageComponent } from './register-page/register-page.component';
import { ApiModule } from '@benatti/api';

@NgModule({
  declarations: [
    LoginPageComponent,
    RegisterPageComponent
],
  imports: [
    CommonModule,
    FormsModule,
    ApiModule,
    RouterModule.forChild(authRoutes)
]
})
export class AuthModule {}
