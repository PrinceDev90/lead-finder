import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LeadDataService } from '../../core/data/lead-data.service';
import { GUJARAT_DISTRICTS, GUJARAT_STATE } from '../../shared/models/gujarat-districts';
import { CoverageStatus, DistrictCoverage, Lead } from '../../shared/models/lead.model';

@Component({
  selector: 'app-district-coverage', standalone: true, imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './district-coverage.component.html', styleUrl: './district-coverage.component.css'
})
export class DistrictCoverageComponent implements OnInit {
  readonly districts = [...GUJARAT_DISTRICTS];
  readonly state = GUJARAT_STATE;
  readonly statuses: CoverageStatus[] = ['Not started', 'Researching', 'Covered'];
  coverage: DistrictCoverage[] = [];
  leads: Lead[] = [];
  search = '';
  statusFilter = 'All progress';
  loading = true;
  savingId = '';
  error = '';
  toast = '';

  constructor(private readonly data: LeadDataService) {}

  rows: (DistrictCoverage & { leadCount: number })[] = [];

  updateRows(): void {
    const counts = new Map<string, number>();
    for (const lead of this.leads) {
      if (lead.district) counts.set(lead.district, (counts.get(lead.district) ?? 0) + 1);
    }
    this.rows = this.coverage.map(item => ({ ...item, leadCount: counts.get(item.district) ?? 0 }))
      .filter(item => item.district.toLowerCase().includes(this.search.toLowerCase().trim())
        && (this.statusFilter === 'All progress' || item.status === this.statusFilter));
  }
  trackByDistrictId(_index: number, item: DistrictCoverage): string { return item.id; }
  get coveredCount(): number { return this.coverage.filter(item => item.status === 'Covered').length; }
  get researchingCount(): number { return this.coverage.filter(item => item.status === 'Researching').length; }
  get districtsWithLeads(): number { return new Set(this.leads.map(lead => lead.district).filter(Boolean)).size; }
  get leadCount(): number { return this.leads.length; }
  get progressPercent(): number { return this.coverage.length ? Math.round(this.coveredCount / this.coverage.length * 100) : 0; }

  async ngOnInit(): Promise<void> { await this.loadData(); }

  async loadData(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const [coverageResult, leadResult] = await Promise.allSettled([
        this.data.getDistrictCoverage(),
        this.data.getLeads(),
      ]);

      const messages: string[] = [];
      if (coverageResult.status === 'rejected') {
        messages.push(`Couldn't load district coverage: ${this.errorMessage(coverageResult.reason)}`);
      } else if (coverageResult.value.error) {
        const error = coverageResult.value.error;
        messages.push(error.code === 'PGRST205'
          ? 'District table is missing. Run the district workspace migration in Supabase.'
          : `Couldn't load district coverage: ${error.message}`);
      } else {
        this.coverage = coverageResult.value.data ?? [];
      }

      if (leadResult.status === 'rejected') {
        messages.push(`Couldn't load lead totals: ${this.errorMessage(leadResult.reason)}`);
      } else if (leadResult.value.error) {
        messages.push(`Couldn't load lead totals: ${leadResult.value.error.message}`);
      } else {
        this.leads = leadResult.value.data ?? [];
      }
      this.error = messages.join(' ').trim();
      this.updateRows();
    } catch (error) {
      this.error = `Couldn't load district data: ${this.errorMessage(error)}`;
    } finally {
      this.loading = false;
    }
  }

  async saveStatus(item: DistrictCoverage, status: CoverageStatus): Promise<void> {
    this.savingId = item.id;
    try {
      const { data, error } = await this.data.updateDistrictCoverage(item.id, status);
      if (error) throw error;
      this.coverage = this.coverage.map(row => row.id === item.id ? data! : row);
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
