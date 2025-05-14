import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { generateWorkPlan, minEmployeesPerShift, deleteEmployeeFromShift } from '../services/plan'; // getEmployeeSchedule 
import { useState, useRef } from 'react';
import db from '../firebaseConfig.js';
import { push, set, ref, get, child } from 'firebase/database';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Test from './Test.jsx';
import { useNavigate } from 'react-router-dom'
import { getCurrentMonthDetails } from '../utils/helpers.js'
import notify from '../utils/toast.js';
import { useDispatch , useSelector } from 'react-redux';
import { setCurrent } from '../store/reducer.js';
const Plan = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [plan, setPlan] = useState([]);
  const { t } = useTranslation();
  const dbRef = ref(db);


  const current = useSelector((state) => state.test.current);


  const  dispatch  = useDispatch()  
  // Generate month options for the select input
  const months = [
    t('January'), t('February'), t('March'), t('April'),
    t('May'), t('June'), t('July'), t('August'),
    t('September'), t('October'), t('November'), t('December')
  ];

  useEffect(() => {
    get(child(dbRef, 'employees'))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const rawData = snapshot.val();
          const employees = rawData.map((item) => ({
            ...item,
            provision: false,
          }));

          setData(employees);
          generatePlan(employees, current);
        } else {
          console.log("No data available");
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  // Effect to regenerate plan when month changes
  useEffect(() => {
    if (data.length > 0) {
      generatePlan(data, current);
    }
  }, [current, data]);

  const generatePlan = (employees, monthIndex) => {
    const { workPlan } = generateWorkPlan(employees, minEmployeesPerShift, monthIndex);
    setPlan(workPlan);
  };

  const handleMonthChange = (e) => {
    // setMonth();
    notify( t('changed') ,  'success')
    dispatch(setCurrent(parseInt(e.target.value)))
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    const headers = [
      { title: "Day", dataKey: "day" },
      { title: "Morning", dataKey: "morning" },
      { title: "Evening", dataKey: "evening" },
      { title: "Night", dataKey: "night" }
    ];

    const pdfData = plan.map((dayShifts, index) => {
      return {
        day: index + 1,
        morning: dayShifts.morning.map(emp =>
          `${emp.name}${dayShifts.morning.indexOf(emp) >= minEmployeesPerShift.morning ? ` ${t("provision")}` : ''}`
        ).join('\n'),
        evening: dayShifts.evening.map(emp =>
          `${emp.name}${dayShifts.evening.indexOf(emp) >= minEmployeesPerShift.evening ? ` ${t("provision")}` : ''}`
        ).join('\n'),
        night: dayShifts.night.map(emp =>
          `${emp.name}${dayShifts.night.indexOf(emp) >= minEmployeesPerShift.night ? ` ${t("provision")}` : ''}`
        ).join('\n')
      };
    });

    autoTable(doc, {
      head: [headers.map(header => header.title)],
      body: pdfData.map(row => [
        row.day,
        row.morning,
        row.evening,
        row.night
      ]),
      styles: {
        cellPadding: 5,
        fontSize: 10,
        valign: 'top',
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 60 },
        2: { cellWidth: 60 },
        3: { cellWidth: 50 }
      },
      margin: { top: 25 },
      startY: 25,
      pageBreak: 'auto',
      tableWidth: 'wrap',
      willDrawPage: (data) => {
        doc.setTextColor(40);
        doc.setFontSize(20);
        doc.text(`${t('plan')} \  ${months[current]} ${t('month')}`, 8, 16);
        doc.setFontSize(12);
        // doc.text(`Month: ${months[month]}`, 8, 25);
      },
      didDrawPage: (data) => {
        data.settings.margin.top = 20;
      },
      rowPageBreak: 'avoid'
    });

    doc.save(`work_plan_${months[current]}.pdf`);
  };

  return (
    <>
      <div className="flex  items-center gap-x-[200px] mb-4">
        {/* <div className="flex items-center "> */}
        <button
          onClick={() => navigate('/details')}
          className="bg-color border-none w-48"
        >
          {t('details')}
        </button>
        <div className="w-[48]">
          <select
            value={current}
            onChange={handleMonthChange}
            className="p-2 border rounded "
          >
            {months.map((monthName, index) => (
              <option key={index} value={index}>
                {monthName}
              </option>
            ))}
          </select>
        </div>

        {/* </div> */}

        <button
          onClick={generatePDF}
          className="bg-color border-none w-48"
        >
          {t('download_plan')}
        </button>
      </div>

      <div className="h-screen overflow-auto mt-16 fixed top-16 inset-x-32">
        <div className="w-full flex p-2 bg-color text-white">
          <div className="w-[120px] border p-2">{t("day")}</div>
          <div className="w-[475px] border p-2">{t("morning")}</div>
          <div className="w-[475px] border p-2">{t("evening")}</div>
          <div className="w-[380px] border p-2">{t("night")}</div>
        </div>

        {plan.map((dayShifts, index) => (
          <div key={index} className="w-full flex p-1 mt-6">
            <div className="w-[120px] border p-2">{index + 1}</div>
            <div className="w-[475px] border p-2">
              {dayShifts.morning.map((emp, idx) => (
                <div key={`${emp.id}-${idx}`} className="flex justify-between items-center">
                  <span>
                    {emp.name} {idx >= minEmployeesPerShift.morning ? ` ${t("provision")} ` : ''}
                  </span>
                  <button
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 w-[50px]"
                    onClick={() => deleteEmployeeFromShift(
                      index,
                      'morning',
                      emp.id,
                      workPlan,
                      setPlan,
                      minEmployeesPerShift
                    )}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="w-[475px] border p-2">
              {dayShifts.evening.map((emp, idx) => (
                <div key={`${emp.id}-${idx}`} className="flex justify-between items-center">
                  <span>
                    {emp.name} {idx >= minEmployeesPerShift.evening ? ` ${t("provision")} ` : ''}
                  </span>
                  <button
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 w-[50px]"
                    onClick={() => deleteEmployeeFromShift(
                      index,
                      'evening',
                      emp.id,
                      workPlan,
                      setPlan,
                      minEmployeesPerShift
                    )}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="w-[380px] border p-2">
              {dayShifts.night.map((emp, idx) => (
                <div key={`${emp.id}-${idx}`} className="flex justify-between items-center">
                  <span>
                    {emp.name} {idx >= minEmployeesPerShift.night ? ` ${t("provision")} ` : ''}
                  </span>
                  <button
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 w-[50px]"
                    onClick={() => deleteEmployeeFromShift(
                      index,
                      'night',
                      emp.id,
                      workPlan,
                      setPlan,
                      minEmployeesPerShift
                    )}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Plan;