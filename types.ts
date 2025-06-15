
export interface LoanInputValues {
  loanAmount: number;
  annualInterestRate: number;
  loanTermYears: number;
  paymentsPerYear: number;
  startDate: string; // YYYY-MM-DD
  extraPayment: number;
}

export interface AmortizationEntry {
  period: number;
  paymentDate: string; // Formatted date string
  startingBalance: number;
  scheduledPayment: number;
  extraPayment: number;
  totalPayment: number;
  principal: number;
  interest: number;
  endingBalance: number;
  cumulativeInterest: number;
}

export const THAI_MONTHS: string[] = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];
    