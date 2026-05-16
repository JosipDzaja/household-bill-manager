export type Role = "owner" | "member";

export type DashboardStats = {
  upcoming: number;
  dueSoon: number;
  overdue: number;
  paidThisMonth: number;
};

export type ScannedBillData = {
  title: string | null;
  amount: number | null;
  currency: string | null;
  due_date: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
};

export type MemberOption = {
  id: string;
  user_id: string;
  full_name: string | null;
};

export type TagOption = {
  id: string;
  name: string;
};
