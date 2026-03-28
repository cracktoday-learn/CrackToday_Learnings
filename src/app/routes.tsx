import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { Home } from "./pages/user/Home";
import { UserDashboard } from "./pages/user/Dashboard";
import { Exams } from "./pages/user/Exams";
import { Pricing } from "./pages/user/Pricing";
import { Profile } from "./pages/user/Profile";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminUsers } from "./pages/admin/Users";
import { AdminTests } from "./pages/admin/Tests";
import { Login } from "./pages/auth/Login";
import { Signup } from "./pages/auth/Signup";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: MainLayout,
    children: [
      { index: true, Component: Home },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        ),
      },
      { path: "exams", Component: Exams },
      { path: "pricing", Component: Pricing },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      { path: "*", Component: Home },
    ],
  },
  { path: "/login", Component: Login },
  { path: "/signup", Component: Signup },
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, Component: AdminDashboard },
      { path: "users", Component: AdminUsers },
      { path: "tests", Component: AdminTests },
    ],
  },
]);
