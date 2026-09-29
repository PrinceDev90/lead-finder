import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LeadDataService } from '../../core/data/lead-data.service';
import { GUJARAT_DISTRICTS, GUJARAT_STATE } from '../../shared/models/gujarat-districts';
import { PasteLeadRow } from '../../shared/models/lead-extraction.model';
import { LeadInput, WebsiteStatus, Lead } from '../../shared/models/lead.model';

@Component({
  selector: 'app-paste-lead',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './paste-lead.component.html',
  styleUrl: './paste-lead.component.css'
})
export class PasteLeadComponent implements OnInit {
  readonly state = GUJARAT_STATE;
  readonly districts = [...GUJARAT_DISTRICTS];
  readonly websiteStatuses: WebsiteStatus[] = ['No website', 'Needs improvement', 'Has website', 'Unknown'];
  
  pasteText = '';
  pasteRows: PasteLeadRow[] = [];
  pasteError = '';
  pasteNotice = '';
  parsing = false;
  importing = false;
  existingLeads: Lead[] = [];

  constructor(private readonly data: LeadDataService, private readonly router: Router) {}

  async ngOnInit(): Promise<void> {
    const { data } = await this.data.getLeads();
    this.existingLeads = data ?? [];
  }

  async parsePastedLeads(): Promise<void> {
    this.pasteError = '';
    this.pasteNotice = '';
    const text = this.pasteText.trim();
    if (!text) { this.pasteError = 'Paste business information to continue.'; return; }
    if (text.length > 30000) { this.pasteError = 'This paste is too large. Keep each import under 30,000 characters.'; return; }
    this.parsing = true;
    this.pasteRows = [];
    try {
      const data = await this.data.extractPastedLeads(text);
      if (!data?.records?.length) {
        this.pasteError = data?.warnings?.join(' ') || 'The AI could not identify any business records in this paste.';
        return;
      }
      const normalizedDistricts = new Map(this.districts.map(district => [district.toLowerCase(), district]));
      const seenBusinesses = new Set<string>();
      const seenPhones = new Set<string>();
      const seenEmails = new Set<string>();
      this.pasteRows = data.records.map((record, index) => {
        const fields = record.fields;
        const value = (field: string | null) => field?.trim() ?? '';
        const districtValue = value(fields.district);
        const website = value(fields.website);
        const websiteStatus = this.websiteStatuses.find(status => status.toLowerCase() === fields.websiteStatus?.toLowerCase()) ?? 'Unknown';
        const aiSuggestion = [
          fields.opportunity ? `Opportunity: ${fields.opportunity.trim()}` : '',
          ...(fields.otherDetails ?? []).map(detail => detail.trim()).filter(Boolean)
        ].filter(Boolean).join('\n');
        
        const lead: LeadInput = {
          name: value(fields.name), industry: value(fields.industry), state: this.state,
          district: normalizedDistricts.get(districtValue.toLowerCase()) ?? districtValue,
          city: value(fields.city), phone: value(fields.phone), email: value(fields.email), url: value(fields.url), website,
          websiteStatus, about: value(fields.about), source: `Pasted data · ${data.model ?? 'Gemini AI'}`, status: 'New', notes: '',
          aiSuggestion
        };
        const reviewReasons = [...(record.reviewReasons ?? [])];
        if (!lead.name) reviewReasons.push('Business name was not identified.');
        if (!lead.industry) reviewReasons.push('Industry was not identified.');
        const businessKey = `${lead.name.trim().toLowerCase()}|${lead.district.trim().toLowerCase()}`;
        const phoneKey = lead.phone.replace(/\D/g, '');
        const emailKey = lead.email.trim().toLowerCase();
        const duplicate = this.isDuplicate(lead)
          || (!!lead.name.trim() && seenBusinesses.has(businessKey))
          || (!!phoneKey && seenPhones.has(phoneKey))
          || (!!emailKey && seenEmails.has(emailKey));
        if (lead.name.trim()) seenBusinesses.add(businessKey);
        if (phoneKey) seenPhones.add(phoneKey);
        if (emailKey) seenEmails.add(emailKey);
        return {
          rowNumber: index + 1,
          sourceRow: record.sourceRow,
          confidence: record.confidence,
          reviewReasons: [...new Set(reviewReasons)],
          lead,
          selected: !!lead.name && !!lead.industry && !duplicate && record.confidence !== 'low',
          duplicate
        };
      });
      const warnings = data.warnings?.length ? ` ${data.warnings.join(' ')}` : '';
      const modelUsed = data.model ? ` using ${data.model}` : '';
      this.pasteNotice = `AI extracted ${this.pasteRows.length} candidate lead${this.pasteRows.length === 1 ? '' : 's'}${modelUsed}. Review every row before saving.${warnings}`;
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown model API error.';
      this.pasteError = `AI extraction failed. ${details}`;
    } finally { this.parsing = false; }
  }

  get selectedPasteRows(): PasteLeadRow[] { return this.pasteRows.filter(row => row.selected && !!row.lead.name.trim() && !!row.lead.industry.trim()); }
  selectValidPasteRows(): void { this.pasteRows.forEach(row => row.selected = !!row.lead.name.trim() && !!row.lead.industry.trim() && !row.duplicate && row.confidence !== 'low'); }
  
  private isDuplicate(lead: LeadInput): boolean {
    return this.existingLeads.some(existing =>
      (existing.name.trim().toLowerCase() === lead.name.trim().toLowerCase() && existing.district.trim().toLowerCase() === lead.district.trim().toLowerCase())
      || (!!lead.phone && existing.phone.replace(/\D/g, '') === lead.phone.replace(/\D/g, ''))
      || (!!lead.email && existing.email.trim().toLowerCase() === lead.email.trim().toLowerCase())
    );
  }

  async savePastedLeads(): Promise<void> {
    const selected = this.selectedPasteRows;
    if (!selected.length) { this.pasteError = 'Select at least one row with a business name and industry.'; return; }
    this.importing = true; this.pasteError = '';
    try {
      const { data, error } = await this.data.addLeads(selected.map(row => ({ ...row.lead, name: row.lead.name.trim(), industry: row.lead.industry.trim(), state: this.state })));
      if (error) throw error;
      this.router.navigate(['/leads']);
    } catch (error) {
      this.pasteError = `Couldn't import these leads. ${error instanceof Error ? error.message : 'Check your Supabase connection.'}`;
      this.importing = false;
    }
  }
}
