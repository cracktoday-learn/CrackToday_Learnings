import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { Home } from "./pages/user/Home";
import { UserDashboard } from "./pages/user/Dashboard";
import { Exams } from "./pages/user/Exams";
import { Pricing } from "./pages/user/Pricing";
import { Profile } from "./pages/user/Profile";
import { TakeTest } from "./pages/user/TakeTest";
import { TestEvaluation } from "./pages/user/TestEvaluation";
import { Checkout } from "./pages/user/Checkout";
import { SubscriptionCheckout } from "./pages/user/SubscriptionCheckout";
import { Leaderboard } from "./pages/user/Leaderboard";
import { Rankings } from "./pages/user/Rankings";
import { CurrentAffairs } from "./pages/user/CurrentAffairs";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminUsers } from "./pages/admin/Users";
import { AdminTests } from "./pages/admin/Tests";
import { TestManagement } from "./pages/admin/TestManagement";
import { AdminQuestions } from "./pages/admin/Questions";
import { AdminCoupons } from "./pages/admin/Coupons";
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
        element: (<ProtectedRoute><UserDashboard /></ProtectedRoute>),
      },
      {
        path: "profile",
        element: (<ProtectedRoute><Profile /></ProtectedRoute>),
      },
      { path: "tests", Component: Exams },
      { path: "exams", Component: Exams },
      {
        path: "tests/:batchId/manage",
        element: (<AdminRoute><TestManagement /></AdminRoute>),
      },
      {
        path: "tests/:batchId/questions",
        element: (<AdminRoute><AdminQuestions /></AdminRoute>),
      },
      {
        path: "test/:batchId",
        element: (<ProtectedRoute><TakeTest /></ProtectedRoute>),
      },
      {
        path: "test/:batchId/evaluation/:testNumber",
        element: (<ProtectedRoute><TestEvaluation /></ProtectedRoute>),
      },
      {
        path: "checkout/:batchId",
        element: (<ProtectedRoute><Checkout /></ProtectedRoute>),
      },
      {
        path: "checkout/subscription/:planId",
        element: (<ProtectedRoute><SubscriptionCheckout /></ProtectedRoute>),
      },
      { path: "leaderboard", Component: Leaderboard },
      { path: "rankings", Component: Rankings },
      { path: "current-affairs", Component: CurrentAffairs },
      { path: "pricing", Component: Pricing },
      { path: "*", Component: Home },
    ],
  },
  { path: "/login", Component: Login },
  { path: "/signup", Component: Signup },
  {
    path: "admin",
    element: (<AdminRoute><AdminLayout /></AdminRoute>),
    children: [
      { index: true, Component: AdminDashboard },
      { path: "users", Component: AdminUsers },
      { path: "tests", Component: AdminTests },
      { path: "tests/:batchId/manage", Component: TestManagement },
      { path: "tests/:batchId/questions", Component: AdminQuestions },
      { path: "coupons", Component: AdminCoupons },
    ],
  },
]);
