import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../../config/constants';
import Employees from './Employees';
import Departments from './Departments';

const HRM = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={ROUTES.HRM_EMPLOYEES} replace />} />
      <Route path="/employees" element={<Employees />} />
      <Route path="/departments" element={<Departments />} />
    </Routes>
  );
};

export default HRM; 