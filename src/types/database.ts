export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SpaceRole = 'owner' | 'partner' | 'member';
export type TransactionType = 'income' | 'expense';
export type TransactionSource = 'manual' | 'webhook' | 'ocr';
export type ValidationStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Space {
  id: string;
  name: string;
  currency: string;
  invite_code: string;
  webhook_token_hash: string;
  created_at: string;
  updated_at: string;
}

export interface SpaceMember {
  id: string;
  space_id: string;
  user_id: string;
  role: SpaceRole;
  nickname: string | null;
  joined_at: string;
  profile?: Profile;
}

export interface Category {
  id: string;
  space_id: string | null;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  is_system: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  space_id: string;
  user_id: string | null;
  category_id: string;
  type: TransactionType;
  amount: number;
  transaction_date: string;
  description: string | null;
  source: TransactionSource;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  profile?: Profile;
}

export interface PendingValidation {
  id: string;
  space_id: string;
  raw_text: string;
  source_app: string;
  parsed_amount: number | null;
  parsed_type: TransactionType;
  parsed_merchant: string | null;
  suggested_category_id: string | null;
  status: ValidationStatus;
  idempotency_hash: string;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  suggested_category?: Category;
}

export interface BankNotificationPayload {
  app: string; // package name or app name (e.g. "com.bca", "BCA", "GoPay", "com.shopee.id")
  title?: string;
  text: string;
  timestamp?: string | number;
}

export interface ParsedNotificationResult {
  sourceApp: string;
  amount: number;
  type: TransactionType;
  merchant: string | null;
  rawText: string;
  success: boolean;
}

export interface ReceiptEvaluation {
  id: string;
  space_id: string;
  user_id: string | null;
  raw_text: string;
  spatial_merchant: string | null;
  spatial_amount: number | null;
  spatial_latency_ms: number;
  llm_merchant: string | null;
  llm_amount: number | null;
  llm_latency_ms: number;
  llm_status: string;
  actual_merchant: string;
  actual_amount: number;
  created_at: string;
}

