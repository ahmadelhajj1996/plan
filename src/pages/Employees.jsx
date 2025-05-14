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


  const initialValues = employeeToEdit ? {
    name: employeeToEdit.name,
    maxDays: employeeToEdit.maxDays,
    want_night: employeeToEdit.want_night ? "1" : "0",
    preferredShifts: Array.isArray(employeeToEdit.preferredShifts) ? employeeToEdit.preferredShifts : []
  } : {
    name: '',
    maxDays: '',
    want_night: '',
    preferredShifts: []
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
          <button onClick={()=>navigate('/plan')} className='w-[120px] bg-color'>{t('generate_plan')}</button>
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
                    <div className="grid grid-cols-6 w-full  gap-x-16  text-white bg-color  border-b font-medium ">
          <div className="p-4">{t("id")}</div>
          <div className="p-4">{t("name")}</div>
          <div className="p-4">{t("preferredShifts")}</div>
          <div className="p-4">{t("maxDays")}</div>
          <div className="p-4">{t("want_night")}</div>
          <div className="p-4"> {t("operations")}</div>
        </div>

        {data?.map((employee , index) => (
          <div key={index} className="grid grid-cols-6 w-full gap-x-16 border-b bordered"
            
          >
            <div className="whitespace-nowrap px-6 py-4 font-medium">{employee.id}</div>
            <div className="whitespace-nowrap px-6 py-4">{employee.name}</div>
            <div className="whitespace-nowrap px-6 py-4">
              <PreferredShifts shifts={employee.preferredShifts} />
            </div>
            <div className="whitespace-nowrap px-6 py-4">{employee.maxDays}</div>
            <div className="whitespace-nowrap px-6 py-4">{employee.want_night ? "True" : "False"}</div>
            <div className="whitespace-nowrap px-6 py-4 flex gap-x-3 ">
              <Pencil
                className="cursor-pointer"
                onClick={() => {
                  const preferredShifts = employee.preferredShifts;

                  const formattedShifts = Array.isArray(preferredShifts)
                    ? preferredShifts
                    : preferredShifts && typeof preferredShifts === 'object'
                      ? Object.entries(preferredShifts).map(([date, shift]) => ({
                        date,
                        shift,
                      }))
                      : [];
                  setEmployeeToEdit(employee);

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