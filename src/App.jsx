import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Invoices from './pages/Invoices';
import InvoiceEditor from './pages/InvoiceEditor';
import InvoicePreview from './pages/InvoicePreview';
import Quotations from './pages/Quotations';
import QuotationEditor from './pages/QuotationEditor';
import QuotationPreview from './pages/QuotationPreview';
import Expenses from './pages/Expenses';
import TimeTracking from './pages/TimeTracking';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import './index.css';
import { Loader2 } from 'lucide-react';

function AppRoutes() {
  const { state } = useApp();

  if (state.loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={!state.user ? <Auth /> : <Navigate to="/" />} />

      <Route path="/" element={state.user ? <Layout /> : <Navigate to="/auth" />}>
        <Route index element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="invoices/new" element={<InvoiceEditor />} />
        <Route path="invoices/:id" element={<InvoicePreview />} />
        <Route path="invoices/:id/edit" element={<InvoiceEditor />} />
        <Route path="quotations" element={<Quotations />} />
        <Route path="quotations/new" element={<QuotationEditor />} />
        <Route path="quotations/:id" element={<QuotationPreview />} />
        <Route path="quotations/:id/edit" element={<QuotationEditor />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="time-tracking" element={<TimeTracking />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
}

export default App;
