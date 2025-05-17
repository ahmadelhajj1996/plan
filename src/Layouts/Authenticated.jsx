import Header from "../components/Header"
import AppRoutes from "../router"
import { useSelector } from "react-redux";
import { useEffect } from "react";

function Authenticated() {

    const auth = useSelector((state) => state.test.auth);

    const language = useSelector((state) => state.test.language);
    useEffect(() => {
      if (language) {
        localStorage.setItem('language', language);
      }
    }, [language]);
  

  return (
    <>
        {
          auth === 1 && 
            <Header />
        }
        <div className="mt-16">
            <AppRoutes />      
        </div>    
    </>
  )
}

export default Authenticated