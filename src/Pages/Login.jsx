import React, { useState, useContext } from 'react';
import assets from '../assets/assets';
import { signup, login, resetPassword } from '../config/firebase';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const STATES = {
  SIGN_UP: 'Sign Up',
  LOGIN: 'Login',
};

const Login = () => {
  const [currState, setCurrState] = useState(STATES.SIGN_UP);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { loadUserData } = useContext(AppContext);
  const navigate = useNavigate();

  const isSignup = currState === STATES.SIGN_UP;

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (isSignup) {
      await signup(username, email, password);
    } else {
      await login(email, password, loadUserData, navigate);
    }
  };

  const handleResetPassword = () => {
    if (!email) {
      toast.warn("Please enter your email to reset password.");
      return;
    }
    resetPassword(email);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#3b82f6] flex items-center justify-center px-4">
      <div className="flex flex-col items-center justify-center w-full max-w-6xl gap-10 md:gap-32 md:flex-row">
        
        <div className="flex flex-col items-center text-center md:text-left">
          <img
            className="w-[180px] md:w-full mb-4"
            src={assets.logo_icon}
            alt="Logo"
          />
          <h1 className="text-3xl font-semibold text-white md:text-6xl">ChitChat</h1>
        </div>

       
        <form
          onSubmit={onSubmitHandler}
          className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-6 w-full sm:w-[90%] md:w-[400px] flex flex-col gap-4 text-white shadow-lg"
        >
          <h2 className="text-2xl font-semibold text-center">{currState}</h2>

          {isSignup && (
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full p-2 rounded outline-none bg-zinc-800 focus:ring-2 focus:ring-blue-500"
              placeholder="Username"
              type="text"
            />
          )}

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 rounded outline-none bg-zinc-800 focus:ring-2 focus:ring-blue-500"
            placeholder="Email address"
            type="email"
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 rounded outline-none bg-zinc-800 focus:ring-2 focus:ring-blue-500"
            placeholder="Password"
            type="password"
          />

          <button className="w-full py-2 text-lg font-medium transition bg-blue-600 rounded hover:bg-blue-700">
            {isSignup ? 'Create Account' : 'Login'}
          </button>

          {isSignup && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={() => setAgreedToTerms(!agreedToTerms)}
                className="accent-blue-600"
              />
              <span>
                Agree to the{' '}
                <span className="underline cursor-pointer">Terms & Privacy Policy</span>
              </span>
            </label>
          )}

          <div className="mt-2 space-y-1 text-sm text-gray-300">
            {isSignup ? (
              <p>
                Already have an account?{' '}
                <span
                  onClick={() => setCurrState(STATES.LOGIN)}
                  className="font-semibold text-blue-400 cursor-pointer hover:underline"
                >
                  Login here
                </span>
              </p>
            ) : (
              <>
                <p>
                  Create an account?{' '}
                  <span
                    onClick={() => setCurrState(STATES.SIGN_UP)}
                    className="font-semibold text-blue-400 cursor-pointer hover:underline"
                  >
                    Sign Up
                  </span>
                </p>
                <p>
                  Forgot Password?{' '}
                  <span
                    onClick={handleResetPassword}
                    className="font-semibold text-blue-400 cursor-pointer hover:underline"
                  >
                    Reset here
                  </span>
                </p>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
