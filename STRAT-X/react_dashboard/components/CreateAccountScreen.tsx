
import React, { useState } from 'react';
import { UserCredentials } from '../types';

interface CreateAccountScreenProps {
  onCreateAccount: (credentials: UserCredentials) => boolean;
  onSwitchToLogin: () => void;
}

const CreateAccountScreen: React.FC<CreateAccountScreenProps> = ({ onCreateAccount, onSwitchToLogin }) => {
  const [organizationName, setOrganizationName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!organizationName.trim() || !username.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    onCreateAccount({ organizationName, username, password });
    // App.tsx handles UI switch on success via alert and view change.
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700">
      <h1 className="text-3xl font-bold text-center text-slate-100">Create Account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-md text-center border border-red-500/30">{error}</p>}
        <div>
          <label htmlFor="orgName_create" className="block text-sm font-medium text-slate-300">
            Organization Name
          </label>
          <input
            id="orgName_create"
            type="text"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 text-slate-100
                       focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>
        <div>
          <label htmlFor="username_create" className="block text-sm font-medium text-slate-300">
            Username
          </label>
          <input
            id="username_create"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 text-slate-100
                       focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>
        <div>
          <label htmlFor="password_create" className="block text-sm font-medium text-slate-300">
            Password
          </label>
          <input
            id="password_create"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 text-slate-100
                       focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>
        <div>
          <label htmlFor="confirm_password_create" className="block text-sm font-medium text-slate-300">
            Confirm Password
          </label>
          <input
            id="confirm_password_create"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 text-slate-100
                       focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-emerald-500 transition-colors"
        >
          Create Account
        </button>
      </form>
      <p className="text-sm text-center text-slate-400">
        Already have an account on this device?{' '}
        <button
          onClick={onSwitchToLogin}
          className="font-medium text-sky-500 hover:text-sky-400 focus:outline-none focus:underline"
        >
          Login
        </button>
      </p>
    </div>
  );
};

export default CreateAccountScreen;