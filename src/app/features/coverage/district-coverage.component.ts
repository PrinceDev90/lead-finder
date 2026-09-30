import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { RouterLink } from '@angular/router';
import { LeadDataService } from '../../core/data/lead-data.service';
import { GUJARAT_DISTRICTS, GUJARAT_STATE } from '../../shared/models/gujarat-districts';
import { CoverageStatus, DistrictSummary } from '../../shared/models/lead.model';

@Component({
  selector: 'app-district-coverage', standalone: true, imports: [CommonModule, FormsModule, RouterLink, NgIcon],
  templateUrl: './district-coverage.component.html', styleUrl: './district-coverage.component.css'
})
export class DistrictCoverageComponent implements OnInit {
  readonly districts = [...GUJARAT_DISTRICTS];
  readonly state = GUJARAT_STATE;
  readonly statuses: CoverageStatus[] = ['Not started', 'Researching', 'Covered'];
  coverage: DistrictSummary[] = [];
  search = '';
  statusFilter = 'All progress';
  loading = true;
  savingId = '';
  error = '';
  toast = '';
  districtsWithLeads = 0;
  leadCount = 0;

  constructor(private readonly data: LeadDataService) { }

  rows: DistrictSummary[] = [];

  updateRows(): void {
    this.rows = this.coverage.filter(item => item.district.toLowerCase().includes(this.search.toLowerCase().trim())
      && (this.statusFilter === 'All progress' || item.status === this.statusFilter));
  }
  trackByDistrictId(_index: number, item: DistrictSummary): string { return item.id; }
  get coveredCount(): number { return this.coverage.filter(item => item.status === 'Covered').length; }
  get researchingCount(): number { return this.coverage.filter(item => item.status === 'Researching').length; }
  get progressPercent(): number { return this.coverage.length ? Math.round(this.coveredCount / this.coverage.length * 100) : 0; }

  async ngOnInit(): Promise<void> { await this.loadData(); }

  async loadData(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const { data, error } = await this.data.getStateDashboardSummary(this.state);
      if (error) throw error;
      if (!data) throw new Error('The API returned no district summary.');
      this.coverage = data.coverage;
      this.leadCount = data.totalLeads;
      this.districtsWithLeads = data.districtsWithLeads;
      this.updateRows();
    } catch {
      this.error = 'Could not load district data. Check the API connection and try again.';
    } finally {
      this.loading = false;
    }
  }

  async saveStatus(item: DistrictSummary, status: CoverageStatus): Promise<void> {
    this.savingId = item.id;
    try {
      const { data, error } = await this.data.updateDistrictCoverage(item.id, status);
      if (error) throw error;
      this.coverage = this.coverage.map(row => row.id === item.id ? { ...row, ...data! } : row);
      this.updateRows();
      this.showToast(`${item.district} marked ${status.toLowerCase()}`);
    } catch (error) {
      this.error = `Couldn't update ${item.district}. ${error instanceof Error ? error.message : ''}`;
      const current = this.coverage.find(row => row.id === item.id);
      if (current) item.status = current.status;
    } finally { this.savingId = ''; }
  }

  private showToast(message: string): void { this.toast = message; setTimeout(() => this.toast = '', 2600); }
  private errorMessage(error: unknown): string { return error instanceof Error ? error.message : String(error); }
  dismissError(): void { this.error = ''; }
}
