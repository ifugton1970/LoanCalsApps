
import React from 'react';
import type { AmortizationEntry } from '../types';
import { IconArrowDownTray, IconDocumentText, IconEnvelope } from '../constants';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf'; // Original import
import 'jspdf-autotable'; // Ensure this is imported for the autoTable method

// Base64 encoded Kanit-Regular.ttf font (content is very long, so it's truncated here for brevity)
// In a real scenario, this would be the full base64 string.
// You can generate this using an online converter or a script:
// e.g. `cat Kanit-Regular.ttf | base64 -w 0 > kanit_base64.txt`
// IMPORTANT: Replace this placeholder with the actual full Base64 string of Kanit-Regular.ttf
const KANIT_REGULAR_BASE64 = "AAEAAAARAQAABAAQR0RFRgBsAAEAABAAAAAGEFFUUyUgAAAAAAEAAAOUAAAAHEdTVUIAgBUAAAEAAAE4AAAAPk9TLzIuPAAAAQAAAVgAAABgY21hcAWgC5IAAAHIAAAAsGN2dCAASAXYAAADTAAAACRmcGdtU5LAlgAAAvwAAAJIZ2FzcAAAABAAAAEUAAAACGdseWZ4O0UvAAAEqAAAPVRoZWFkIZqLdwAAFyAAAAA2aGhlYQ4EBNMAABcUAAAAJGhtdHgSAAAAAAAYIgAAAZ5sb2NhUmQBbQAAGDgAAAIobWF4cAEaAAsAABhYAAAAIG5hbWXoRmoWAAYZAABPcHBvc3QzNAKCAAAZWAAAANNwcmVwaGrx//UAAHcAAABzAAMAAAADAAAAAwAAAAEAAQAEAAMAAAADAAQAAQACAAIAAQABAAAAAAABAAAAAQAAFAAEAAAABAQCb//8AAwATAAUAAEoAAAAIAAAAAA=="; // This is a truncated placeholder.

// Updated interface:
// It extends the original jsPDF type and explicitly declares autoTable
// and other jsPDF methods that TypeScript was not recognizing.
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF; // autoTable typically returns the jsPDF instance

  // Explicitly declare methods from jsPDF that TypeScript might be missing
  // Their return type is `jsPDF` as they return the instance for chaining.
  addFileToVFS(name: string, data: string): jsPDF;
  addFont(postScriptName: string, id: string, fontStyle: string, fontWeight?: string | number, encoding?: string, isStandardFont?: boolean): jsPDF;
  setFont(fontName: string, fontStyle?: string, fontWeight?: string | number): jsPDF;
  setFontSize(size: number): jsPDF;
  text(text: string | string[], x: number, y: number, options?: any, transform?: any, angle?: number): jsPDF;
  save(filename?: string, options?: any): jsPDF;
}

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
  
  const tableData = data.map(row => [
    row.period,
    row.paymentDate,
    formatCurrency(row.startingBalance),
    formatCurrency(row.scheduledPayment),
    formatCurrency(row.extraPayment),
    formatCurrency(row.totalPayment),
    formatCurrency(row.principal),
    formatCurrency(row.interest),
    formatCurrency(row.endingBalance),
    formatCurrency(row.cumulativeInterest),
  ]);

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

  const handleExportPDF = () => {
    const doc = new jsPDF({ // Create instance of base jsPDF
      orientation: 'landscape',
    }) as jsPDFWithAutoTable; // Cast to our extended interface

    try {
        if (KANIT_REGULAR_BASE64.length > 100) { 
            doc.addFileToVFS('Kanit-Regular.ttf', KANIT_REGULAR_BASE64);
            doc.addFont('Kanit-Regular.ttf', 'Kanit', 'normal');
            doc.setFont('Kanit');
        } else {
            console.warn("Kanit font base64 data is a placeholder. PDF may not render Thai characters correctly.");
        }
    } catch (e) {
        console.error("Error embedding Kanit font:", e);
    }
    
    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: 20,
      styles: {
        font: 'Kanit', 
        fontSize: 8,
        cellPadding: 1, 
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [20, 150, 150], 
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 }, 
        1: { cellWidth: 35 }, 
        2: { halign: 'right', cellWidth: 30 }, 
        3: { halign: 'right', cellWidth: 25 }, 
        4: { halign: 'right', cellWidth: 20 }, 
        5: { halign: 'right', cellWidth: 25 }, 
        6: { halign: 'right', cellWidth: 25 }, 
        7: { halign: 'right', cellWidth: 20 }, 
        8: { halign: 'right', cellWidth: 30 }, 
        9: { halign: 'right', cellWidth: 25 }  
      },
      didDrawPage: (data) => {
        doc.setFontSize(16);
        doc.setFont('Kanit', 'bold');
        doc.text("ตารางการผ่อนชำระเงินกู้", data.settings.margin.left, 15);
      },
      margin: { top: 25 }
    });
    doc.save("AmortizationSchedule.pdf");
  };

  const handlePrepareEmail = () => {
    const subject = encodeURIComponent("ตารางผ่อนชำระเงินกู้");
    const body = encodeURIComponent(
      "เรียน ท่านผู้รับ,\n\n" +
      "กรุณาตรวจสอบตารางผ่อนชำระเงินกู้\n" +
      "คำแนะนำ: ท่านจำเป็นต้องดาวน์โหลดไฟล์ Excel หรือ PDF จากแอปพลิเคชันก่อน จากนั้นจึงแนบไฟล์ดังกล่าวกับอีเมลนี้ด้วยตนเอง\n\n" +
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
            onClick={handleExportPDF}
            className="flex items-center px-3 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400"
            aria-label="ส่งออกตารางผ่อนชำระเป็นไฟล์ PDF"
          >
            {IconDocumentText}
            ส่งออกเป็น PDF
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
