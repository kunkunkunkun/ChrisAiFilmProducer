import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AiAgent from './pages/AiAgent';
import ProjectDetail from './pages/ProjectDetail';
import Projects from './pages/Projects';
import Team from './pages/Team';
import Layout from './components/Layout';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="dashboard/project/:id" element={<ProjectDetail />} />
            <Route path="agent" element={<AiAgent />} />
            <Route path="projects" element={<Projects />} />
            <Route path="team" element={<Team />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}


export default App;
