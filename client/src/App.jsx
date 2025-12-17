import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ReportsPage from './pages/ReportsPage';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/reports" element={<ReportsPage />} />
    </Routes>
  );
}

export default App;
