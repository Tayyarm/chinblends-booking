import { useState, useEffect } from 'react';
import AdminLogin from '../components/AdminLogin';
import AdminDashboard from '../components/AdminDashboard';

function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if admin is already logged in
    const adminToken = sessionStorage.getItem('adminToken');
    if (adminToken === 'chinblends_admin') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (password) => {
    // Simple password check - in production, this would be done server-side
    if (password === 'chinblends2024') {
      sessionStorage.setItem('adminToken', 'chinblends_admin');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken');
    setIsAuthenticated(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated ? (
        <AdminDashboard onLogout={handleLogout} />
      ) : (
        <AdminLogin onLogin={handleLogin} />
      )}
    </div>
  );
}

export default AdminPage;
