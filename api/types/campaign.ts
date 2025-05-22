// Campaign interface
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
