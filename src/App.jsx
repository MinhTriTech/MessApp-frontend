import { useContext } from 'react';
import './App.css'
import Chat from './pages/Chat';
import Login from './pages/Login'
import Register from './pages/Register'
import { AuthContext } from './context/AuthContext';

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
      <Chat />
    </div>
  )
}

export default App
