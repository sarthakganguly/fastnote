import React, { useState, createContext, useContext, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// We will create these Page components in the next steps.
// For now, their imports are here.
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

// 1. --- Create Authentication Context ---
const AuthContext = createContext(null);

// Custom hook to easily access auth context data
export const useAuth = () => useContext(AuthContext);

// 2. --- Create Authentication Provider ---
// This component will wrap our app and provide auth state to all children.
const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    // When the token changes, update the user state.
    try {
      if (token) {
        const decodedUser = jwtDecode(token);
        setUser({ username: decodedUser.username, id: decodedUser.user_id });
        localStorage.setItem('token', token);
      } else {
        setUser(null);
        localStorage.removeItem('token');
      }
    } catch (error) {
        console.error("Invalid token:", error);
        setUser(null);
        localStorage.removeItem('token');
    }
  }, [token]);

  const login = (newToken) => {
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
  };

  // The value provided to the context consumers
  const value = { token, user, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


// 3. --- Create Protected Route Component ---
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to. This allows us to send them back after they log in.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};


// 4. --- Main App Component with Routing ---
function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected Route */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;