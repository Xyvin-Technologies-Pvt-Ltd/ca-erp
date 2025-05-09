// src/App.js
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, NotificationProvider } from "./context/";
import { MainLayout, AuthLayout } from "./layout";
import { Dashboard, Login, ClientList } from "./pages";
import { ROUTES } from "./config/constants";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Tasks from "./pages/Tasks";
import TaskDetail from "./pages/TaskDetail";
import ClientDetails from "./pages/ClientDetails";
import ClientEdit from "./pages/ClientEdit";
import Documents from "./pages/Documents";
import Finance from "./pages/Finance";
import Settings from "./pages/Settings";
import ErrorPage from "./pages/ErrorPage";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";



import Profile from "./pages/Profile";
import ProjectCart from "./pages/ProjectCart";
import Notification from "./pages/Notification";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <ToastContainer />
            <Routes>
              {/* Public routes */}
              <Route element={<AuthLayout />}>
                <Route path={ROUTES.LOGIN} element={<Login />} />
              </Route>

              {/* Protected routes */}
              <Route element={<MainLayout />}>
                <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                <Route path="/notifications" element={<Notification />} />
                {/* Client Routes */}
                <Route path={ROUTES.CLIENTS} element={<ClientList />} />
                <Route path="/clients/:id" element={<ClientDetails />} />
                <Route path="/clients/:id/edit" element={<ClientEdit />} />

                {/* Project Routes */}
                <Route path={ROUTES.PROJECTS} element={<Projects />} />
                <Route
                  path={`${ROUTES.PROJECTS}/:id`}
                  element={<ProjectDetail />}
                />

                {/* Task Routes */}
                <Route path={ROUTES.TASKS} element={<Tasks />} />
                <Route path={`${ROUTES.TASKS}/:id`} element={<TaskDetail />} />

                {/* Other Routes */}
                <Route path={ROUTES.DOCUMENTS} element={<Documents />} />
                <Route path={ROUTES.FINANCE} element={<Finance />} />
                <Route path={ROUTES.PROJECTCART} element={<ProjectCart />} />
                <Route path={ROUTES.SETTINGS} element={<Settings />} />

                <Route path={ROUTES.PROFILE} element={<Profile />} />


                {/* Default and 404 */}
                <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} />} />
                <Route path="*" element={<ErrorPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
