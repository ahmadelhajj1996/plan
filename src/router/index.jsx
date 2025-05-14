import { Routes, Route } from "react-router-dom"
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import Home from '../pages/Home'
import Test from '../pages/Test'
import Employees from '../pages/Employees'
import Plan from '../pages/Plan';
import Login from '../pages/Login';
import Details from '../pages/Details.jsx'
const Approutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Employees />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/details" element={<Details />} />
        <Route path="/test" element={<Test />} />
      </Route>
    </Routes>
  );
};

export default Approutes