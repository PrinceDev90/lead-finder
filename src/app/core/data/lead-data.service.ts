import { Injectable } from '@angular/core';
import { DistrictCoverage, Lead, LeadInput, LeadPage, StateDashboardSummary } from '../../shared/models/lead.model';
import { LeadExtractionResponse } from '../../shared/models/lead-extraction.model';

const MAX_LEAD_RECORDS = 55;

@Injectable({ providedIn: 'root' })
export class LeadDataService {
  getLeads(filters: LeadFilters = {}, page = 1, pageSize = 100): Promise<ApiResult<LeadPage>> {
    const limit = Math.min(Math.max(Math.trunc(pageSize) || 100, 1), 100);
    const currentPage = Math.max(Math.trunc(page) || 1, 1);
    const query = new URLSearchParams({ limit: String(limit), offset: String((currentPage - 1) * limit) });
    for (const [field, value] of Object.entries(filters)) {
      if (typeof value === 'string' && value.trim()) query.set(field, value.trim());
      else if (typeof value === 'boolean') query.set(field, String(value));
    }
    return this.request<LeadPage>(`/api/leads?${query.toString()}`);
  }

  async getAllLeads(filters: LeadFilters = {}): Promise<ApiResult<Lead[]>> {
    const leads: Lead[] = [];
    let page = 1;
    while (true) {
      const result = await this.getLeads(filters, page, 100);
      if (result.error || !result.data) return { data: null, error: result.error };
      leads.push(...result.data.items);
      if (leads.length >= result.data.total || result.data.items.length === 0) break;
      page++;
    }
    return { data: leads, error: null };
  }

  checkLeadDuplicates(leads: LeadInput[]): Promise<ApiResult<{ duplicates: boolean[] }>> {
    return this.request<{ duplicates: boolean[] }>('/api/leads/check-duplicates', {
      method: 'POST', body: JSON.stringify({ leads }),
    });
  }

  addLead(lead: LeadInput): Promise<ApiResult<Lead>> {
    return this.request<Lead>('/api/leads', { method: 'POST', body: JSON.stringify(lead) });
  }

  addLeads(leads: LeadInput[]): Promise<ApiResult<Lead[]>> {
    return this.request<Lead[]>('/api/leads/bulk', { method: 'POST', body: JSON.stringify({ leads }) });
  }

  async extractPastedLeads(text: string): Promise<LeadExtractionResponse> {
    const response = await fetch('/api/extract-leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(120000),
      body: JSON.stringify({ text }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(result?.error || `AI extraction returned HTTP ${response.status}.`);
    }
    const parsed = result as LeadExtractionResponse;
    if (!Array.isArray(parsed.records) || !Array.isArray(parsed.warnings)) throw new Error('The model returned an unexpected response. Try again.');
    return { records: parsed.records.slice(0, MAX_LEAD_RECORDS), warnings: parsed.warnings.slice(0, 20) };
  }

  updateLead(id: string, changes: LeadInput): Promise<ApiResult<Lead>> {
    return this.request<Lead>(`/api/leads/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(changes) });
  }

  deleteLead(id: string): Promise<ApiResult<{ deleted: boolean }>> {
    return this.request<{ deleted: boolean }>(`/api/leads/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  getDistrictCoverage(): Promise<ApiResult<DistrictCoverage[]>> {
    return this.request<DistrictCoverage[]>('/api/coverage');
  }

  getIndustryStats(): Promise<ApiResult<{ totalLeads: number; categories: { name: string; count: number }[] }>> {
    return this.request('/api/leads/industry-stats');
  }

  getStateDashboardSummary(state: string): Promise<ApiResult<StateDashboardSummary>> {
    const query = new URLSearchParams({ state });
    return this.request<StateDashboardSummary>(`/api/dashboard/state-summary?${query.toString()}`);
  }

  updateDistrictCoverage(id: string, status: DistrictCoverage['status']): Promise<ApiResult<DistrictCoverage>> {
    return this.request<DistrictCoverage>(`/api/coverage/${encodeURIComponent(id)}`, {
      method: 'PATCH', body: JSON.stringify({ status }),
    });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
    try {
      const headers = new Headers(init.headers);
      if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
      const response = await fetch(path, {
        ...init,
        headers,
        signal: init.signal ?? AbortSignal.timeout(15000),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const error = new Error(payload?.error || `API returned HTTP ${response.status}.`) as ApiError;
        error.code = payload?.code;
        return { data: null, error };
      }
      return { data: payload as T, error: null };
    } catch (error) {
      return { data: null, error: toError(error) };
    }
  }
}

interface ApiResult<T> { data: T | null; error: ApiError | null }
interface ApiError extends Error { code?: string }
export interface LeadFilters {
  state?: string;
  district?: string;
  status?: string;
  websiteStatus?: string;
  industry?: string;
  city?: string;
  search?: string;
  websiteOpportunity?: boolean;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Could not reach the backend API.');
}
