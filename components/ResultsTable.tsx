import React from 'react';
import type { AmortizationEntry } from '../types';
import { IconArrowDownTray, IconEnvelope } from '../constants';
import * as XLSX from 'xlsx';

interface ResultsTableProps {
  data: AmortizationEntry[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ data }) => {
  if (data.length === 0) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const tableHeaders = ['งวด', 'วันที่จ่าย', 'เงินต้นคงเหลือยกมา', 'จ่ายตามกำหนด', 'จ่ายเพิ่ม', 'จ่ายรวม', 'ตัดเงินต้น', 'ดอกเบี้ย', 'เงินต้นคงเหลือ', 'ดอกเบี้ยสะสม'];
  
  const handleExportExcel = () => {
    const worksheetData = data.map(row => ({
      "งวด": row.period,
      "วันที่จ่าย": row.paymentDate,
      "เงินต้นคงเหลือยกมา": formatCurrency(row.startingBalance),
      "จ่ายตามกำหนด": formatCurrency(row.scheduledPayment),
      "จ่ายเพิ่ม": formatCurrency(row.extraPayment),
      "จ่ายรวม": formatCurrency(row.totalPayment),
      "ตัดเงินต้น": formatCurrency(row.principal),
      "ดอกเบี้ย": formatCurrency(row.interest),
      "เงินต้นคงเหลือ": formatCurrency(row.endingBalance),
      "ดอกเบี้ยสะสม": formatCurrency(row.cumulativeInterest),
    }));
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    worksheet['!cols'] = [
        { wch: 5 }, { wch: 18 }, { wch: 20 }, { wch: 15 }, { wch: 12 }, 
        { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 15 }
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ตารางผ่อนชำระ");
    XLSX.writeFile(workbook, "AmortizationSchedule.xlsx");
  };

  const handlePrepareEmail = () => {
    const subject = encodeURIComponent("ตารางผ่อนชำระเงินกู้");
    const body = encodeURIComponent(
      "เรียน ท่านผู้รับ,\n\n" +
      "กรุณาตรวจสอบตารางผ่อนชำระเงินกู้\n" +
      "คำแนะนำ: ท่านจำเป็นต้องดาวน์โหลดไฟล์ Excel จากแอปพลิเคชันก่อน จากนั้นจึงแนบไฟล์ดังกล่าวกับอีเมลนี้ด้วยตนเอง\n\n" +
      "สร้างโดย: แอปพลิเคชันคำนวณเงินกู้ (ThaiLoanCalc)\n\n" +
      "ขอแสดงความนับถือ"
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };


  return (
    <div className="mt-8 bg-white shadow-lg rounded-lg p-2 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 px-4 sm:px-0 gap-2">
        <h2 className="text-xl font-semibold text-gray-700">ตารางการผ่อนชำระ</h2>
        <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
          <button
            onClick={handleExportExcel}
            className="flex items-center px-3 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-400"
            aria-label="ส่งออกตารางผ่อนชำระเป็นไฟล์ Excel"
          >
            {IconArrowDownTray}
            ส่งออกเป็น Excel
          </button>
          <button
            onClick={handlePrepareEmail}
            className="flex items-center px-3 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
            aria-label="เตรียมอีเมลเพื่อส่งตารางผ่อนชำระ"
          >
            {IconEnvelope}
            เตรียมอีเมลเพื่อส่ง
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" aria-label="ตารางการผ่อนชำระเงินกู้">
          <thead className="bg-teal-600">
            <tr>
              {tableHeaders.map(header => (
                <th key={header} scope="col" className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={row.period} className={index % 2 === 0 ? 'bg-white' : 'bg-teal-50 hover:bg-teal-100'}>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{row.period}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{row.paymentDate}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-blue-600 font-medium text-right">{formatCurrency(row.startingBalance)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-red-600 font-medium text-right">{formatCurrency(row.scheduledPayment)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-red-600 font-medium text-right">{formatCurrency(row.extraPayment)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-red-600 font-medium text-right">{formatCurrency(row.totalPayment)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-right">{formatCurrency(row.principal)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-red-600 font-medium text-right">{formatCurrency(row.interest)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-blue-600 font-medium text-right">{formatCurrency(row.endingBalance)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-right">{formatCurrency(row.cumulativeInterest)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;