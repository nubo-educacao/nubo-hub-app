export interface ImportantDate {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  type: string;
  created_at: string | null;
}
