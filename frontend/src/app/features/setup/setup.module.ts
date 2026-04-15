import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink, RouterModule } from '@angular/router';

import { setupRoutes } from './setup.routes';
import { SetupOrganisationPageComponent } from './setup-organisation-page/setup-organisation-page.component';
import { SetupOrganisationEditPageComponent } from './setup-organisation-edit-page/setup-organisation-edit-page.component';
import { SetupEntryPageComponent } from './setup-entry-page/setup-entry-page.component';
import { SetupOrganisationEditSummaryTabComponent } from './setup-organisation-edit-page/components/setup-organisation-edit-summary-tab/setup-organisation-edit-summary-tab.component';
import { SetupOrganisationEditServicesTabComponent } from './setup-organisation-edit-page/components/setup-organisation-edit-services-tab/setup-organisation-edit-services-tab.component';
import { SetupOrganisationEditTeamTabComponent } from './setup-organisation-edit-page/components/setup-organisation-edit-team-tab/setup-organisation-edit-team-tab.component';

@NgModule({
  declarations: [
    SetupOrganisationPageComponent,
    SetupOrganisationEditPageComponent,
    SetupEntryPageComponent,
    SetupOrganisationEditSummaryTabComponent,
    SetupOrganisationEditServicesTabComponent,
    SetupOrganisationEditTeamTabComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(setupRoutes),
    RouterLink
]
})
export class SetupModule {}
