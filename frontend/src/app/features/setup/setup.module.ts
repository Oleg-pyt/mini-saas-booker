import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink, RouterModule } from '@angular/router';

import { setupRoutes } from './setup.routes';
import { SetupOrganisationPageComponent } from './setup-organisation-page/setup-organisation-page.component';
import { SetupOrganisationEditPageComponent } from './setup-organisation-edit-page/setup-organisation-edit-page.component';
import { SetupEntryPageComponent } from './setup-entry-page/setup-entry-page.component';

@NgModule({
  declarations: [
    SetupOrganisationPageComponent,
    SetupOrganisationEditPageComponent,
    SetupEntryPageComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(setupRoutes),
    RouterLink
]
})
export class SetupModule {}
