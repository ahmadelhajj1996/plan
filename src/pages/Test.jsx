import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { utils, writeFile } from 'xlsx';

const Test = ({ workplan, empId, title, empName }) => {
  const { t } = useTranslation();
  const current = useSelector((state) => state.test.current);
  const months = [
    t('January'), t('February'), t('March'), t('April'),
    t('May'), t('June'), t('July'), t('August'),
    t('September'), t('October'), t('November'), t('December')
  ];

  const getEmployeeShifts = (empId) => {
    const result = [];

    workplan.forEach((dayData, dayIndex) => {
      const day = dayIndex + 1;

      ['morning', 'evening', 'night'].forEach((shiftType) => {
        const shift = dayData[shiftType]?.find(emp => emp.id === empId);
        if (shift) {
          result.push({
            day,
            shift: shiftType,
          });
        }
      });
    });

    return result;
  };

  const downloadPDF = () => {
    const employeeShifts = getEmployeeShifts(empId);

    // Create a map of day to shift for easier processing
    const shiftMap = {};
    employeeShifts.forEach(shift => {
      shiftMap[shift.day] = shift.shift === 'morning' ? 'F' : 
                          shift.shift === 'evening' ? 'S' : 'N';
    });

    // Find the maximum day number to know how many columns we need
    const maxDay = employeeShifts.length > 0 ? 
      Math.max(...employeeShifts.map(shift => shift.day)) : 0;

    const doc = new jsPDF({
      orientation: maxDay > 10 ? 'landscape' : 'portrait'
    });
    doc.setFontSize(16);
    doc.text(`${t('employee_shifts')} : ${empName} For ${months[current]}`, 14, 20);

    // Split days into chunks of 10 days each
    const chunkSize = 10;
    const dayChunks = [];
    for (let i = 1; i <= maxDay; i += chunkSize) {
      dayChunks.push({
        startDay: i,
        endDay: Math.min(i + chunkSize - 1, maxDay)
      });
    }

    let startY = 30;
    
    dayChunks.forEach((chunk, index) => {
      const daysInChunk = chunk.endDay - chunk.startDay + 1;
      const daysRow = ['Day', ...Array.from({length: daysInChunk}, (_, i) => i + chunk.startDay)];
      const shiftsRow = ['Shift', ...Array.from({length: daysInChunk}, (_, i) => shiftMap[i + chunk.startDay] || '-')];

      autoTable(doc, {
        startY: startY,
        head: [daysRow],
        body: [shiftsRow],
        styles: {
          cellPadding: 4,
          overflow: 'linebreak',
          valign: 'middle',
          halign: 'center'
        },
        columnStyles: {
          0: {
            cellWidth: 20,
            fontStyle: 'bold',
            fillColor: [220, 220, 220]
          },
          '__WORKPLAN_DAY_COLUMN__': { 
            cellWidth: 10
          }
        },
        didParseCell: function(data) {
          if (data.column.index > 0) {
            data.cell.styles = Object.assign(
              data.cell.styles || {},
              { cellStyles: '__WORKPLAN_DAY_COLUMN__' }
            );
          }
        },
        margin: { left: 10 },
        tableWidth: 'auto',
        showHead: 'everyPage',
        pageBreak: 'auto',
        horizontalPageBreak: true
      });

      // Update startY for next table (add 20px spacing between tables)
      startY = doc.lastAutoTable.finalY + 20;
      
      // Add a page break if we're not on the last chunk and there's not enough space
      if (index < dayChunks.length - 1 && startY > doc.internal.pageSize.height - 30) {
        doc.addPage();
        startY = 20;
      }
    });

    doc.save(`${empName}_plannen`);
  };
   
const downloadExcel = () => {
    const employeeShifts = getEmployeeShifts(empId);
    const shiftMap = {};
    
    employeeShifts.forEach(shift => {
        shiftMap[shift.day] = shift.shift === 'morning' ? 'F' : 
                            shift.shift === 'evening' ? 'S' : 'N';
    });

    const maxDay = employeeShifts.length > 0 ? 
        Math.max(...employeeShifts.map(shift => shift.day)) : 0;

    // Prepare data for Excel (horizontal layout)
    const excelData = [
        ['Day', ...Array.from({ length: maxDay }, (_, i) => i + 1)], // Day row: Day, 1, 2, 3, ..., maxDay
        ['Shift', ...Array.from({ length: maxDay }, (_, i) => shiftMap[i + 1] || '-')] // Shift row: Shift, F/S/N, ...
    ];

    // Create worksheet
    const ws = utils.aoa_to_sheet(excelData);
    
    // Set column widths (adjust as needed)
    ws['!cols'] = Array(maxDay + 1).fill({ wch: 5 }); // Equal width for all columns

    // Create workbook
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Shifts");

    // Generate and download Excel file
    writeFile(wb, `${empName}_shifts_${months[current]}.xlsx`);
};
  return (
    <div className="flex gap-x-12 ms-32">
      <div onClick={downloadPDF}>
        PDF 
      </div>
       <div onClick={downloadExcel}>
         Excel
      </div>
    </div>
  );
};

export default Test;
