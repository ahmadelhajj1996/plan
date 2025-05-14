import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux';
const ProtectedRoute = () => {

  const auth = useSelector((state) => state.test.auth);
  return auth ? <div className="fixed start-64 top-16"><Outlet /> </div>  : <Navigate to="/login" />

}

export default ProtectedRoute