import { useContext } from 'react';
import './App.css'
import ChatPage from './pages/ChatPage';
import Login from './pages/Login'
import Register from './pages/Register'
import { AuthContext } from './context/AuthContext';
import SketchCard from './components/SketchCard';

function App() {
  const { user } = useContext(AuthContext);

  if (!user) return (
    <div>
      <Login />
      <Register />
    </div>
  );

  return (
    <div>
      <SketchCard />
      <ChatPage />
    </div>
  )
}

export default App
