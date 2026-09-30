import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { LeadDataService } from '../../core/data/lead-data.service';
import { DistrictSummary } from '../../shared/models/lead.model';

interface IndustryStat { name: string; count: number; width: number }

@Component({
  selector: 'app-dashboard', standalone: true, imports: [CommonModule, RouterLink, NgIcon],
  templateUrl: './dashboard.component.html', styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  readonly state = 'Gujarat';
  totalLeads = 0;
  districtsWithLeads = 0;
  websiteGapCount = 0;
  industryCategoryCount = 0;
  coverage: DistrictSummary[] = [];
  industryStats: IndustryStat[] = [];
  loading = true;
  error = '';

  constructor(private readonly data: LeadDataService) { }

  get coveredCount(): number { return this.coverage.filter(item => item.status === 'Covered').length; }
  get researchingCount(): number { return this.coverage.filter(item => item.status === 'Researching').length; }
  private buildIndustryStats(categories: { name: string; count: number }[]): IndustryStat[] {
    const sorted = [...categories].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    const max = Math.max(1, ...sorted.map(item => item.count));
    return sorted.map(item => ({ ...item, width: Math.round(item.count / max * 100) }));
  }
  get districtsByLeadCount(): DistrictSummary[] {
    return [...this.coverage].sort((a, b) => b.leadCount - a.leadCount || a.district.localeCompare(b.district));
  }
  get coveragePercent(): number { return this.coverage.length ? Math.round(this.coveredCount / this.coverage.length * 100) : 0; }
  trackByDistrictId(_index: number, item: DistrictSummary): string { return item.id; }
  trackByIndustry(_index: number, item: { name: string }): string { return item.name; }

  async ngOnInit(): Promise<void> { await this.loadData(); }

  async loadData(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const result = await this.data.getStateDashboardSummary(this.state);
      if (result.error) throw result.error;
      if (!result.data) throw new Error('The API returned no dashboard summary.');

      this.totalLeads = result.data.totalLeads;
      this.districtsWithLeads = result.data.districtsWithLeads;
      this.websiteGapCount = result.data.websiteGapCount;
      this.coverage = result.data.coverage;
      this.industryCategoryCount = result.data.industryStats.categoryCount ?? result.data.industryStats.categories.length;
      this.industryStats = this.buildIndustryStats(result.data.industryStats.categories);
    } catch {
      this.error = 'Could not load the state dashboard. Check the API connection and try again.';
    } finally {
      this.loading = false;
    }
  }
}
