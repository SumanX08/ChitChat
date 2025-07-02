import { Routes, Route } from 'react-router-dom';
import './index.css';
import Login from './Pages/Login';
import Chat from './Pages/Chat';
import UpdateProfile from './Pages/UpdateProfile';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from './Components/ProtectedRoute';

function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/updateProfile"
          element={
            <ProtectedRoute>
              <UpdateProfile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
