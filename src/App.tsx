import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { AppStateProvider } from './context/AppStateContext';
import AuthPage from './pages/AuthPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ResetPasswordConfirmPage from './pages/ResetPasswordConfirmPage';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ChoresPage from './pages/ChoresPage';
import KitchenPage from './pages/KitchenPage';
import BillsPage from './pages/BillsPage';
import NoisePage from './pages/NoisePage';
import RoommatesPage from './pages/RoommatesPage';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-5 h-5 bg-white rounded"></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes - accessible without authentication */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/reset-password-confirm" element={<ResetPasswordConfirmPage />} />
        
        {/* Protected routes - require authentication */}
        {user ? (
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="chores" element={<ChoresPage />} />
            <Route path="kitchen" element={<KitchenPage />} />
            <Route path="bills" element={<BillsPage />} />
            <Route path="noise" element={<NoisePage />} />
            <Route path="roommates" element={<RoommatesPage />} />
          </Route>
        ) : (
          <Route path="*" element={<AuthPage />} />
        )}
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppStateProvider>
        <div className="App">
          <AppContent />
          
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </AppStateProvider>
    </AuthProvider>
  );
}

export default App;