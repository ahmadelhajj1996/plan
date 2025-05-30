import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
const Test = ({ workplan, empId , title , empName }) => {
  const {t} = useTranslation()
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

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${t('employee_shifts')} : ${empName} -  ${months[current]}`, 14, 20);

    const tableData = employeeShifts.map(shift => [
      shift.day,
      shift.shift == 'morning' ? 'F' : shift.shift == 'evening' ? 'S' : 'N'  ,
      
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['Day', 'Shift']],
      body: tableData,
    });

    doc.save(`${empName}_plannen`);
  };

  return (
    <div>
      <div
        onClick={downloadPDF}
      >
        {title}
      </div>
    </div>
  );
};

export default Test;


//    <Test workplan={plan} />
