import { LeadInput } from './lead.model';

export type ExtractionConfidence = 'high' | 'medium' | 'low';

export interface ExtractedLeadCandidate {
  sourceRow: string;
  confidence: ExtractionConfidence;
  reviewReasons: string[];
  fields: {
    name: string | null;
    industry: string | null;
    district: string | null;
    city: string | null;
    phone: string | null;
    email: string | null;
    url: string | null;
    website: string | null;
    websiteStatus: string;
    about: string | null;
    opportunity: string | null;
    otherDetails: string[];
  };
}

export interface LeadExtractionResponse {
  records: ExtractedLeadCandidate[];
  warnings: string[];
  model?: string;
}

export interface PasteLeadRow {
  rowNumber: number;
  sourceRow: string;
  confidence: ExtractionConfidence;
  reviewReasons: string[];
  lead: LeadInput;
  selected: boolean;
  duplicate: boolean;
}
