import React, { useState ,useContext,} from 'react';
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
  if (currState === "Sign Up") {
    await signup(username, email, password); // You can enhance this too
  } else {
    await login(email, password, loadUserData, navigate); // ✅ Important change
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
    <div className='w-screen h-screen bg-cover bg-customBg'>
      <div className='flex flex-col items-center m-auto md:flex md:flex-row md:justify-evenly md:items-center md:min-h-screen'>
        <div className='flex justify-center my-10'>
          <img className='w-[max(20vw,200px)]' width="200"
  height="200" src={assets.logo_bigW} alt="Logo" />
        </div>

        <form onSubmit={onSubmitHandler} className='flex flex-col gap-5 bg-white border rounded-lg w-80'>
          <h1 className='w-11/12 mx-auto mt-5 text-3xl font-semibold'>{currState}</h1>

          {isSignup && (
            <input
              onChange={(e) => setUsername(e.target.value)}
              required
              value={username}
              className='w-11/12 px-3 m-auto border rounded-lg border-borderColor h-11 outline-customBlue'
              type='text'
              placeholder='Username'
            />
          )}

          <input
            onChange={(e) => setEmail(e.target.value)}
            required
            value={email}
            className='w-11/12 px-3 m-auto border rounded-lg border-borderColor h-11 outline-customBlue'
            type='email'
            placeholder='Email address'
          />

          <input
            onChange={(e) => setPassword(e.target.value)}
            required
            value={password}
            className='w-11/12 px-3 m-auto border rounded-lg border-borderColor h-11 outline-customBlue'
            type='password'
            placeholder='Password'
          />

          <button className='w-11/12 m-auto text-xl text-white border rounded-md h-11 bg-customBlue'>
            {isSignup ? 'Create account' : 'Login'}
          </button>

          {isSignup && (
            <div className='flex w-11/12 gap-2 mx-auto'>
              <input
                type='checkbox'
                className='cursor-pointer'
                checked={agreedToTerms}
                onChange={() => setAgreedToTerms(!agreedToTerms)}
              />
              <p className='text-sm text-customGrey'>Agree to the terms of use & privacy policy</p>
            </div>
          )}

          <div className='w-11/12 mx-auto mb-5 text-sm text-customGrey'>
            {isSignup ? (
              <p>
                Already have an account?{' '}
                <span
                  onClick={() => setCurrState(STATES.LOGIN)}
                  className='font-semibold cursor-pointer text-customBlue'
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
                    className='font-semibold cursor-pointer text-customBlue'
                  >
                    Sign Up
                  </span>
                </p>
                <p>
                  Forgot Password?{' '}
                  <span
                    onClick={handleResetPassword}
                    className='font-semibold cursor-pointer text-customBlue'
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
