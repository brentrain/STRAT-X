/**
 * @file LoginScreen.tsx
 * @description
 * This component renders the login form for the application.
 * It captures user credentials (organization name, username, password), validates them,
 * and passes them to the onLogin handler. It also provides an option to switch to the
 * account creation screen and a utility to clear all locally stored account data.
 *
 * @component
 * @param {object} props - The component props.
 * @param {(credentials: UserCredentials) => string | null} props.onLogin - Callback function to handle the login attempt. It returns an error message string on failure or null on success.
 * @param {() => void} props.onSwitchToCreateAccount - Callback to switch the view to the CreateAccountScreen.
 * @param {UserCredentials} [props.demoCredentials] - Optional demo credentials to pre-fill the form.
 */
import React, { useState } from 'react';
import { UserCredentials } from '../types';

interface LoginScreenProps {
  onLogin: (credentials: UserCredentials) => string | null;
  onSwitchToCreateAccount: () => void;
  demoCredentials?: UserCredentials;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onSwitchToCreateAccount, demoCredentials }) => {
  const [organizationName, setOrganizationName] = useState(demoCredentials?.organizationName || '');
  const [username, setUsername] = useState(demoCredentials?.username || '');
  const [password, setPassword] = useState(demoCredentials?.password || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!organizationName.trim() || !username.trim() || !password.trim()) {
      setError('All fields are required.');
      return;
    }
    // The onLogin handler from App.tsx determines if login is successful.
    const loginResult = onLogin({ organizationName, username, password });
    if (loginResult !== null) { // If it returns a string, it's an error message.
      setError(loginResult);
    }
    // On success (null), App.tsx handles the state change.
  };

  /**
   * Clears all application-related data from localStorage.
   * This is a utility for development and testing to easily reset the app's state.
   */
  const handleClearStoredData = () => {
    if (window.confirm('Are you sure you want to clear all stored account data and login sessions from this device? This action cannot be undone.')) {
      localStorage.removeItem('cardiacMonitorAccounts');
      localStorage.removeItem('cardiacMonitorSession');
      alert('All stored account data and login sessions have been cleared from this device. Please refresh the page if you were logged in.');
      setOrganizationName('');
      setUsername('');
      setPassword('');
      setError('');
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700">
      <div className="text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 inline-block text-sky-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
        </svg>
        <h1 className="text-3xl font-bold text-slate-100 mt-2">HeartSenseAI Login</h1>
        <p className="text-sm text-slate-400 mt-2">Use the pre-filled demo account or create your own.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-md text-center border border-red-500/30">{error}</p>}
        <div>
          <label htmlFor="orgName" className="block text-sm font-medium text-slate-300">
            Organization Name
          </label>
          <input
            id="orgName"
            type="text"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 text-slate-100
                       focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-slate-300">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 text-slate-100
                       focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>
        <div>
          <label htmlFor="password_login" className="block text-sm font-medium text-slate-300">
            Password
          </label>
          <input
            id="password_login"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 text-slate-100
                       focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors"
        >
          Login
        </button>
      </form>
      <p className="text-sm text-center text-slate-400">
        Don't have an account on this device?{' '}
        <button
          onClick={onSwitchToCreateAccount}
          className="font-medium text-sky-500 hover:text-sky-400 focus:outline-none focus:underline"
        >
          Create one
        </button>
      </p>
      <div className="mt-6 text-center">
        <button
          onClick={handleClearStoredData}
          className="text-xs text-slate-500 hover:text-slate-400 focus:outline-none focus:underline"
          title="This will remove all locally stored account information and log you out."
        >
          Clear Stored Account Data (This Device Only)
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;