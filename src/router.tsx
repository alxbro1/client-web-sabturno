import { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthLayout } from "@/shell/AuthLayout";
import { ProtectedShell } from "@/shell/ProtectedShell";
import { RootRedirect } from "@/shell/RootRedirect";

const LoginPage = lazy(() => import("@/pages/LoginPage").then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import("@/pages/RegisterPage").then((module) => ({ default: module.RegisterPage })));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage").then((module) => ({ default: module.ForgotPasswordPage })));
const HomePage = lazy(() => import("@/pages/HomePage").then((module) => ({ default: module.HomePage })));
const SelectLocalPage = lazy(() => import("@/pages/SelectLocalPage").then((module) => ({ default: module.SelectLocalPage })));
const SelectServicePage = lazy(() => import("@/pages/SelectServicePage").then((module) => ({ default: module.SelectServicePage })));
const SelectSlotPage = lazy(() => import("@/pages/SelectSlotPage").then((module) => ({ default: module.SelectSlotPage })));
const SelectPaymentPage = lazy(() => import("@/pages/SelectPaymentPage").then((module) => ({ default: module.SelectPaymentPage })));
const PaymentStatusPage = lazy(() => import("@/pages/PaymentStatusPage").then((module) => ({ default: module.PaymentStatusPage })));
const AppointmentResultPage = lazy(() => import("@/pages/AppointmentResultPage").then((module) => ({ default: module.AppointmentResultPage })));
const AppointmentsPage = lazy(() => import("@/pages/AppointmentsPage").then((module) => ({ default: module.AppointmentsPage })));
const ProfilePage = lazy(() => import("@/pages/ProfilePage").then((module) => ({ default: module.ProfilePage })));
const ProfilePaymentsPage = lazy(() => import("@/pages/ProfilePaymentsPage").then((module) => ({ default: module.ProfilePaymentsPage })));
const EditProfilePage = lazy(() => import("@/pages/EditProfilePage").then((module) => ({ default: module.EditProfilePage })));

const AppointmentPublicPage = lazy(() => import("@/pages/AppointmentPublicPage").then((module) => ({ default: module.AppointmentPublicPage })));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage })));

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<div className="centered-loader">Cargando...</div>}>{element}</Suspense>;
}

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <RootRedirect />,
    },
    {
      element: <AuthLayout />,
      children: [
        { path: "/login", element: withSuspense(<LoginPage />) },
        { path: "/register", element: withSuspense(<RegisterPage />) },
        { path: "/forgot-password", element: withSuspense(<ForgotPasswordPage />) },
      ],
    },
    {
      element: <ProtectedShell />,
      children: [
        { path: "/home", element: withSuspense(<HomePage />) },
        { path: "/appointments", element: withSuspense(<AppointmentsPage />) },
        { path: "/profile", element: withSuspense(<ProfilePage />) },
        { path: "/payments", element: withSuspense(<ProfilePaymentsPage />) },
        { path: "/profile/edit", element: withSuspense(<EditProfilePage />) },
      ],
    },
    {
      children: [
        { path: "/booking", element: <Navigate to="/booking/select-local" replace /> },
        { path: "/booking/select-local", element: withSuspense(<SelectLocalPage />) },
        { path: "/booking/select-service", element: withSuspense(<SelectServicePage />) },
        { path: "/booking/appointment", element: withSuspense(<SelectSlotPage />) },
        { path: "/booking/payment", element: withSuspense(<SelectPaymentPage />) },
        { path: "/booking/payment-status", element: withSuspense(<PaymentStatusPage />) },
        { path: "/booking/result", element: withSuspense(<AppointmentResultPage />) },
        { path: "/appointment/:id", element: withSuspense(<AppointmentPublicPage />) },
      ],
    },
    {
      path: "*",
      element: withSuspense(<NotFoundPage />),
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  },
);