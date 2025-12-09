export type RAGDocumentType =
  | 'expense'
  | 'task'
  | 'conversation'
  | 'insight'
  | 'manual';

export interface RAGMetadata {
  id?: string;
  timestamp?: string;
  amount?: number;
  category?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  user_id?: string;
  [key: string]: unknown;
}

export interface RAGDocument {
  id: string;
  content: string;
  metadata?: RAGMetadata;
  doc_type: RAGDocumentType;
  semantic_similarity?: number;
  keyword_rank?: number;
  combined_score?: number;
}

export interface RAGSearchParams {
  query: string;
  house_id: string;
  match_count?: number;
  doc_type?: RAGDocumentType;
}

export interface AddDocumentParams {
  house_id: string;
  content: string;
  doc_type: RAGDocumentType;
  metadata?: RAGMetadata;
}

