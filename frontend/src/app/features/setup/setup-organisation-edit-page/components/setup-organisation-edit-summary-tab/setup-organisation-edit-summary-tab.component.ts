import { Component } from '@angular/core';

import { SetupOrganisationEditStore } from '../../store/setup-organisation-edit.store';

@Component({
  selector: 'app-setup-organisation-edit-summary-tab',
  templateUrl: './setup-organisation-edit-summary-tab.component.html',
  styleUrls: ['./setup-organisation-edit-summary-tab.component.scss'],
  standalone: false
})
export class SetupOrganisationEditSummaryTabComponent {
  constructor(private readonly store: SetupOrganisationEditStore) {}

  protected get form() {
    return this.store.form;
  }
}
