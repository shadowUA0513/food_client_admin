import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AddCategory from "../../pages/company-details/AddCategory";
import AddProduct from "../../pages/company-details/AddProduct";
import CompanyCategoryPage from "../../pages/company-details/CompanyCategoryPage";
import CompanyDetailsPage from "../../pages/company-details/CompanyDetailsPage";
import CompanyProductPage from "../../pages/company-details/CompanyProductPage";
import EditCategory from "../../pages/company-details/EditCategory";
import EditProduct from "../../pages/company-details/EditProduct";
import LoginPage from "../../pages/login/LoginPage";
import { useAuth } from "../providers/AuthProvider";
import { ProtectedRoute } from "./ProtectedRoute";

const DEFAULT_COMPANY_ID =
  import.meta.env.VITE_DEFAULT_COMPANY_ID?.trim() || "1";

export function AppRouter() {
  const { isAuthenticated, company } = useAuth();
  const currentCompanyId = company?.id || DEFAULT_COMPANY_ID;

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
          <Route path="/companies/:companyId" element={<CompanyDetailsPage />}>
            <Route index element={<Navigate to="category" replace />} />
            <Route path="category" element={<CompanyCategoryPage />}>
              <Route path="add-category" element={<AddCategory />} />
              <Route path="edit/:categoryId" element={<EditCategory />} />
            </Route>
            <Route path="product" element={<CompanyProductPage />}>
              <Route path="add-product" element={<AddProduct />} />
              <Route path="edit/:productId" element={<EditProduct />} />
            </Route>
          </Route>
          <Route
            path="/"
            element={
              <Navigate
                to={`/companies/${currentCompanyId}/category`}
                replace
              />
            }
          />
        </Route>
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
