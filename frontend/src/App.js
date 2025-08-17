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
  const [isLoading, setIsLoading] = useState(true); // <-- NEW LOADING STATE

  useEffect(() => {
    try {
      if (token) {
        const decodedUser = jwtDecode(token);
        // Check if token is expired
        const isExpired = Date.now() >= decodedUser.exp * 1000;
        if (isExpired) {
          setUser(null);
          localStorage.removeItem('token');
        } else {
          setUser({ username: decodedUser.username, id: decodedUser.user_id });
          localStorage.setItem('token', token);
        }
      } else {
        setUser(null);
        localStorage.removeItem('token');
      }
    } catch (error) {
        console.error("Token validation failed:", error);
        setUser(null);
        localStorage.removeItem('token');
    } finally {
        // This is crucial: set loading to false after the check is complete.
        setIsLoading(false); 
    }
  }, [token]);

  const login = (newToken) => {
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
  };

  const value = { token, user, login, logout, isLoading }; // <-- Pass isLoading in context

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