import { Navigate , Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux';

const UnauthenticatedRoute = () => {
  const auth = useSelector((state) => state.test.auth);
  return !auth ? <Outlet /> : <Navigate to="/" />;
}

export default UnauthenticatedRoute;