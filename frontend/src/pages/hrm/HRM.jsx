import React from "react";
import { Navigate } from "react-router-dom";
import { ROUTES } from "../../config/constants";

const HRM = () => {
  return <Navigate to={ROUTES.HRM_EMPLOYEES} replace />;
};

export default HRM; 