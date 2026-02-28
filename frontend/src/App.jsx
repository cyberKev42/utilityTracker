import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AddEntry from './pages/AddEntry';
import Entries from './pages/Entries';
import Statistics from './pages/Statistics';
import StatisticsDetail from './pages/StatisticsDetail';
import Settings from './pages/Settings';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CurrencyProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/add-entry" element={<AddEntry />} />
              <Route path="/entries" element={<Entries />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/statistics/:type" element={<StatisticsDetail />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </CurrencyProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
