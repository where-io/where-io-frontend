import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "../pages/Home.jsx";
import SavedPlacesSidebar from "../features/sidebar/SavedPlacesSidebar.jsx";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/teste" element={<SavedPlacesSidebar />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
