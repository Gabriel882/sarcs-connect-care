import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"

import { AuthProvider } from "@/hooks/useAuth"

// Pages
import Index from "./pages/Index"
import Auth from "./pages/Auth"
import VolunteerDashboard from "./pages/VolunteerDashboard"
import DonorDashboard from "./pages/DonorDashboard"
import AdminDashboard from "./pages/AdminDashboard"
import ActiveEmergencies from "./pages/ActiveEmergencies"
import NotFound from "./pages/NotFound"

// Create one global React Query client
const queryClient = new QueryClient()

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* UI Notifications */}
        <Toaster />
        <Sonner />

        {/* Routing + Auth Context */}
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/volunteer" element={<VolunteerDashboard />} />
              <Route path="/donor" element={<DonorDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/active-emergencies" element={<ActiveEmergencies />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
