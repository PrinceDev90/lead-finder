export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Proposal sent' | 'Won' | 'Lost';
export type WebsiteStatus = 'No website' | 'Needs improvement' | 'Has website' | 'Unknown';

export interface Lead {
  id: string;
  name: string;
  industry: string;
  state: string;
  district: string;
  city: string;
  phone: string;
  email: string;
  url: string;
  website: string;
  websiteStatus: WebsiteStatus;
  about: string;
  source: string;
  status: LeadStatus;
  notes: string;
  aiSuggestion: string;
  created_at: string;
}

export type LeadInput = Omit<Lead, 'id' | 'created_at'>;

export type CoverageStatus = 'Not started' | 'Researching' | 'Covered';

export interface DistrictCoverage {
  id: string;
  state: string;
  district: string;
  status: CoverageStatus;
  target_leads: number;
  notes: string;
  created_at: string;
}

export interface DistrictSummary extends DistrictCoverage {
  leadCount: number;
}
