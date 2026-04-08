import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { Business } from '../models/business.model';
import { BusinessCatalogService } from '../services/business-catalog.service';

@Component({
  selector: 'app-business-details',
  templateUrl: './business-details.component.html',
  styleUrls: ['./business-details.component.scss'],
  standalone: false
})
export class BusinessDetailsComponent implements OnInit, OnDestroy {
  protected business: Business | undefined;
  protected isLoading = true;
  protected error = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly catalog: BusinessCatalogService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = true;
      this.isLoading = false;
      return;
    }

    this.catalog.getBusinessById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (business) => {
          this.business = business;
          this.isLoading = false;
        },
        error: () => {
          this.error = true;
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
