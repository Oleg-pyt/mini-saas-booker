import { Routes } from '@angular/router';

import { setupOwnerGuard } from '../auth/guards/setup-owner.guard';
import { SetupEntryPageComponent } from './setup-entry-page/setup-entry-page.component';
import { SetupOrganisationEditPageComponent } from './setup-organisation-edit-page/setup-organisation-edit-page.component';
import { SetupOrganisationPageComponent } from './setup-organisation-page/setup-organisation-page.component';

export const setupRoutes: Routes = [
  {
    path: '',
    canActivate: [setupOwnerGuard],
    component: SetupEntryPageComponent
  },
  {
    path: 'organisation',
    canActivate: [setupOwnerGuard],
    component: SetupOrganisationPageComponent
  },
  {
    path: 'organisation/:businessSlug/edit',
    canActivate: [setupOwnerGuard],
    component: SetupOrganisationEditPageComponent
  }
];