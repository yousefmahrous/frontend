export const RETURN_WINDOW_DAYS = 14;

export function isWithinReturnWindow(paidAt: string | null) {
  if (!paidAt) return false;
  const deadline = new Date(paidAt);
  deadline.setDate(deadline.getDate() + RETURN_WINDOW_DAYS);
  return new Date() <= deadline;
}