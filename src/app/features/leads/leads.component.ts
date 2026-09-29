import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LeadDataService } from '../../core/data/lead-data.service';
import { GUJARAT_DISTRICTS, GUJARAT_STATE } from '../../shared/models/gujarat-districts';

import { Lead, LeadInput, LeadStatus, WebsiteStatus } from '../../shared/models/lead.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-leads', standalone: true, imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './leads.component.html', styleUrl: './leads.component.css'
})
export class LeadsComponent implements OnInit {
  readonly today = new Date();
  readonly state = GUJARAT_STATE;
  readonly districts = [...GUJARAT_DISTRICTS];
  readonly statuses: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Proposal sent', 'Won', 'Lost'];
  readonly websiteStatuses: WebsiteStatus[] = ['No website', 'Needs improvement', 'Has website', 'Unknown'];
  leads: Lead[] = [];
  loading = true;
  error = '';
  query = '';
  statusFilter = 'All statuses';
  websiteFilter = 'All website statuses';
  districtFilter = 'All districts';
  activeTab = 'All leads';
  currentPage = 1;
  pageSize = 15;
  Math = Math;
  modalOpen = false;
  
  editingId = '';
  saving = false;
  toast = '';
  form: LeadInput = this.emptyForm();

  constructor(private readonly data: LeadDataService) {}

  get filteredLeads(): Lead[] {
    const q = this.query.trim().toLowerCase();
    return this.leads.filter(lead => {
      const matchesQuery = !q || [lead.name, lead.industry, lead.city, lead.district, lead.phone, lead.email, lead.url].some(value => value?.toLowerCase().includes(q));
      return matchesQuery && (this.statusFilter === 'All statuses' || lead.status === this.statusFilter)
        && (this.websiteFilter === 'All website statuses' || lead.websiteStatus === this.websiteFilter)
        && (this.districtFilter === 'All districts' || lead.district === this.districtFilter)
        && (this.activeTab !== 'Needs a website' || ['No website', 'Needs improvement'].includes(lead.websiteStatus));
    });
  }
  
  get totalPages(): number { return this.Math.ceil(this.filteredLeads.length / this.pageSize) || 1; }
  
  get paginatedLeads(): Lead[] {
    const filtered = this.filteredLeads;
    if (this.currentPage > this.Math.ceil(filtered.length / this.pageSize)) {
      this.currentPage = this.Math.ceil(filtered.length / this.pageSize) || 1;
    }
    const start = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  }
  
  nextPage(): void { if (this.currentPage < this.totalPages) this.currentPage++; }
  prevPage(): void { if (this.currentPage > 1) this.currentPage--; }

  get websiteGapCount(): number { return this.leads.filter(l => ['No website', 'Needs improvement'].includes(l.websiteStatus)).length; }
  get contactedCount(): number { return this.leads.filter(l => l.status !== 'New').length; }

  async ngOnInit(): Promise<void> { await this.loadLeads(); this.loading = false; }
  private emptyForm(): LeadInput {
    return { name: '', industry: '', state: this.state, district: 'Amreli', city: '', phone: '', email: '', url: '', website: '', websiteStatus: 'Unknown', about: '', source: '', status: 'New', notes: '', aiSuggestion: '' };
  }
  async loadLeads(): Promise<void> {
    try {
      const { data, error } = await this.data.getLeads();
      if (error) throw error;
      this.leads = data ?? [];
    } catch (error) { this.error = `Could not load leads. ${error instanceof Error ? error.message : ''}`; }
  }
  openNew(): void { this.editingId = ''; this.form = this.emptyForm(); this.modalOpen = true; }
  

  

  
  private isDuplicate(lead: LeadInput): boolean {
    return this.leads.some(existing =>
      (existing.name.trim().toLowerCase() === lead.name.trim().toLowerCase() && existing.district.trim().toLowerCase() === lead.district.trim().toLowerCase())
      || (!!lead.phone && existing.phone.replace(/\D/g, '') === lead.phone.replace(/\D/g, ''))
      || (!!lead.email && existing.email.trim().toLowerCase() === lead.email.trim().toLowerCase())
    );
  }
  

  openEdit(lead: Lead): void {
    this.editingId = lead.id;
    this.form = { name: lead.name, industry: lead.industry, state: lead.state || this.state, district: lead.district || 'Amreli', city: lead.city || '', phone: lead.phone || '', email: lead.email || '', url: lead.url || '', website: lead.website || '', websiteStatus: lead.websiteStatus || 'Unknown', about: lead.about || '', source: lead.source || '', status: lead.status || 'New', notes: lead.notes || '', aiSuggestion: lead.aiSuggestion || '' };
    this.modalOpen = true;
  }
  closeModal(): void { this.modalOpen = false; }
  async saveLead(): Promise<void> {
    if (!this.form.name.trim() || !this.form.industry.trim()) return;
    this.saving = true;
    const payload = { ...this.form, name: this.form.name.trim(), industry: this.form.industry.trim(), state: this.state };
    try {
      const { data, error } = this.editingId ? await this.data.updateLead(this.editingId, payload) : await this.data.addLead(payload);
      if (error) throw error;
      if (this.editingId) this.leads = this.leads.map(lead => lead.id === this.editingId ? data! : lead);
      else this.leads = [data!, ...this.leads];
      this.modalOpen = false; this.showToast(this.editingId ? 'Lead updated' : 'Lead added');
    } catch (error) { this.error = `Couldn't save this lead. ${error instanceof Error ? error.message : ''}`; }
    finally { this.saving = false; }
  }
  async deleteLead(lead: Lead): Promise<void> {
    if (!window.confirm(`Delete ${lead.name}? This cannot be undone.`)) return;
    try {
      const { error } = await this.data.deleteLead(lead.id);
      if (error) throw error;
      this.leads = this.leads.filter(item => item.id !== lead.id); this.showToast('Lead deleted');
    } catch (error) { this.error = `Couldn't delete this lead. ${error instanceof Error ? error.message : ''}`; }
  }
  exportCsv(): void {
    const columns: (keyof Lead)[] = ['name', 'industry', 'state', 'district', 'city', 'phone', 'email', 'url', 'website', 'websiteStatus', 'about', 'source', 'status', 'notes'];
    const quote = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = [columns.join(','), ...this.filteredLeads.map(lead => columns.map(column => quote(lead[column])).join(','))].join('\r\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); link.download = 'gujarat-leads.csv'; link.click(); URL.revokeObjectURL(link.href);
  }
  private showToast(message: string): void { this.toast = message; setTimeout(() => this.toast = '', 2600); }
  getBusinessUrl(url: string): string {
    const value = url.trim();
    if (!value) return '';
    const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      const parsed = new URL(normalized);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : '';
    } catch { return ''; }
  }
  dismissError(): void { this.error = ''; }
}
