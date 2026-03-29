import React, { useState, createContext, useContext, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

// 1. --- Auth Context ---
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// 2. --- Auth Provider (with loading state) ---
const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // This handles the initial load (checking if a user was already logged in)
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      try {
        const decoded = jwtDecode(savedToken);
        const isExpired = Date.now() >= decoded.exp * 1000;
        if (!isExpired) {
          setToken(savedToken);
          setUser({ username: decoded.username, id: decoded.user_id });
        } else {
          localStorage.removeItem('token');
        }
      } catch (e) {
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken) => {
    // 1. Decode immediately to get user data
    const decoded = jwtDecode(newToken);
    
    // 2. Update all states AND localStorage at once
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser({ username: decoded.username, id: decoded.user_id });
    
    // This ensures that the moment navigate() is called, 
    // the ProtectedRoute will see user as defined.
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = { token, user, login, logout, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 3. --- Protected Route (aware of loading state) ---
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth(); // <-- Get isLoading from context
  const location = useLocation();

  // If we are still checking for the user, don't render anything yet.
  // You could also return a loading spinner component here.
  if (isLoading) {
    return null; 
  }

  // Now, after the loading is done, we can safely check for the user.
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// 4. --- Main App Component (no changes here) ---
function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;