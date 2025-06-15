
import React, { useState, useCallback } from 'react';
import LoanForm from './components/LoanForm';
import ResultsTable from './components/ResultsTable';
import type { LoanInputValues, AmortizationEntry } from './types';
import { calculateAmortizationSchedule } from './services/loanCalculator';
import { format, parse, isValid as isValidDateFn } from 'date-fns';

const App: React.FC = () => {
  const getDefaultStartDate = (): string => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    // Set to the first day of the next month
    const firstOfNextMonth = new Date(currentYear, currentMonth + 1, 1);
    return format(firstOfNextMonth, 'yyyy-MM-dd');
  };
  
  const defaultInitialValues: LoanInputValues = {
    loanAmount: 2000000,
    annualInterestRate: 3.0,
    loanTermYears: 5,
    paymentsPerYear: 12,
    startDate: getDefaultStartDate(),
    extraPayment: 0,
  };

  const emptyFormValues: LoanInputValues = {
    loanAmount: 0,
    annualInterestRate: 0,
    loanTermYears: 0,
    paymentsPerYear: 0, // Changed from 12 to 0 for consistency, placeholder will guide
    startDate: '', 
    extraPayment: 0,
  };

  const [inputValues, setInputValues] = useState<LoanInputValues>(defaultInitialValues);
  const [amortizationSchedule, setAmortizationSchedule] = useState<AmortizationEntry[]>([]);
  const [showError, setShowError] = useState<string | null>(null);

  const handleCalculate = useCallback((values: LoanInputValues) => {
    setInputValues(values); // Keep the form values as they were submitted for calculation
    setShowError(null);

    if (values.loanAmount <=0 || values.annualInterestRate < 0 || values.loanTermYears <=0 || values.paymentsPerYear <=0) {
        setShowError("กรุณากรอกข้อมูลเงินกู้, อัตราดอกเบี้ย, ระยะเวลา และจำนวนงวดให้ถูกต้อง (ค่าต้องมากกว่า 0 ยกเว้นดอกเบี้ยที่สามารถเป็น 0 ได้)");
        setAmortizationSchedule([]);
        return;
    }

    if (!values.startDate) { // Check if startDate is empty first
        setShowError("กรุณาระบุวันที่เริ่มงวดแรก");
        setAmortizationSchedule([]);
        return;
    }
    
    // Validate startDate format using date-fns
    const parsedDate = parse(values.startDate, 'yyyy-MM-dd', new Date());
    if (!isValidDateFn(parsedDate)) {
        setShowError("รูปแบบวันที่เริ่มงวดแรกไม่ถูกต้อง กรุณาใช้ YYYY-MM-DD หรือเลือกจากปฏิทิน");
        setAmortizationSchedule([]);
        return;
    }
    
    const schedule = calculateAmortizationSchedule(values);
    setAmortizationSchedule(schedule);
  }, []);

  const handleClear = useCallback(() => {
    setInputValues(emptyFormValues);
    setAmortizationSchedule([]);
    setShowError(null);
  }, []); // emptyFormValues is stable


  return (
    <div className="min-h-screen bg-gray-100 py-4 sm:py-8 px-2 sm:px-4 lg:px-8">
      <header className="bg-teal-600 p-4 sm:p-6 shadow-md rounded-t-lg">
        <h1 className="text-2xl sm:text-3xl font-bold text-white text-center">
          ตารางการชำระคืนเงินกู้
        </h1>
      </header>
      
      <main className="container mx-auto mt-0 sm:mt-2">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1">
             <LoanForm 
                initialValues={inputValues} 
                onCalculate={handleCalculate} 
                onClear={handleClear} 
            />
            <div className="mt-4 p-4 bg-white shadow-md rounded-lg text-sm text-gray-700">
                <h3 className="font-semibold text-teal-700 mb-2">วิธีใช้งาน:</h3>
                <ul className="list-disc list-inside space-y-1">
                    <li>กรอกรายละเอียดเงินกู้ เช่น ยอดเงิน, ดอกเบี้ย, ระยะเวลา</li>
                    <li>ระบุวันที่เริ่มผ่อนชำระงวดแรก (เลือกจากปฏิทิน หรือกรอกในรูปแบบ ปี ค.ศ.-เดือน-วัน เช่น 2024-12-01)</li>
                    <li>สามารถใส่ยอดจ่ายเพิ่มต่อเดือน (ถ้ามี)</li>
                    <li>กดปุ่ม "คำนวณ" เพื่อดูตารางผ่อนชำระ</li>
                    <li>กดปุ่ม "ล้างค่า" เพื่อเริ่มต้นใหม่ หรือแก้ไขข้อมูล</li>
                </ul>
            </div>
            <div className="mt-4 p-4 bg-white shadow-md rounded-lg text-sm text-gray-700">
                <h3 className="font-semibold text-teal-700 mb-2">ข้อควรทราบ:</h3>
                <p className="mb-2">
                    การคำนวณนี้เป็นเพียงการประมาณการเบื้องต้นเท่านั้น โปรดตรวจสอบรายละเอียดเงื่อนไข และอัตราดอกเบี้ยที่แน่นอนกับสถาบันการเงินที่คุณใช้บริการอีกครั้ง
                </p>
            </div>
             <div className="mt-4 p-4 bg-white shadow-md rounded-lg text-sm text-gray-700">
                <h3 className="font-semibold text-teal-700 mb-2">สูตรการคำนวณที่ใช้:</h3>
                <ul className="list-disc list-inside space-y-2">
                    <li>
                        <strong>ยอดผ่อนชำระต่องวด (Scheduled Payment):</strong>
                        <br />
                        <code className="text-xs">PMT = L * [r(1+r)^n] / [(1+r)^n - 1]</code>
                        <ul className="list-inside ml-4 text-xs">
                            <li>L = ยอดเงินกู้ (Loan Amount)</li>
                            <li>r = อัตราดอกเบี้ยต่องวด (Periodic Interest Rate) = อัตราดอกเบี้ยต่อปี / จำนวนงวดต่อปี</li>
                            <li>n = จำนวนงวดทั้งหมด (Total Number of Payments) = ระยะเวลากู้ (ปี) * จำนวนงวดต่อปี</li>
                        </ul>
                    </li>
                    <li>
                        <strong>ดอกเบี้ยต่องวด (Interest for Period):</strong>
                        <br />
                        <code className="text-xs">ยอดเงินต้นคงเหลือยกมา * อัตราดอกเบี้ยต่องวด</code>
                    </li>
                    <li>
                        <strong>เงินต้นที่ชำระต่องวด (Principal Paid):</strong>
                        <br />
                        <code className="text-xs">ยอดผ่อนชำระรวมต่องวด - ดอกเบี้ยต่องวด</code>
                    </li>
                    <li>
                        <strong>ยอดเงินคงเหลือปลายงวด (Ending Balance):</strong>
                        <br />
                        <code className="text-xs">ยอดเงินต้นคงเหลือยกมา - เงินต้นที่ชำระต่องวด</code>
                    </li>
                </ul>
            </div>


             {showError && (
              <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                <p className="font-semibold">เกิดข้อผิดพลาด:</p>
                <p>{showError}</p>
              </div>
            )}
            <div className="mt-6 p-4 bg-white shadow-lg rounded-lg items-center justify-center hidden xl:flex">
              <img src="https://siamhtml.com/wp-content/uploads/2016/04/man-thinking.png" alt="Financial Advisor" style={{width: '150px', height: '150px'}} className="rounded-full shadow-md"/>
              <p className="ml-4 text-gray-600 text-sm">วางแผนการเงินของคุณอย่างชาญฉลาด</p>
            </div>
          </div>

          <div className="xl:col-span-2">
            {amortizationSchedule.length > 0 ? (
              <ResultsTable data={amortizationSchedule} />
            ) : (
              !showError && (
                 <div className="mt-8 bg-white shadow-lg rounded-lg p-6 text-center text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto mb-4 text-teal-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 5.25 6h.008a2.25 2.25 0 0 1 2.242 2.15 2.25 2.25 0 0 0 2.25 2.25h3.832c.389 0 .744-.18.975-.47L19.5 6.75m0 0H18.75m0 0A2.25 2.25 0 0 1 16.5 9h-6.75M19.5 18v.75a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18.75V9A2.25 2.25 0 0 1 5.25 6.75h3.75m10.5 0a48.638 48.638 0 0 0-10.5 0" />
                    </svg>
                    <p>กรุณากรอกข้อมูลและกดปุ่ม "คำนวณ" เพื่อดูตารางการผ่อนชำระ</p>
                 </div>
              )
            )}
          </div>
        </div>
      </main>
      <footer className="text-center text-sm text-gray-500 py-6 mt-8">
        Loan Amortization Calculator &copy; {new Date().getFullYear()} โดย คนเลี้ยงแมวที่ Coding ได้นิดหน่อย | "การแบ่งปัน คืองานของเรา"
      </footer>
    </div>
  );
};

export default App;