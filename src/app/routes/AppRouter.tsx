import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AddCategory from "../../pages/categories/AddCategory";
import ClientsPage from "../../pages/clients/ClientsPage";
import HomePage from "../../pages/home/HomePage";
import AddProduct from "../../pages/products/AddProduct";
import CategoryPage from "../../pages/categories/CategoryPage";
import ProductPage from "../../pages/products/ProductPage";
import EditCategory from "../../pages/categories/EditCategory";
import EditProduct from "../../pages/products/EditProduct";
import LoginPage from "../../pages/login/LoginPage";
import AddStaff from "../../pages/staff/AddStaff";
import EditStaff from "../../pages/staff/EditStaff";
import StaffPage from "../../pages/staff/StaffPage";
import { AdminLayout } from "../layouts/AdminLayout";
import { useAuth } from "../providers/AuthProvider";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppRouter() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
          }
        />
        <Route element={<ProtectedRoute isAllowed={isAuthenticated} />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/staff" element={<StaffPage />}>
              <Route path="add" element={<AddStaff />} />
              <Route path="edit/:staffId" element={<EditStaff />} />
            </Route>
            <Route path="/category" element={<CategoryPage />}>
              <Route path="add" element={<AddCategory />} />
              <Route path="edit/:categoryId" element={<EditCategory />} />
            </Route>
            <Route path="/product" element={<ProductPage />}>
              <Route path="add" element={<AddProduct />} />
              <Route path="edit/:productId" element={<EditProduct />} />
            </Route>
            <Route path="/clients" element={<ClientsPage />} />
          </Route>
        </Route>
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
