import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem("token");

  // ❌ Not logged in → redirect
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // ✅ Logged in → allow
  return children;
};

export default ProtectedRoute;
