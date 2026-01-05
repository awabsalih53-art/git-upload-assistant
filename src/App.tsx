import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import InventoryForm from "./pages/InventoryForm";
import Sales from "./pages/Sales";
import SalesForm from "./pages/SalesForm";
import Shipping from "./pages/Shipping";
import ShippingForm from "./pages/ShippingForm";
import Returns from "./pages/Returns";
import ReturnsForm from "./pages/ReturnsForm";
import Tasks from "./pages/Tasks";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inventory/new" element={<InventoryForm />} />
            <Route path="/inventory/:id" element={<InventoryForm />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/sales/new" element={<SalesForm />} />
            <Route path="/sales/:id" element={<SalesForm />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/shipping/new" element={<ShippingForm />} />
            <Route path="/shipping/:id" element={<ShippingForm />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/returns/new" element={<ReturnsForm />} />
            <Route path="/returns/:id" element={<ReturnsForm />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
