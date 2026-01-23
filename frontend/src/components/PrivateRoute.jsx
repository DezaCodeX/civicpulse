import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  return localStorage.getItem("access")
    ? children
    : <Navigate to="/login" />;
};

export default PrivateRoute;
