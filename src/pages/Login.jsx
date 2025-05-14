import { redirect, useNavigate } from "react-router-dom";
import {  useDispatch, useSelector } from "react-redux";
import { Formik, Form,  ErrorMessage, Field } from "formik";
import * as yup from 'yup'
import notify from "../utils/toast.js";
import { useTranslation } from "react-i18next";
import { authenticated } from "../store/reducer.js";

const Login = () => {
  const dispatch = useDispatch();
  const {t} =  useTranslation()
  const navigate = useNavigate()
  const initialValues = {
      email: '' , 
      password: ''
  }
  const validationSchema = yup.object({
    email: yup.string().email('must be email').required('is required'), 
    password : yup.string().required('required').min(8)
  });

  const login = (values) => {
      try {
          if(values.email == 'm@abozeid.com' && values.password == '12341234')
          {
            dispatch(authenticated())
            navigate('/')
            notify("Login Successfully!", 'success')
          }
            else
            notify("Username or password is incorrect !", 'error')          
      } catch (error) {
            console.log('error : ' , error )

      }
  }
    

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center -mt-20 mb-0" style={{ backgroundImage: "url('https://img.freepik.com/free-photo/team-young-specialist-doctors-standing-corridor-hospital_1303-21199.jpg?semt=ais_hybrid')" }}>
      <div className="bg-white bg-opacity-75 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">Hamburg Hospital WorkHours</h2>

        <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={login} 
                >
                    {(formik) => {
                        return (
                            <Form className="flex flex-col gap-y-4">
                                <div className="relative">
                                    <label>Email address: </label>
                                    <Field   name='email' type="text" placeholder="email" />
                                    <ErrorMessage component="div" className="absolute text-red-500 text-xs/4 ps-2 "  name="email" />    
                                </div>

                                <div className="relative">
                                    <label>Password:</label>
                                    <Field  name='password' type="password" placeholder="password" />
                                    <ErrorMessage component="div" className="absolute text-red-500 text-xs/4 ps-2 "  name="password" />    
                                </div>
                                <button 
                                  className={` bg-color  flex items-center gap-2`} 
                                  type="submit"
                                >
                                 {t('login')}
                                </button>
                            </Form>
                        )
                    }}
                </Formik>


      </div>
    </div>
  );
};

export default Login;


  


