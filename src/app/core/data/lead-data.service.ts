import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { DistrictCoverage, Lead, LeadInput } from '../../shared/models/lead.model';
import { LeadExtractionResponse } from '../../shared/models/lead-extraction.model';

const MAX_LEAD_RECORDS = 25;

@Injectable({ providedIn: 'root' })
export class LeadDataService {
  private readonly supabase: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseKey);

  async getLeads() {
    const pageSize = 1000;
    const leads: Lead[] = [];
    let from = 0;

    while (true) {
      const { data, error } = await this.supabase.from('leads').select('*')
        .order('created_at', { ascending: false })
        .order('id', { ascending: true })
        .range(from, from + pageSize - 1)
        .returns<Lead[]>()
        .abortSignal(AbortSignal.timeout(15000));

      if (error) return { data: null, error };
      const page = data ?? [];
      leads.push(...page);
      if (page.length < pageSize) break;
      from += page.length;
    }

    return { data: leads, error: null };
  }

  addLead(lead: LeadInput) {
    return this.supabase.from('leads').insert(lead).select().single<Lead>();
  }

  addLeads(leads: LeadInput[]) {
    return this.supabase.from('leads').insert(leads).select().returns<Lead[]>();
  }

  async extractPastedLeads(text: string): Promise<LeadExtractionResponse> {
    const response = await fetch('/api/extract-leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(60000),
      body: JSON.stringify({ text }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result?.error || `AI extraction returned HTTP ${response.status}.`);
    }
    const parsed = result as LeadExtractionResponse;
    if (!Array.isArray(parsed.records) || !Array.isArray(parsed.warnings)) throw new Error('The model returned an unexpected response. Try again.');
    return { records: parsed.records.slice(0, MAX_LEAD_RECORDS), warnings: parsed.warnings.slice(0, 20) };
  }

  updateLead(id: string, changes: LeadInput) {
    return this.supabase.from('leads').update(changes).eq('id', id).select().single<Lead>();
  }

  deleteLead(id: string) {
    return this.supabase.from('leads').delete().eq('id', id);
  }

  getDistrictCoverage() {
    return this.supabase.from('district_coverage').select('*').eq('state', 'Gujarat').order('district')
      .returns<DistrictCoverage[]>().abortSignal(AbortSignal.timeout(15000));
  }

  updateDistrictCoverage(id: string, status: DistrictCoverage['status']) {
    return this.supabase.from('district_coverage').update({ status }).eq('id', id).select().single<DistrictCoverage>();
  }
}
