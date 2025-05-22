/**
 * Campaign related type definitions
 */

export interface Campaign {
  id: string;
  title: string;
  description: string;
  goal: number;
  raised: number;
  creator: string;
  backers: number;
  deadline: string;
}

// Type definitions for campaign-related requests could be added here
export interface CreateCampaignRequest {
  title: string;
  description: string;
  goal: number;
  deadline: string;
}

export interface DonationRequest {
  amount: number;
  donorAddress?: string;
}
