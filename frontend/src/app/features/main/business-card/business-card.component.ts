import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { Business } from '../models/business.model';

@Component({
  selector: 'app-business-card',
  templateUrl: './business-card.component.html',
  styleUrls: ['./business-card.component.scss'],
  standalone: false
})
export class BusinessCardComponent {
  @Input({ required: true }) business!: Business;
}
