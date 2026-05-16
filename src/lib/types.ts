export type Role = "owner" | "member";

export type DashboardStats = {
  upcoming: number;
  dueSoon: number;
  overdue: number;
  paidThisMonth: number;
};
