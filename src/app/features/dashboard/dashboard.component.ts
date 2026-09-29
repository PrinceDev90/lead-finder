import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LeadDataService } from '../../core/data/lead-data.service';
import { DistrictCoverage, DistrictSummary, Lead } from '../../shared/models/lead.model';

@Component({
  selector: 'app-dashboard', standalone: true, imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html', styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  leads: Lead[] = [];
  coverage: DistrictCoverage[] = [];
  loading = true;
  error = '';

  constructor(private readonly data: LeadDataService) { }

  get summaries(): DistrictSummary[] {
    return this.coverage.map(district => ({ ...district, leadCount: this.leads.filter(lead => lead.district === district.district).length }));
  }
  get coveredCount(): number { return this.coverage.filter(item => item.status === 'Covered').length; }
  get researchingCount(): number { return this.coverage.filter(item => item.status === 'Researching').length; }
  get districtsWithLeads(): number { return new Set(this.leads.map(lead => lead.district).filter(Boolean)).size; }
  get websiteGapCount(): number { return this.leads.filter(lead => ['No website', 'Needs improvement'].includes(lead.websiteStatus)).length; }
  get industryStats(): { name: string; count: number; width: number }[] {
    const groups = new Map<string, number>();
    for (const lead of this.leads) { const industry = lead.industry?.trim() || 'Uncategorized'; groups.set(industry, (groups.get(industry) ?? 0) + 1); }
    const sorted = [...groups].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);
    const max = Math.max(1, ...sorted.map(item => item.count));
    return sorted.map(item => ({ ...item, width: Math.round(item.count / max * 100) }));
  }
  get topDistricts(): DistrictSummary[] { return [...this.summaries].sort((a, b) => b.leadCount - a.leadCount).slice(0, 6); }
  get latestLeads(): Lead[] { return this.leads.slice(0, 5); }
  get coveragePercent(): number { return this.coverage.length ? Math.round(this.coveredCount / this.coverage.length * 100) : 0; }
  trackByDistrictId(_index: number, item: DistrictSummary): string { return item.id; }
  trackByIndustry(_index: number, item: { name: string }): string { return item.name; }

  async ngOnInit(): Promise<void> {
    const [leadResult, coverageResult] = await Promise.all([this.data.getLeads(), this.data.getDistrictCoverage()]);
    if (leadResult.error) this.error = `Couldn't load lead totals. ${leadResult.error.message}`;
    else this.leads = leadResult.data ?? [];
    if (coverageResult.error) this.error = `Couldn't load district coverage. Run the district workspace migration in Supabase. ${coverageResult.error.message}`;
    else this.coverage = coverageResult.data ?? [];
    this.loading = false;
  }
}
