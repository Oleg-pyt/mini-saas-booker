import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { Business } from '../models/business.model';

@Component({
  selector: 'app-business-list',
  templateUrl: './business-list.component.html',
  styleUrls: ['./business-list.component.scss'],
  standalone: false
})
export class BusinessListComponent {
  @Input() businesses: Business[] = [];
}
