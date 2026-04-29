import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import type { ReactElement } from "react";
import AddCategory from "../../pages/categories/AddCategory";
import ClientsPage from "../../pages/clients/ClientsPage";

import AddPartner from "../../pages/partners/AddPartner";
import EditPartner from "../../pages/partners/EditPartner";
import PartnersPage from "../../pages/partners/PartnersPage";
import AddProduct from "../../pages/products/AddProduct";
import CategoryPage from "../../pages/categories/CategoryPage";
import KitchenPartnerOrdersPage from "../../pages/kitchen/KitchenPartnerOrdersPage";
import KitchenPage from "../../pages/kitchen/KitchenPage";
import OrderHistoryPage from "../../pages/kitchen/OrderHistoryPage";
import ProductPage from "../../pages/products/ProductPage";
import EditCategory from "../../pages/categories/EditCategory";
import EditProduct from "../../pages/products/EditProduct";
import LoginPage from "../../pages/login/LoginPage";
import AddStaff from "../../pages/staff/AddStaff";
import EditStaff from "../../pages/staff/EditStaff";
import StaffPage from "../../pages/staff/StaffPage";
import WorkingHoursPage from "../../pages/working-hours/WorkingHoursPage";
import { AdminLayout } from "../layouts/AdminLayout";
import { useAuth } from "../providers/AuthProvider";
import { ProtectedRoute } from "./ProtectedRoute";
import DashboardPage from "../../pages/dashboard/DashboardPage";
import CreateOrderPage from "../../pages/orders/CreateOrderPage";
import { isKitchenOnlyRole } from "../../utils/auth";

export function AppRouter() {
  const { isAuthenticated, user } = useAuth();
  const isKitchenOnlyUser = isKitchenOnlyRole(user?.role);
  const defaultRoute = isKitchenOnlyUser ? "/kitchen" : "/";
  const nonKitchenElement = (element: ReactElement) =>
    isKitchenOnlyUser ? <Navigate to="/kitchen" replace /> : element;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to={defaultRoute} replace /> : <LoginPage />
          }
        />
        <Route element={<ProtectedRoute isAllowed={isAuthenticated} />}>
          <Route element={<AdminLayout />}>
            <Route
              path="/"
              element={
                isKitchenOnlyUser ? <Navigate to="/kitchen" replace /> : <DashboardPage />
              }
            />
            <Route path="/partners" element={nonKitchenElement(<PartnersPage />)}>
              <Route path="add" element={nonKitchenElement(<AddPartner />)} />
              <Route
                path="edit/:partnerId"
                element={nonKitchenElement(<EditPartner />)}
              />
            </Route>
            <Route path="/staff" element={nonKitchenElement(<StaffPage />)}>
              <Route path="add" element={nonKitchenElement(<AddStaff />)} />
              <Route path="edit/:staffId" element={nonKitchenElement(<EditStaff />)} />
            </Route>
            <Route path="/category" element={nonKitchenElement(<CategoryPage />)}>
              <Route path="add" element={nonKitchenElement(<AddCategory />)} />
              <Route
                path="edit/:categoryId"
                element={nonKitchenElement(<EditCategory />)}
              />
            </Route>
            <Route path="/product" element={nonKitchenElement(<ProductPage />)}>
              <Route path="add" element={nonKitchenElement(<AddProduct />)} />
              <Route
                path="edit/:productId"
                element={nonKitchenElement(<EditProduct />)}
              />
            </Route>
            <Route
              path="/create-order"
              element={nonKitchenElement(<CreateOrderPage />)}
            />
            <Route path="/clients" element={nonKitchenElement(<ClientsPage />)} />
            <Route
              path="/working-hours"
              element={nonKitchenElement(<WorkingHoursPage />)}
            />
            <Route
              path="/order-history"
              element={nonKitchenElement(<OrderHistoryPage />)}
            />
            <Route path="/kitchen">
              <Route index element={<KitchenPage />} />
              <Route path=":partnerId" element={<KitchenPartnerOrdersPage />} />
            </Route>
          </Route>
        </Route>
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? defaultRoute : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
