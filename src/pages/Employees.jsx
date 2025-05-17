import { ref, set, get, child, remove, onValue } from 'firebase/database';
import { doc, updateDoc } from "firebase/firestore";

import db from '../firebaseConfig.js';
import { useEffect } from 'react';

import { Eye, Pencil, Trash2 } from "lucide-react";
import Modal from 'react-modal';
import { useState } from "react";
import axios from "axios";
import { Formik, Form, Field, ErrorMessage, FieldArray } from "formik";
import * as yup from "yup";
import { useTranslation } from "react-i18next";
import { useNavigate } from 'react-router-dom';
Modal.setAppElement('#root');
import Test from './Test.jsx';
const Employees = () => {
  const dbRef = ref(db);
  const [data, setData] = useState([])
  const [isOpen, setIsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { t } = useTranslation()
  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const navigate = useNavigate()

  useEffect(() => {
    const employeesRef = ref(db, 'employees');

    const unsubscribe = onValue(employeesRef, (snapshot) => {
      if (snapshot.exists()) {
        const employeesObject = snapshot.val();
        const employeesArray = Object.entries(employeesObject).map(([id, employee]) => ({
          id,
          ...employee,
        }));
        setData(employeesArray);
      } else {
        setData([]); // Clear if no data
        console.log("No data available");
      }
    }, (error) => {
      console.error("Error fetching employees:", error);
    });

    return () => unsubscribe();
  }, []);



  function PreferredShifts({ shifts }) {
    if (!shifts) return <div>{/* يمكنك عرض "No preferred shifts" مثلاً */}</div>;

    const shiftsArray = Array.isArray(shifts)
      ? shifts
      : Object.entries(shifts).map(([date, shift]) => ({ date, shift }));

    return (
      <div>
        <ul>
          {shiftsArray.map(({ date, shift }, index) => (
            <li key={index}>
              <strong>{date}:</strong> {shift}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  function PeriodWantedDays({ periods }) {
  if (!periods) return <div></div>;

  const periodsArray = Array.isArray(periods)
    ? periods
    : Object.entries(periods).map(([id, period]) => ({ id, ...period }));

  return (
    <div>
      <ul>
        {periodsArray.map(({ startDate, endDate, days }, index) => (
          <li key={index}>
            <strong>{startDate.slice(0 , 5)} - {endDate.slice(0 , 5)} =</strong>({days})
          </li>
        ))}
      </ul>
    </div>
  );
} 



const initialValues = employeeToEdit ? {
  name: employeeToEdit.name,
  maxDays: employeeToEdit.maxDays,
  want_night: employeeToEdit.want_night ? "1" : "0",
  preferredShifts: Array.isArray(employeeToEdit.preferredShifts) ? employeeToEdit.preferredShifts : [],
  periodWantedDays: Array.isArray(employeeToEdit.periodWantedDays) ? employeeToEdit.periodWantedDays : []
} : {
  name: '',
  maxDays: '',
  want_night: '',
  preferredShifts: [],
  periodWantedDays: []
};

const validationSchema = yup.object({
  name: yup.string().required('Please enter your first name'),
  maxDays: yup.string()
    .required('Required')
    .test('is-valid-day', 'Must be a number between 1 and 31', (value) => {
      const numericValue = Number(value);
      return !isNaN(numericValue) && numericValue >= 1 && numericValue <= 31;
    }),
  preferredShifts: yup.array().of(
    yup.object().shape({
      date: yup.string().required('Date is required'),
      shift: yup.string().required('Shift is required')
    })
  ),
  periodWantedDays: yup.array().of(
    yup.object().shape({
      startDate: yup.string().required('Start date is required'),
      endDate: yup.string().required('End date is required'),
      days: yup.string()
        .required('Days is required')
        .test('is-valid-day', 'Must be a number between 0 and 31', (value) => {
          const numericValue = Number(value);
          return !isNaN(numericValue) && numericValue >= 0 && numericValue <= 31;
        })
    })
  )
});
  const submit = async (values) => {
    try {
      const formattedValues = {
        ...values,
        // Add any formatting or validation if needed
      };

      if (employeeToEdit) {
        const index = data.findIndex(e => e.id === employeeToEdit.id);
        if (index !== -1) {
          const updatedData = [...data];
          updatedData[index] = { ...updatedData[index], ...values };
          set(ref(db, 'employees'), updatedData)

          setData(updatedData);
        }
      }
      else {
        const userId = data?.length + 1;
        const itemRef = ref(db, 'employees/' + userId);
        await set(itemRef, { id: userId, ...formattedValues });
      }

      setIsOpen(false);
      setEmployeeToEdit(null);
    }
    catch (error) {
      console.log(error)
    }
  };

  const handleDelete = async () => {
    try {

      const item = data?.find(e => e.id = employeeToDelete)
      set(ref(db, 'employees'), data.filter(e => e.id != item.id))
      setData(data.filter(e => e.id != item.id))
      setDeleteOpen(false)
    } catch (error) {
    }
  };

  const getDaysInMonth = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    });
  };

  const daysInMonth = getDaysInMonth();


  return (
    <>
      <div className=" -ms-32 me-32 mt-16 ">
        <div className="flex justify-between items-center pb-4">
          <button onClick={() => navigate('/plan')} className='w-[120px] bg-color'>{t('generate_plan')}</button>
          <div className=" text-4xl text-end text-rose-500 italic cursor-pointer" onClick={() => setIsOpen(true)}> + </div>
        </div>

        <Modal
          isOpen={isOpen}
          className='w-2/3 fixed top-24 start-1/4 bg-white p-4 border-[1px] border-gray-500'
        >
          <div className="flex justify-between items-center focus:rounded-none">
            <h2>{employeeToEdit ? t("edit_subject") : t("add_subject")}</h2>
            <span className="cursor-pointer text-2xl text-rose-600" onClick={() => {
              setIsOpen(false);
              setEmployeeToEdit(null);
            }}>x</span>
          </div>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={submit}
          >
            {(formik) => {
              return (
                <Form className="flex flex-col gap-y-2">
                  <div className="flex gap-x-4 ">
                    <div className="relative w-1/3">
                      <label>{t("name")}</label>
                      <Field name='name' type="text" placeholder="name" />
                      <ErrorMessage component="div" className="absolute text-red-500 text-xs/4 ps-2 " name="name" />
                    </div>
                    <div className="relative w-1/3">
                      <label>{t("maxDays")}</label>
                      <Field name='maxDays' type="text" placeholder="maxDays"
                        inputMode="numeric"
                        onInput={(e) => {
                          e.target.value = e.target.value.replace(/[^0-9]/g, '');
                        }}
                      />
                      <ErrorMessage component="div" className="absolute text-red-500 text-xs/4 ps-2 " name="maxDays" />
                    </div>

                    <div className="relative w-1/3">
                      <label>{t("want_night")}</label>
                      <Field as="select" name="want_night" type="text" className=" block w-full p-2  rounded-full border-[1px] border-gray-500">
                        <option value="">{t("want_night_shifts")} </option>
                        <option value="0">{t("no")}</option>
                        <option value="1">{t("yes")}</option>
                      </Field>
                      <ErrorMessage component="div" className="absolute text-red-500 text-xs/4 ps-2" name="want_night" />
                    </div>
                  </div>

                  <div className="w-full">
                    <FieldArray name="preferredShifts">
                      {({ push, remove }) => (
                        <div>
                          <div className="flex gap-x-2 items-center">
                            <h2>{t("preferredShifts")}</h2>
                            <button
                              type="button"
                              onClick={() => push({ date: '', shift: '' })}
                              className=" w-[40px] text-green-700 mb-4 p-1 bg-white  hover:bg-white hover:underline hover:underline-offset-2"
                            >
                              {t("add")}
                            </button>
                          </div>

                          <div className="-space-y-6 -mt-6">
                            {formik.values.preferredShifts.map((shift, index) => (
                              <div key={index} className="flex gap-x-4 items-center justify-center ">
                                <div className="relative flex-1">
                                  <label>{t("data")}</label>
                                  <Field
                                    name={`preferredShifts.${index}.date`}
                                    as="select"
                                    className="block w-full p-2 rounded-full border-[1px] border-gray-500"
                                  >
                                    <option value="">{t("select_date")}</option>
                                    {daysInMonth.map((date) => (
                                      <option key={date} value={date}>{date}</option>
                                    ))}
                                  </Field>
                                  <ErrorMessage
                                    component="div"
                                    className="absolute text-red-500 text-xs/4 ps-2"
                                    name={`preferredShifts.${index}.date`}
                                  />
                                </div>
                                <div className="relative flex-1  ">
                                  <label>{t("shift")}</label>
                                  <Field
                                    name={`preferredShifts.${index}.shift`}
                                    as="select"
                                    className="block w-full p-2 rounded-full border-[1px] border-gray-500"
                                  >
                                    <option value="">{t("select_shift")}</option>
                                    <option value="morning">{t("morning")}</option>
                                    <option value="afternoon">{t("evening")}</option>
                                    <option value="night">{t("night")}</option>
                                  </Field>
                                  <ErrorMessage
                                    component="div"
                                    className="absolute text-red-500 text-xs/4 ps-2"
                                    name={`preferredShifts.${index}.shift`}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  className="text-red-500 hover:underline hover:underline-offset-2   bg-white hover:bg-white  w-[100px] mt-10"
                                >
                                  {t("delete")}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </FieldArray>
                  </div>

                  <div className="w-full">
                    <FieldArray name="periodWantedDays">
                      {({ push, remove }) => (
                        <div>
                          <div className="flex gap-x-2 items-center">
                            <h2>{t("periodWantedDays")}</h2>
                            <button
                              type="button"
                              onClick={() => push({ startDate: '', endDate: '', days: '' })}
                              className="w-[40px] text-green-700 mb-4 p-1 bg-white hover:bg-white hover:underline hover:underline-offset-2"
                            >
                              {t("add")}
                            </button>
                          </div>

                          <div className="-space-y-6 -mt-6">
                            {formik.values.periodWantedDays?.map((period, index) => (
                              <div key={index} className="flex gap-x-4 items-center justify-center">
                                <div className="relative flex-1">
                                  <label>{t("startDate")}</label>
                                  <Field
                                    name={`periodWantedDays.${index}.startDate`}
                                    as="select"
                                    className="block w-full p-2 rounded-full border-[1px] border-gray-500"
                                  >
                                    <option value="">{t("select_date")}</option>
                                    {daysInMonth.map((date) => (
                                      <option key={date} value={date}>{date}</option>
                                    ))}
                                  </Field>
                                  <ErrorMessage
                                    component="div"
                                    className="absolute text-red-500 text-xs/4 ps-2"
                                    name={`periodWantedDays.${index}.startDate`}
                                  />
                                </div>
                                <div className="relative flex-1">
                                  <label>{t("endDate")}</label>
                                  <Field
                                    name={`periodWantedDays.${index}.endDate`}
                                    as="select"
                                    className="block w-full p-2 rounded-full border-[1px] border-gray-500"
                                  >
                                    <option value="">{t("select_date")}</option>
                                    {daysInMonth.map((date) => (
                                      <option key={date} value={date}>{date}</option>
                                    ))}
                                  </Field>
                                  <ErrorMessage
                                    component="div"
                                    className="absolute text-red-500 text-xs/4 ps-2"
                                    name={`periodWantedDays.${index}.endDate`}
                                  />
                                </div>
                                <div className="relative flex-1">
                                  <label>{t("days")}</label>
                                  <Field
                                    name={`periodWantedDays.${index}.days`}
                                    type="text"
                                    placeholder="Days"
                                    inputMode="numeric"
                                    onInput={(e) => {
                                      e.target.value = e.target.value.replace(/[^0-9]/g, '');
                                    }}
                                    className="block w-full p-2 rounded-full border-[1px] border-gray-500"
                                  />
                                  <ErrorMessage
                                    component="div"
                                    className="absolute text-red-500 text-xs/4 ps-2"
                                    name={`periodWantedDays.${index}.days`}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  className="text-red-500 hover:underline hover:underline-offset-2 bg-white hover:bg-white w-[100px] mt-10"
                                >
                                  {t("delete")}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </FieldArray>
                  </div>

                  <div className="flex gap-x-12 w-1/2 mx-auto pt-12">
                    <button
                      // disabled={isLoading}
                      className={` bg-color ${!formik.isValid ? '' : ''} flex items-center gap-2`}
                      type="submit"
                    >

                      {t("save")}
                    </button>
                    <button
                      className={` bg-color ${!formik.isValid ? '' : ''} flex items-center gap-2`}
                      type="button"
                      onClick={() => setIsOpen(false)}
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </Form>
              );
            }}
          </Formik>
        </Modal>

        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="grid grid-cols-7 w-full  gap-x-4  text-white bg-color  border-b font-medium ">
            <div className="p-4">{t("id")}</div>
            <div className="p-4">{t("name")}</div>
            <div className="p-4">{t("preferredShifts")}</div>
              <div className="p-4">{t("periodWantedDays")}</div>
            <div className="p-4">{t("maxDays")}</div>
            <div className="p-4">{t("want_night")}</div>
            <div className="p-4"> {t("operations")}</div>
          </div>

          {data?.map((employee, index) => (
            <div key={index} className="grid grid-cols-7 w-full gap-x-4 border-b bordered"

            >
              <div className="whitespace-nowrap px-6 py-4 font-medium">{employee.id}</div>
              <div className="whitespace-nowrap px-6 py-4">{employee.name}</div>
              <div className="whitespace-nowrap px-6 py-4">
                <PreferredShifts shifts={employee.preferredShifts} />
              </div>
                <div className="whitespace-nowrap px-6 py-4">
                  <PeriodWantedDays periods={employee.periodWantedDays} />
                </div>
              <div className="whitespace-nowrap px-6 py-4">{employee.maxDays}</div>
              <div className="whitespace-nowrap px-6 py-4">{employee.want_night ? "True" : "False"}</div>
              <div className="whitespace-nowrap px-6 py-4 flex gap-x-3 ">
                <Pencil
  className="cursor-pointer"
  onClick={() => {
    const preferredShifts = employee.preferredShifts;
    const periodWantedDays = employee.periodWantedDays;

    const formattedShifts = Array.isArray(preferredShifts)
      ? preferredShifts
      : preferredShifts && typeof preferredShifts === 'object'
        ? Object.entries(preferredShifts).map(([date, shift]) => ({
          date,
          shift,
        }))
        : [];

    const formattedPeriods = Array.isArray(periodWantedDays)
      ? periodWantedDays
      : periodWantedDays && typeof periodWantedDays === 'object'
        ? Object.entries(periodWantedDays).map(([id, period]) => ({
          ...period
        }))
        : [];

    setEmployeeToEdit({
      ...employee,
      preferredShifts: formattedShifts,
      periodWantedDays: formattedPeriods
    });

    setIsOpen(true);
  }}
/>
                <Trash2
                  className="cursor-pointer"
                  onClick={() => {
                    setEmployeeToDelete(employee.id);
                    setDeleteOpen(true);
                  }}
                />

              </div>
            </div>
          ))}
        </div>


        <Modal
          isOpen={deleteOpen}
          className='w-1/3 fixed top-24 start-1/3 bg-white p-4'
        >

          <div className="flex justify-between items-center focus:rounded-none">
            <h2> {t("delete_confirmation")} </h2>
            <span className="cursor-pointer text-2xl text-rose-600" onClick={() => {
              setDeleteOpen(false);
            }}>x</span>
          </div>
          <div className="mt-8 flex justify-between gap-x-8">
            <button className="bg-color hover:bg-color-hovered" onClick={handleDelete}>{t("yes")}</button>
            <button className="bg-color hover:bg-color-hovered" onClick={() => setDeleteOpen(false)}>{t("no")}</button>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default Employees;

// export function generateWorkPlan(employees, minEmployeesPerShift, monthIndex = new Date().getMonth()) {
//   // Get month details using monthIndex (0-11) instead of offset
//   const { allDays } = getCurrentMonthDetails(monthIndex);
//   const daysInMonth = allDays.length;

//   const workPlan = Array.from({ length: daysInMonth }, (_, i) => ({
//     dayName: allDays[i].name,
//     morning: [],
//     evening: [],
//     night: [],
//     reserves: [],
//   }));

//   // Tracking objects
//   const shiftCounts = {};
//   const daysOff = {};
//   const lastAssignedShift = {};
//   const weekendShifts = {}; // Track which weekends employees have worked
//   const nightShiftDays = {}; // Track days when employees worked night shifts

//   employees.forEach(employee => {
//     shiftCounts[employee.id] = 0;
//     daysOff[employee.id] = [];
//     lastAssignedShift[employee.id] = null;
//     weekendShifts[employee.id] = new Set();
//     nightShiftDays[employee.id] = [];
//   });

//   function isWeekend(day) {
//     return workPlan[day].dayName === "Saturday" || workPlan[day].dayName === "Sunday";
//   }

//   function getWeekendIdentifier(day) {
//     // Group Saturday and Sunday of the same weekend together
//     const date = new Date(allDays[day].date);
//     const sunday = new Date(date);
//     sunday.setDate(date.getDate() + (6 - date.getDay())); // Get the Sunday of this week
//     return sunday.toISOString().split('T')[0];
//   }

//   function isAssignedToAnyShift(employeeId, day) {
//     return (
//       workPlan[day].morning.some(e => e.id === employeeId) ||
//       workPlan[day].evening.some(e => e.id === employeeId) ||
//       workPlan[day].night.some(e => e.id === employeeId)
//     );
//   }

//   const periodConstraints = {};
//   const periodAssignedDays = {};

//   employees.forEach(employee => {
//     // ... existing initializations ...

//     // Initialize period constraints tracking
//     periodConstraints[employee.id] = [];
//     periodAssignedDays[employee.id] = [];

//     // Process periodWantedDays if they exist
//     if (employee.periodWantedDays && employee.periodWantedDays.length > 0) {
//       employee.periodWantedDays.forEach(period => {
//         const startDay = allDays.findIndex(d => d.date === period.startDate);
//         const endDay = allDays.findIndex(d => d.date === period.endDate);

//         if (startDay !== -1 && endDay !== -1 && startDay <= endDay) {
//           periodConstraints[employee.id].push({
//             startDay,
//             endDay,
//             requiredDays: parseInt(period.days) || 0
//           });
//         }
//       });
//     }
//   });

//   // Helper function to check if a day is in a restricted period
//   function isInRestrictedPeriod(employeeId, day) {
//     return periodConstraints[employeeId].some(period => {
//       return day >= period.startDay && day <= period.endDay;
//     });
//   }

//   // Helper function to check if assigning a shift would violate period constraints
//   function canAssignInPeriod(employeeId, day) {
//     const periods = periodConstraints[employeeId];
//     if (!periods || periods.length === 0) return true;

//     const relevantPeriod = periods.find(p => day >= p.startDay && day <= p.endDay);
//     if (!relevantPeriod) return true;

//     // Count how many days have been assigned in this period so far
//     const assignedInPeriod = periodAssignedDays[employeeId].filter(d =>
//       d >= relevantPeriod.startDay && d <= relevantPeriod.endDay
//     ).length;

//     return assignedInPeriod < relevantPeriod.requiredDays;
//   }

//   function assignShift(employee, day, shiftType, isProvision = false) {
//     if (isAssignedToAnyShift(employee.id, day)) return false;

//     if (isInRestrictedPeriod(employee.id, day) && !canAssignInPeriod(employee.id, day)) {
//       return false;
//     }

//     // Assign the shift
//     workPlan[day][shiftType].push({
//       id: employee.id,
//       name: employee.name,
//       provision: isProvision,
//     });
//     shiftCounts[employee.id]++;
//     lastAssignedShift[employee.id] = shiftType;

//     // Track period assignments
//     if (isInRestrictedPeriod(employee.id, day)) {
//       periodAssignedDays[employee.id].push(day);
//     }


//     // Check if this is a weekend day and employee has already worked this weekend
//     if (isWeekend(day)) {
//       const weekendId = getWeekendIdentifier(day);
//       if (weekendShifts[employee.id].has(weekendId)) {
//         return false;
//       }
//     }

//     // Check if employee has days off on this day (including after night shifts)
//     if (daysOff[employee.id].includes(day)) return false;

//     // Check night shift conditions
//     if (shiftType === "night") {
//       // Ensure employee is willing to work night shifts
//       if (!employee.want_night) return false;

//       // Ensure the next two days are not already assigned
//       if (day + 1 < daysInMonth && isAssignedToAnyShift(employee.id, day + 1)) return false;
//       if (day + 2 < daysInMonth && isAssignedToAnyShift(employee.id, day + 2)) return false;

//       // Ensure the next two days are not already days off for other reasons
//       if (daysOff[employee.id].includes(day + 1) || daysOff[employee.id].includes(day + 2)) {
//         return false;
//       }
//     }

//     // Assign the shift
//     workPlan[day][shiftType].push({
//       id: employee.id,
//       name: employee.name,
//       provision: isProvision,
//     });
//     shiftCounts[employee.id]++;
//     lastAssignedShift[employee.id] = shiftType;

//     // Handle night shift rules
//     if (shiftType === "night") {
//       // Mark the next two days as days off
//       if (day + 1 < daysInMonth) daysOff[employee.id].push(day + 1);
//       if (day + 2 < daysInMonth) daysOff[employee.id].push(day + 2);

//       // Track night shift days
//       nightShiftDays[employee.id].push(day);
//     }

//     // Track weekend shifts
//     if (isWeekend(day)) {
//       const weekendId = getWeekendIdentifier(day);
//       weekendShifts[employee.id].add(weekendId);
//     }

//     return true;
//   }

//   function getAvailableEmployees(day, shiftType, employees) {
//     return employees.filter(employee => {
//       if (isInRestrictedPeriod(employee.id, day)) {
//         if (!canAssignInPeriod(employee.id, day)) return false;
//       }
//       // Basic checks
//       if (shiftCounts[employee.id] >= employee.maxDays) return false;
//       if (isAssignedToAnyShift(employee.id, day)) return false;
//       if (daysOff[employee.id].includes(day)) return false;

//       // Night shift specific checks
//       if (shiftType === "night") {
//         if (!employee.want_night) return false;

//         // Check if the next two days are available
//         if (day + 1 < daysInMonth && isAssignedToAnyShift(employee.id, day + 1)) return false;
//         if (day + 2 < daysInMonth && isAssignedToAnyShift(employee.id, day + 2)) return false;
//         if (daysOff[employee.id].includes(day + 1) || daysOff[employee.id].includes(day + 2)) return false;
//       }

//       // Weekend checks
//       if (isWeekend(day)) {
//         const weekendId = getWeekendIdentifier(day);
//         if (weekendShifts[employee.id].has(weekendId)) return false;
//       }

//       return true;
//     }).sort((a, b) => {
//       // Prioritize employees with fewer shifts
//       if (shiftCounts[a.id] !== shiftCounts[b.id]) {
//         return shiftCounts[a.id] - shiftCounts[b.id];
//       }
//       // Then prioritize those who haven't worked recent night shifts
//       const aLastNight = nightShiftDays[a.id].length > 0 ?
//         Math.max(...nightShiftDays[a.id]) : -Infinity;
//       const bLastNight = nightShiftDays[b.id].length > 0 ?
//         Math.max(...nightShiftDays[b.id]) : -Infinity;
//       return aLastNight - bLastNight;
//     });
//   }

//   // First pass: Assign preferred shifts
//   employees.forEach(employee => {
//     if (employee.preferredShifts && employee.preferredShifts.length > 0) {
//       employee.preferredShifts.sort((a, b) => new Date(a.date) - new Date(b.date));

//       for (const pref of employee.preferredShifts) {
//         const shiftType = pref.shift.trim().toLowerCase();
//         const dayIndex = allDays.findIndex(d => d.date === pref.date);
//         if (dayIndex === -1 || shiftCounts[employee.id] >= employee.maxDays) continue;

//         assignShift(employee, dayIndex, shiftType);
//       }
//     }
//   });

//   // Second pass: Fill minimum required shifts
//   for (let day = 0; day < daysInMonth; day++) {
//     ["morning", "evening", "night"].forEach(shiftType => {
//       while (workPlan[day][shiftType].length < minEmployeesPerShift[shiftType]) {
//         const available = getAvailableEmployees(day, shiftType, employees);
//         if (available.length === 0) break;
//         assignShift(available[0], day, shiftType);
//       }
//     });
//   }

//   // Third pass: Distribute remaining shifts evenly
//   let remainingAttempts = 3; // Prevent infinite loops
//   while (remainingAttempts-- > 0) {
//     let assignedAny = false;

//     for (let day = 0; day < daysInMonth; day++) {
//       ["morning", "evening", "night"].forEach(shiftType => {
//         const available = getAvailableEmployees(day, shiftType, employees);
//         if (available.length > 0) {
//           if (assignShift(available[0], day, shiftType)) {
//             assignedAny = true;
//           }
//         }
//       });
//     }

//     if (!assignedAny) break;
//   }

//   // Final pass: Assign provision shifts to meet maxDays requirements
//   employees.forEach(employee => {
//     while (shiftCounts[employee.id] < employee.minDays) {
//       let assigned = false;

//       // Try to find days with existing shifts to minimize isolated shifts
//       for (let day = 0; day < daysInMonth; day++) {
//         if (isAssignedToAnyShift(employee.id, day) || daysOff[employee.id].includes(day)) continue;

//         // Prefer shifts adjacent to existing shifts
//         const adjacentShifts = [];
//         if (day > 0 && isAssignedToAnyShift(employee.id, day - 1)) adjacentShifts.push(day - 1);
//         if (day < daysInMonth - 1 && isAssignedToAnyShift(employee.id, day + 1)) adjacentShifts.push(day + 1);

//         if (adjacentShifts.length > 0) {
//           const shifts = ["morning", "evening", "night"].filter(shift => shift !== "night" || employee.want_night);
//           for (const shiftType of shifts) {
//             if (assignShift(employee, day, shiftType, true)) {
//               assigned = true;
//               break;
//             }
//           }
//           if (assigned) break;
//         }
//       }

//       // If no adjacent shifts found, assign anywhere
//       if (!assigned) {
//         for (let day = 0; day < daysInMonth; day++) {
//           if (isAssignedToAnyShift(employee.id, day) || daysOff[employee.id].includes(day)) continue;

//           const shifts = ["morning", "evening", "night"].filter(shift => shift !== "night" || employee.want_night);
//           for (const shiftType of shifts) {
//             if (assignShift(employee, day, shiftType, true)) {
//               assigned = true;
//               break;
//             }
//           }
//           if (assigned) break;
//         }
//       }

//       if (!assigned) break;
//     }
//   });

//   return { workPlan, shiftCounts, weekendShifts, nightShiftDays };
// }