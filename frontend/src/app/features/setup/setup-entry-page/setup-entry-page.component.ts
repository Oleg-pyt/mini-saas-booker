import { Component, Inject, OnInit } from '@angular/core';
import { SetupOwnedBusiness, SetupOwnerBusinessesService } from '../services/setup-owner-businesses.service';

@Component({
  selector: 'app-setup-entry-page',
  templateUrl: './setup-entry-page.component.html',
  styleUrls: ['./setup-entry-page.component.scss'],
  standalone: false,
})
export class SetupEntryPageComponent implements OnInit {
  protected businesses: SetupOwnedBusiness[] = [];
  protected isLoading = true;
  protected error = '';

  constructor(@Inject(SetupOwnerBusinessesService) private readonly setupOwnerBusinessesService: SetupOwnerBusinessesService) {}

  ngOnInit(): void {
    this.loadBusinesses();
  }

  private loadBusinesses(): void {
    this.isLoading = true;
    this.error = '';

    this.setupOwnerBusinessesService.getOwnedBusinesses().subscribe({
      next: (businesses) => {
        this.businesses = businesses;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Could not load your businesses. Please try again.';
        this.isLoading = false;
      }
    });
  }
}
