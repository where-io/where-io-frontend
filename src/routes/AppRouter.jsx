import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext.jsx";
import { PopupProvider } from "../context/PopupContext.jsx";
import Home from "../pages/Home.jsx";
import Login from "../pages/Login.jsx";
import CollectionSidebar from "../features/sidebar/CollectionSidebar.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PopupProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teste"
              element={
                <ProtectedRoute>
                  <CollectionSidebar />
                </ProtectedRoute>
              }
            />
          </Routes>
        </PopupProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default AppRouter;
