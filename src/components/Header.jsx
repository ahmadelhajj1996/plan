import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { CircleUser, Globe } from 'lucide-react';
import { useState, useRef } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { languages } from '../utils/constants';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { loggedOut, setLanguage } from '../store/reducer';

const Header = () => {

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { language } = localStorage.getItem('language') ? localStorage.getItem('language') : 'de'

  const { t } = useTranslation()
  const dropdownRef = useRef(null);
  const languageDropdownRef = useRef(null);

  const current = useSelector((state) => state.test.current);


  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const toggleLanguage = () => setLangOpen(!langOpen)


  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };
  const fun = (item) => {
    i18n.changeLanguage(item)
    dispatch(setLanguage(item));
    setLangOpen(false)
  }
  const logout = () => {
    dispatch(loggedOut())
    navigate('login')
  }
  return (
    <nav className="fixed  top-0 inset-x-0 h-16  bg-color  text-white z-50 px-4">

      <div className="relative container mx-auto flex justify-between pb-2 -pt-2 items-center">
        <div className="text-lg font-semibold"> {t("plan")} </div>
        <div className="flex gap-x-4 justify-center items-center -mt-2">
          <div className="relative" ref={languageDropdownRef}>
            <Globe
              onClick={toggleLanguage}
              size={24}
              className="cursor-pointer"
            />
            {langOpen && (
              <div
                onMouseLeave={() => setLangOpen(false)}
                className="absolute  -end-4 border-[2px] border-gray-500 bg-color cursor-pointer"
              >
                <ul className="flex flex-col divide-y divide-gray-500">
                  {languages.map((item) =>
                    <li key={item.code}>
                      <button
                        className={`bg-white hover:bg-color hover:text-white text-black my-0 rounded-none ${item.code === language ? 'bg-color text-white' : ''}`}
                        onClick={() => fun(item.code)}
                      >
                        {item.name}
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className=" bg-inherit hover:bg-red-500 text-xl border-none  text-white   z-50 w-[120px] p-2   ">
            {t('logout')} </button>
        </div>

      </div>

    </nav>
  );
};

export default Header;