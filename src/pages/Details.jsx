import { useEffect, useState } from 'react';
import { ref, get, child } from 'firebase/database';
import db from '../firebaseConfig.js';
import { generateWorkPlan, minEmployeesPerShift } from '../services/plan';
import Test from './Test.jsx';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

const Details = () => {
    const {t} =  useTranslation()
    const [data, setData] = useState([]);
    const [plan, setPlan] = useState([]);
    const dbRef = ref(db);
    const current = useSelector((state) => state.test.current);
  


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

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">{t('employee_shifts')}</h1>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="py-2 px-4 border-b w-[400px] ">{t('name')}</th>
                            <th className="py-2 px-4 border-b w-[400px]">{t('operations')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((employee , index) => (
                            <tr key={index} className="hover:bg-gray-50">
                                <td className="py-2 px-4 border-b w-[400px] text-center">{employee.name}</td>
                                <td className="py-2 px-4 border-b w-[400px] text-center cursor-pointer">
                                    <Test
                                        workplan={plan}
                                        empId={employee.id}
                                        title={t('download_plan')}
                                        empName={employee.name}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Details;


//    <Details workplan={plan} />