import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { lazy } from "react";

const Layout        = lazy(() => import("./components/Layout/Layout"));
const Home          = lazy(() => import("./components/Home/Home"));
const Login         = lazy(() => import("./components/Auth/Login"));
const Appointment   = lazy(() => import("./components/Appointments/Appointment"));
const Patient       = lazy(() => import("./components/Patients/Patient"));
const ProtectedRoute= lazy(() => import("./components/ProtectedRoute/ProtectedRoute"));
const WhatsAppMessage=lazy(() => import("./components/WhatsAppMessage/WhatsAppMessage"));
const Payment       = lazy(() => import("./components/Payment/Payment"));
const About         = lazy(() => import("./components/About/About"));
const Inventory     = lazy(() => import("./components/Inventory/Inventory"));
const SettingsPage  = lazy(() => import("./components/Settings/Settings"));

function App() {
  const routes = createBrowserRouter([
    { path: "/login", element: <Login /> },
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          element: <ProtectedRoute />,
          children: [
            { index: true,               element: <Home /> },
            { path: "appointment",       element: <Appointment /> },
            { path: "patient",           element: <Patient /> },
            { path: "whatsAppMessage",   element: <WhatsAppMessage /> },
            { path: "payment",           element: <Payment /> },
            { path: "inventory",         element: <Inventory /> },
            { path: "settings",          element: <SettingsPage /> },
            { path: "about",             element: <About /> },
          ],
        },
      ],
    },
  ]);

  return <RouterProvider router={routes} />;
}

export default App;