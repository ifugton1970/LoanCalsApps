
import React from 'react';
import type { LoanInputValues } from '../types';
import { IconCalculator, IconXCircle, IconCurrencyDollar, IconChartBar, IconClock, IconCalendarDays, IconCalendar, IconPlusCircle } from '../constants';

interface LoanFormProps {
  initialValues: LoanInputValues;
  onCalculate: (values: LoanInputValues) => void;
  onClear: () => void;
}

const InputField: React.FC<{
  id: keyof LoanInputValues;
  label: string;
  type: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
  step?: string;
  placeholder?: string;
  unit?: string;
  required?: boolean;
  min?: string;
}> = ({ id, label, type, value, onChange, onBlur, icon, step, placeholder, unit, required, min }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
      <div className="flex items-center">
        {icon}
        <span className="ml-2">{label}</span>
      </div>
    </label>
    <div className="mt-1 flex rounded-md shadow-sm">
      <input
        type={type}
        name={id}
        id={id}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        step={step}
        placeholder={placeholder}
        required={required}
        className="focus:ring-teal-500 focus:border-teal-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300 p-2"
        aria-label={label}
        min={min}
      />
      {unit && (
        <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
          {unit}
        </span>
      )}
    </div>
  </div>
);


const LoanForm: React.FC<LoanFormProps> = ({ initialValues, onCalculate, onClear }) => {
  const [formState, setFormState] = React.useState<LoanInputValues>(initialValues);
  const [loanAmountDisplay, setLoanAmountDisplay] = React.useState<string>('');

  React.useEffect(() => {
    setFormState(initialValues);
    if (initialValues.loanAmount > 0) {
      setLoanAmountDisplay(initialValues.loanAmount.toLocaleString('en-US'));
    } else {
      setLoanAmountDisplay(''); // Handles 0 or cleared state effectively
    }
  }, [initialValues]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value: rawValue } = e.target;
    const fieldName = name as keyof LoanInputValues;

    if (fieldName === "loanAmount") {
      setLoanAmountDisplay(rawValue); // Keep raw input for display (allows typing commas, etc.)
      const numericValue = parseFloat(rawValue.replace(/,/g, ''));
      setFormState(prev => ({
        ...prev,
        loanAmount: isNaN(numericValue) ? 0 : numericValue, 
      }));
      return;
    }

    let processedValue: string | number;
    if (typeof formState[fieldName] === 'number') {
      processedValue = parseFloat(rawValue);
      if (isNaN(processedValue as number)) {
        processedValue = 0; 
      }
    } else {
      processedValue = rawValue;
    }

    setFormState(prev => ({
      ...prev,
      [fieldName]: processedValue,
    }));
  };
  
  const handleLoanAmountBlur = () => {
    const numericValue = parseFloat(loanAmountDisplay.replace(/,/g, ''));
    if (!isNaN(numericValue) && numericValue > 0) {
      setLoanAmountDisplay(numericValue.toLocaleString('en-US'));
    } else { 
      setLoanAmountDisplay(''); 
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure loanAmount from display is synced to formState before submitting
    // This is important if user types and directly clicks submit without blurring
    const currentLoanAmountNumeric = parseFloat(loanAmountDisplay.replace(/,/g, ''));
    const validatedFormState = {
        ...formState,
        loanAmount: isNaN(currentLoanAmountNumeric) ? 0 : currentLoanAmountNumeric,
    };
    onCalculate(validatedFormState);
  };

  const handleClear = () => {
    onClear(); // This will trigger props.initialValues to change, then useEffect updates local state
  };
  
  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-semibold text-teal-600 mb-6 text-center">กรอกข้อมูลพื้นฐานสำหรับการคำนวณ</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <InputField 
            id="loanAmount" 
            label="ยอดเงินกู้" 
            type="text" // Changed to text to allow comma formatting
            value={loanAmountDisplay} 
            onChange={handleFormChange} 
            onBlur={handleLoanAmountBlur}
            icon={IconCurrencyDollar} 
            unit="บาท" 
            placeholder="เช่น 1,000,000" 
            required 
        />
        <InputField 
            id="annualInterestRate" 
            label="อัตราดอกเบี้ยต่อปี" 
            type="number" 
            value={formState.annualInterestRate} 
            onChange={handleFormChange} 
            icon={IconChartBar} 
            unit="%" 
            step="0.01" 
            placeholder="เช่น 3.0" 
            required
            min="0"
        />
        <InputField 
            id="loanTermYears" 
            label="ระยะเวลากู้" 
            type="number" 
            value={formState.loanTermYears} 
            onChange={handleFormChange} 
            icon={IconClock} 
            unit="ปี" 
            placeholder="เช่น 5" 
            required 
            min="1"
        />
        <InputField 
            id="paymentsPerYear" 
            label="งวดต่อปี" 
            type="number" 
            value={formState.paymentsPerYear} 
            onChange={handleFormChange} 
            icon={IconCalendarDays} 
            placeholder="เช่น 12" 
            unit="ครั้ง" 
            required 
            min="1"
        />
        <InputField 
            id="startDate" 
            label="วันที่เริ่มงวดแรก" 
            type="date" 
            value={formState.startDate} 
            onChange={handleFormChange} 
            icon={IconCalendar} 
            required 
            placeholder="ปปปป-ดด-วว"
        />
        <InputField 
            id="extraPayment" 
            label="เงินจ่ายเพิ่ม/งวด" 
            type="number" 
            value={formState.extraPayment} 
            onChange={handleFormChange} 
            icon={IconPlusCircle} 
            unit="บาท" 
            placeholder="เช่น 0 หรือ 500" 
            required
            min="0"
        />
      </div>
      <div className="mt-8 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
        <button
          type="submit"
          className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          aria-label="คำนวณเงินกู้"
        >
          {IconCalculator}
          คำนวณ
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400"
          aria-label="ล้างค่าที่กรอก"
        >
          {IconXCircle}
          ล้างค่า
        </button>
      </div>
    </form>
  );
};

export default LoanForm;