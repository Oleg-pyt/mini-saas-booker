import { Component } from '@angular/core';
import { SetupStaffCandidate } from '@benatti/api';

import { SetupOrganisationEditStore } from '../../store/setup-organisation-edit.store';

@Component({
  selector: 'app-setup-organisation-edit-team-tab',
  templateUrl: './setup-organisation-edit-team-tab.component.html',
  styleUrls: ['./setup-organisation-edit-team-tab.component.scss'],
  standalone: false
})
export class SetupOrganisationEditTeamTabComponent {
  constructor(private readonly store: SetupOrganisationEditStore) {}

  protected get staffQuery(): string {
    return this.store.snapshot.staffQuery;
  }

  protected get isSearchingStaff(): boolean {
    return this.store.snapshot.isSearchingStaff;
  }

  protected get staffSearchResults() {
    return this.store.snapshot.staffSearchResults;
  }

  protected get selectedMembers() {
    return this.store.snapshot.selectedMembers;
  }

  protected onSearch(query: string): void {
    this.store.searchStaff(query);
  }

  protected onAddMember(candidate: SetupStaffCandidate): void {
    this.store.addMember(candidate);
  }

  protected onRemoveMember(login: string): void {
    this.store.removeMember(login);
  }

  protected isMemberSelected(login: string): boolean {
    return this.store.snapshot.selectedMembers.some((member) => member.login === login);
  }
}
