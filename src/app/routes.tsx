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
import { Performance } from "./pages/user/Performance";
import { Rankings } from "./pages/user/Rankings";
import { CurrentAffairs } from "./pages/user/CurrentAffairs";
import { DailyChallenge } from "./pages/user/DailyChallenge";
import { PreviousYearPapers } from "./pages/user/PreviousYearPapers";
import { LiveTestsList } from "./pages/user/LiveTestsList";
import { LiveTestLobby } from "./pages/user/LiveTestLobby";
import { LiveTestTake } from "./pages/user/LiveTestTake";
import { LiveTestResults } from "./pages/user/LiveTestResults";
import { CompetitionHelp } from "./pages/user/CompetitionHelp";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminUsers } from "./pages/admin/Users";
import { AdminTests } from "./pages/admin/Tests";
import { TestManagement } from "./pages/admin/TestManagement";
import { AdminQuestions } from "./pages/admin/Questions";
import { AdminCoupons } from "./pages/admin/Coupons";
import { AdminPreviousYearPapers } from "./pages/admin/PreviousYearPapers";
import { AdminSettings } from "./pages/admin/Settings";
import { AdminNotifications } from "./pages/admin/Notifications";
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
        path: "batch/:batchId/previous-year-papers",
        element: (<ProtectedRoute><PreviousYearPapers /></ProtectedRoute>),
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
      { path: "performance", element: (<ProtectedRoute><Performance /></ProtectedRoute>) },
      { path: "rankings", Component: Rankings },
      { path: "current-affairs", Component: CurrentAffairs },
      { path: "daily-challenge", element: (<ProtectedRoute><DailyChallenge /></ProtectedRoute>) },
      { path: "pricing", Component: Pricing },
      {
        path: "batch/:batchId/live-tests",
        element: (<ProtectedRoute><LiveTestsList /></ProtectedRoute>),
      },
      {
        path: "live-test/:liveTestId/lobby",
        element: (<ProtectedRoute><LiveTestLobby /></ProtectedRoute>),
      },
      {
        path: "live-test/:liveTestId/take",
        element: (<ProtectedRoute><LiveTestTake /></ProtectedRoute>),
      },
      {
        path: "live-test/:liveTestId/results",
        element: (<ProtectedRoute><LiveTestResults /></ProtectedRoute>),
      },
      {
        path: "competition-help",
        Component: CompetitionHelp,
      },
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
      { path: "previous-year-papers", Component: AdminPreviousYearPapers },
      { path: "settings", Component: AdminSettings },
      { path: "notifications", Component: AdminNotifications },
    ],
  },
]);
