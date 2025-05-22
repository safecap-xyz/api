/**
 * Common API types used across different routes
 */

export interface ErrorResponse {
  error: string;
  details?: unknown;
  success?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Wallet related types
export interface CreateWalletRequest {
  type: string;
  name: string;
  network?: string;
}

// Image generation related types
export interface GenerateImageRequest {
  refImageUrl1: string;
  refImageUrl2: string;
  prompt: string;
  seed?: number;
  width?: number;
  height?: number;
  ref_res?: number;
  num_steps?: number;
  guidance?: number;
  true_cfg?: number;
  cfg_start_step?: number;
  cfg_end_step?: number;
  neg_prompt?: string;
  neg_guidance?: number;
  first_step_guidance?: number;
  ref_task1?: string;
  ref_task2?: string;
}

export interface GenerateImageResponse {
  data: string;
  success: boolean;
  metadata?: Record<string, unknown>;
}
