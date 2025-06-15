
import type { LoanInputValues, AmortizationEntry } from '../types';
import { THAI_MONTHS } from '../types';
import { addMonths, format, parse, getDate, getMonth, getYear, isValid } from 'date-fns';

const formatThaiDate = (date: Date): string => {
  const day = getDate(date);
  const month = THAI_MONTHS[getMonth(date)];
  const year = getYear(date) + 543; // Convert to Buddhist Era
  return `${day} ${month} ${year}`;
};

export const calculateAmortizationSchedule = (inputs: LoanInputValues): AmortizationEntry[] => {
  const { loanAmount, annualInterestRate, loanTermYears, paymentsPerYear, startDate, extraPayment } = inputs;

  if (loanAmount <= 0 || annualInterestRate < 0 || loanTermYears <= 0 || paymentsPerYear <= 0) {
    return []; // Invalid inputs
  }
  
  const parsedStartDate = parse(startDate, 'yyyy-MM-dd', new Date());
  if (!isValid(parsedStartDate)) {
    console.error("Invalid start date provided to calculator:", startDate);
    return []; // Invalid date format
  }

  const schedule: AmortizationEntry[] = [];
  
  const periodicInterestRate = (annualInterestRate / 100) / paymentsPerYear;
  const numberOfPayments = loanTermYears * paymentsPerYear;

  let scheduledPayment: number;
  if (periodicInterestRate === 0) {
    scheduledPayment = loanAmount / numberOfPayments;
  } else {
    scheduledPayment = loanAmount * (periodicInterestRate * Math.pow(1 + periodicInterestRate, numberOfPayments)) / (Math.pow(1 + periodicInterestRate, numberOfPayments) - 1);
  }
  
  scheduledPayment = parseFloat(scheduledPayment.toFixed(2));

  let remainingBalance = loanAmount;
  let cumulativeInterest = 0;
  let currentDate = parsedStartDate;

  for (let i = 1; i <= numberOfPayments && remainingBalance > 0.005; i++) { // Added check for remainingBalance to prevent near-zero loops
    const interestForPeriod = parseFloat((remainingBalance * periodicInterestRate).toFixed(2));
    
    let principalPaid = parseFloat((scheduledPayment - interestForPeriod).toFixed(2));
    const actualExtraPayment = extraPayment > 0 ? parseFloat(extraPayment.toFixed(2)) : 0;
    
    let totalCurrentPayment = scheduledPayment + actualExtraPayment;

    // Adjust if the standard payment (including extra) overpays the loan
    if (remainingBalance < totalCurrentPayment - interestForPeriod) {
        principalPaid = remainingBalance;
        totalCurrentPayment = principalPaid + interestForPeriod;
    } else {
        principalPaid += actualExtraPayment;
    }
    
    // Ensure principal does not exceed remaining balance, adjust total payment accordingly
    if (principalPaid > remainingBalance) {
        principalPaid = remainingBalance;
        // Total payment should be principal + interest for this period
        totalCurrentPayment = principalPaid + interestForPeriod;
    }
    
    const currentEndingBalance = parseFloat((remainingBalance - principalPaid).toFixed(2));
    cumulativeInterest = parseFloat((cumulativeInterest + interestForPeriod).toFixed(2));

    schedule.push({
      period: i,
      paymentDate: formatThaiDate(currentDate),
      startingBalance: parseFloat(remainingBalance.toFixed(2)),
      scheduledPayment: scheduledPayment, // This is the calculated regular payment, not necessarily what's paid if extra or final payment
      extraPayment: actualExtraPayment,
      totalPayment: parseFloat(totalCurrentPayment.toFixed(2)),
      principal: parseFloat(principalPaid.toFixed(2)),
      interest: parseFloat(interestForPeriod.toFixed(2)),
      endingBalance: Math.max(0, currentEndingBalance), // Ensure ending balance is not negative
      cumulativeInterest: cumulativeInterest,
    });

    remainingBalance = Math.max(0, currentEndingBalance);
    if (remainingBalance <= 0.005) { // Check for effectively zero balance
      remainingBalance = 0; // Set to 0 to terminate loop
      // If the last payment made the balance zero, check if it was the scheduled payment or less
      // This is to correct the last total payment if it was an overpayment.
      const lastEntry = schedule[schedule.length-1];
      if (lastEntry.startingBalance + lastEntry.interest < lastEntry.totalPayment) {
          lastEntry.totalPayment = parseFloat((lastEntry.startingBalance + lastEntry.interest).toFixed(2));
          lastEntry.principal = lastEntry.startingBalance; // All remaining balance is principal
          if (lastEntry.totalPayment < lastEntry.scheduledPayment + lastEntry.extraPayment ) {
             // if it was the last payment and total is less than what was planned (scheduled + extra)
             // it means the extra payment might not have been fully applied or scheduled payment was too high
             // The scheduledPayment field itself remains the theoretical one.
          }
      }
      break; 
    }
    
    const monthsToAdd = 12 / paymentsPerYear;
    currentDate = addMonths(currentDate, monthsToAdd);
  }

  return schedule;
};