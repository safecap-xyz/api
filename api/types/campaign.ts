// Campaign Types
export interface Campaign {
  id: string;
  title: string;
  description: string;
  goal: number;
  raised: number;
  creator: string;
  backers: number;
  deadline: string;
  imageUrl?: string;
  category?: string;
  status?: 'active' | 'completed' | 'failed' | 'canceled';
  rewards?: Array<{
    id: string;
    title: string;
    description: string;
    amount: number;
    deliveryDate: string;
    estimatedDelivery: string;
    backers?: number;
    limit?: number;
  }>;
  updates?: Array<{
    id: string;
    title: string;
    content: string;
    publishedAt: string;
    author: string;
  }>;
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
  risksAndChallenges?: string;
  story?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignCreateRequest {
  title: string;
  description: string;
  goal: number;
  deadline: string;
  imageUrl?: string;
  category?: string;
  rewards?: Array<{
    title: string;
    description: string;
    amount: number;
    estimatedDelivery: string;
    limit?: number;
  }>;
  risksAndChallenges?: string;
  story?: string;
}

export interface CampaignUpdateRequest {
  title?: string;
  description?: string;
  goal?: number;
  deadline?: string;
  imageUrl?: string;
  status?: 'active' | 'completed' | 'failed' | 'canceled';
  risksAndChallenges?: string;
  story?: string;
}

export interface CampaignListResponse {
  data: Campaign[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface CampaignResponse {
  data: Campaign;
  success: boolean;
  message?: string;
}

export interface CampaignError {
  error: string;
  message: string;
  statusCode: number;
  details?: any;
}
