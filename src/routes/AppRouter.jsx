import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "../pages/Home.jsx";
import CollectionSidebar from "../features/sidebar/CollectionSidebar.jsx";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/teste" element={<CollectionSidebar />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
