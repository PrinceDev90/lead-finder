import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { LeadDataService, LeadFilters } from '../../core/data/lead-data.service';
import { GUJARAT_DISTRICTS, GUJARAT_STATE } from '../../shared/models/gujarat-districts';

import { Lead, LeadInput, LeadStatus, WebsiteStatus } from '../../shared/models/lead.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-leads', standalone: true, imports: [CommonModule, FormsModule, RouterLink, NgIcon],
  templateUrl: './leads.component.html', styleUrl: './leads.component.css'
})
export class LeadsComponent implements OnInit {
  readonly today = new Date();
  readonly state = GUJARAT_STATE;
  readonly districts = [...GUJARAT_DISTRICTS];
  readonly statuses: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Proposal sent', 'Won', 'Lost'];
  readonly websiteStatuses: WebsiteStatus[] = ['No website', 'Needs improvement', 'Has website', 'Unknown'];
  leads: Lead[] = [];
  totalLeads = 0;
  websiteGapCount = 0;
  contactedCount = 0;
  filteredTotal = 0;
  loading = true;
  error = '';
  query = '';
  statusFilter = 'All statuses';
  websiteFilter = 'All website statuses';
  districtFilter = 'All districts';
  activeTab = 'All leads';
  currentPage = 1;
  readonly pageSize = 100;
  modalOpen = false;
  exporting = false;
  editingId = '';
  saving = false;
  toast = '';
  form: LeadInput = this.emptyForm();
  private loadRequestId = 0;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly data: LeadDataService) { }

  get totalPages(): number { return Math.ceil(this.filteredTotal / this.pageSize) || 1; }
  get showingFrom(): number { return this.filteredTotal ? (this.currentPage - 1) * this.pageSize + 1 : 0; }
  get showingTo(): number { return Math.min(this.currentPage * this.pageSize, this.filteredTotal); }

  nextPage(): void { if (this.currentPage < this.totalPages) { this.currentPage++; void this.loadLeads(); } }
  prevPage(): void { if (this.currentPage > 1) { this.currentPage--; void this.loadLeads(); } }
  onSearchChanged(value: string): void {
    this.query = value;
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.currentPage = 1; void this.loadLeads(); }, 250);
  }
  applyFilters(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.currentPage = 1;
    void this.loadLeads();
  }
  setActiveTab(tab: string): void { if (this.activeTab !== tab) { this.activeTab = tab; this.applyFilters(); } }

  async ngOnInit(): Promise<void> { await this.loadLeads(); }
  private emptyForm(): LeadInput {
    return { name: '', industry: '', state: this.state, district: 'Amreli', city: '', phone: '', email: '', url: '', website: '', websiteStatus: 'Unknown', about: '', source: '', status: 'New', notes: '', aiSuggestion: '' };
  }
  async loadLeads(): Promise<void> {
    const requestId = ++this.loadRequestId;
    this.loading = true;
    this.error = '';
    try {
      const { data, error } = await this.data.getLeads(this.buildFilters(), this.currentPage, this.pageSize);
      if (requestId !== this.loadRequestId) return;
      if (error) throw error;
      if (data && this.currentPage > 1 && this.currentPage > Math.ceil(data.total / this.pageSize)) {
        this.currentPage = Math.max(1, Math.ceil(data.total / this.pageSize));
        await this.loadLeads();
        return;
      }
      this.leads = data?.items ?? [];
      this.filteredTotal = data?.total ?? 0;
      this.totalLeads = data?.summary.totalLeads ?? 0;
      this.websiteGapCount = data?.summary.websiteGapCount ?? 0;
      this.contactedCount = data?.summary.contactedCount ?? 0;
    } catch (error) {
      if (requestId === this.loadRequestId) this.error = 'Could not load leads. Check the API connection and try again.';
    } finally {
      if (requestId === this.loadRequestId) this.loading = false;
    }
  }
  private buildFilters(): LeadFilters {
    return {
      state: this.state,
      ...(this.query.trim() ? { search: this.query.trim() } : {}),
      ...(this.statusFilter !== 'All statuses' ? { status: this.statusFilter } : {}),
      ...(this.websiteFilter !== 'All website statuses' ? { websiteStatus: this.websiteFilter } : {}),
      ...(this.districtFilter !== 'All districts' ? { district: this.districtFilter } : {}),
      ...(this.activeTab === 'Needs a website' ? { websiteOpportunity: true } : {}),
    };
  }
  openNew(): void { this.editingId = ''; this.form = this.emptyForm(); this.modalOpen = true; }

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
      if (!data) throw new Error('The API did not return the saved lead.');
      this.modalOpen = false; this.showToast(this.editingId ? 'Lead updated' : 'Lead added');
      await this.loadLeads();
    } catch (error) { this.error = `Couldn't save this lead. ${error instanceof Error ? error.message : ''}`; }
    finally { this.saving = false; }
  }
  async deleteLead(lead: Lead): Promise<void> {
    if (!window.confirm(`Delete ${lead.name}? This cannot be undone.`)) return;
    try {
      const { error } = await this.data.deleteLead(lead.id);
      if (error) throw error;
      this.showToast('Lead deleted');
      await this.loadLeads();
    } catch (error) { this.error = `Couldn't delete this lead. ${error instanceof Error ? error.message : ''}`; }
  }
  async exportCsv(): Promise<void> {
    const columns: (keyof Lead)[] = ['name', 'industry', 'state', 'district', 'city', 'phone', 'email', 'url', 'website', 'websiteStatus', 'about', 'source', 'status', 'notes'];
    const quote = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    this.exporting = true;
    try {
      const { data, error } = await this.data.getAllLeads(this.buildFilters());
      if (error) throw error;
      const csv = [columns.join(','), ...(data ?? []).map(lead => columns.map(column => quote(lead[column])).join(','))].join('\r\n');
      const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); link.download = 'gujarat-leads.csv'; link.click(); URL.revokeObjectURL(link.href);
    } catch (error) {
      this.error = `Couldn't export leads. ${error instanceof Error ? error.message : ''}`;
    } finally { this.exporting = false; }
  }
  private showToast(message: string): void { this.toast = message; setTimeout(() => this.toast = '', 2600); }
  getBusinessUrl(url: string | null | undefined): string {
    const value = typeof url === 'string' ? url.trim() : '';
    if (!value) return '';
    const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      const parsed = new URL(normalized);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : '';
    } catch { return ''; }
  }
  dismissError(): void { this.error = ''; }
}
