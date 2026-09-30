import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { Router, RouterLink } from '@angular/router';
import { LeadDataService } from '../../core/data/lead-data.service';
import { GUJARAT_DISTRICTS, GUJARAT_STATE } from '../../shared/models/gujarat-districts';
import { PasteLeadRow } from '../../shared/models/lead-extraction.model';
import { LeadInput, WebsiteStatus } from '../../shared/models/lead.model';

@Component({
  selector: 'app-paste-lead',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NgIcon],
  templateUrl: './paste-lead.component.html',
  styleUrl: './paste-lead.component.css'
})
export class PasteLeadComponent {
  readonly state = GUJARAT_STATE;
  readonly districts = [...GUJARAT_DISTRICTS];
  readonly websiteStatuses: WebsiteStatus[] = ['No website', 'Needs improvement', 'Has website', 'Unknown'];

  pasteText = '';
  pasteRows: PasteLeadRow[] = [];
  pasteError = '';
  pasteNotice = '';
  parsing = false;
  importing = false;
  constructor(private readonly data: LeadDataService, private readonly router: Router) { }

  async parsePastedLeads(): Promise<void> {
    this.pasteError = '';
    this.pasteNotice = '';
    const text = this.pasteText.trim();
    if (!text) { this.pasteError = 'Paste business information to continue.'; return; }
    if (text.length > 50000) { this.pasteError = 'This paste is too large. Keep each import to 50,000 characters or fewer.'; return; }
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
        const sourceDistrict = value(fields.district);
        const sourceCity = value(fields.city);
        const districtFromDistrict = normalizedDistricts.get(sourceDistrict.toLowerCase());
        const districtFromCity = normalizedDistricts.get(sourceCity.toLowerCase());
        const districtCityWereSwapped = !districtFromDistrict && !!districtFromCity;
        const website = value(fields.website);
        const websiteStatus = this.websiteStatuses.find(status => status.toLowerCase() === fields.websiteStatus?.toLowerCase()) ?? 'Unknown';
        const aiSuggestion = [
          fields.opportunity ? `Opportunity: ${fields.opportunity.trim()}` : '',
          ...(fields.otherDetails ?? []).map(detail => detail.trim()).filter(Boolean)
        ].filter(Boolean).join('\n');

        const lead: LeadInput = {
          name: value(fields.name), industry: value(fields.industry), state: this.state,
          district: districtFromDistrict ?? districtFromCity ?? sourceDistrict,
          city: districtCityWereSwapped ? sourceDistrict : sourceCity,
          phone: value(fields.phone), email: value(fields.email), url: value(fields.url), website,
          websiteStatus, about: value(fields.about), source: `Pasted data · ${data.model ?? 'Gemini AI'}`, status: 'New', notes: '',
          aiSuggestion
        };
        const reviewReasons = [...(record.reviewReasons ?? [])];
        if (districtCityWereSwapped) {
          reviewReasons.push(`District and city/area looked swapped; ${districtFromCity} was recognized as a Gujarat district.`);
        }
        if (!lead.name) reviewReasons.push('Business name was not identified.');
        if (!lead.industry) reviewReasons.push('Industry was not identified.');
        const businessKey = `${lead.name.trim().toLowerCase()}|${lead.district.trim().toLowerCase()}`;
        const phoneKey = lead.phone.replace(/\D/g, '');
        const emailKey = lead.email.trim().toLowerCase();
        const duplicate = (!!lead.name.trim() && seenBusinesses.has(businessKey))
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
      const duplicateResult = await this.data.checkLeadDuplicates(this.pasteRows.map(row => row.lead));
      if (duplicateResult.error) {
        this.pasteError = 'Existing leads could not be checked. Review the extracted rows for duplicates before importing.';
      } else {
        const existingDuplicates = duplicateResult.data?.duplicates ?? [];
        this.pasteRows = this.pasteRows.map((row, index) => {
          const duplicate = row.duplicate || !!existingDuplicates[index];
          return { ...row, duplicate, selected: row.selected && !duplicate };
        });
      }
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

  async savePastedLeads(): Promise<void> {
    const selected = this.selectedPasteRows;
    if (!selected.length) { this.pasteError = 'Select at least one row with a business name and industry.'; return; }
    this.importing = true; this.pasteError = '';
    try {
      const { data, error } = await this.data.addLeads(selected.map(row => ({ ...row.lead, name: row.lead.name.trim(), industry: row.lead.industry.trim(), state: this.state })));
      if (error) throw error;
      this.router.navigate(['/leads']);
    } catch (error) {
      this.pasteError = `Couldn't import these leads. ${error instanceof Error ? error.message : 'Check that the API and MongoDB are running.'}`;
      this.importing = false;
    }
  }
}
