import React, { useState } from 'react';
import { useVacationState, useVacationDispatch } from '../context/VacationContext';
import { User } from '../types';
import Button from './ui/Button';
import Card from './ui/Card';

function UserManagement() {
  const { users } = useVacationState();
  const dispatch = useVacationDispatch();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEmployee, setIsEmployee] = useState(true);
  const [isProjectManager, setIsProjectManager] = useState(false);
  const [isCEO, setIsCEO] = useState(false);
  const [vacationDays, setVacationDays] = useState(20);
  const [paidLeaveDays, setPaidLeaveDays] = useState(7);
  const [error, setError] = useState<string | null>(null);
  const [discordStatus, setDiscordStatus] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    if (users.some(u => u.name.toLowerCase() === name.trim().toLowerCase())) {
      setError('User with this name already exists.');
      return;
    }

    if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
      setError('User with this email already exists.');
      return;
    }

    const roles: ('Admin' | 'Employee' | 'Project Manager' | 'CEO')[] = [];
    if (isAdmin) roles.push('Admin');
    if (isEmployee) roles.push('Employee');
    if (isProjectManager) roles.push('Project Manager');
    if (isCEO) roles.push('CEO');

    if (roles.length === 0) {
      setError('At least one role must be selected.');
      return;
    }

    const newUser: User = {
      name: name.trim(),
      email: email.trim(),
      roles,
      vacationDays,
      paidLeaveDays,
    };

    dispatch({ type: 'ADD_USER', payload: newUser });

    // Reset form
    setName('');
    setEmail('');
    setIsAdmin(false);
    setIsEmployee(true);
    setIsProjectManager(false);
    setIsCEO(false);
    setVacationDays(20);
    setPaidLeaveDays(7);
  };

  const handleRegisterDiscordCommands = async () => {
    setIsRegistering(true);
    setDiscordStatus(null);

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_URL}/api/discord/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok) {
        setDiscordStatus(`✅ Successfully registered ${data.commands?.length || 0} Discord commands!`);
      } else {
        setDiscordStatus(`❌ Error: ${data.error || 'Failed to register commands'}`);
      }
    } catch (error) {
      setDiscordStatus(`❌ Network error: ${error.message}`);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-4">
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">Discord Bot Management</h3>
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Register Discord slash commands for the bot. This needs to be done once after setting up environment variables.
            </p>
            <Button
              onClick={handleRegisterDiscordCommands}
              disabled={isRegistering}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isRegistering ? 'Registering...' : 'Register Discord Commands'}
            </Button>
            {discordStatus && (
              <div className={`p-3 rounded-md text-sm ${discordStatus.includes('✅') ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300'}`}>
                {discordStatus}
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">Current Users</h3>
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.name} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Roles: {user.roles.join(', ')}</p>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    <p>Vacation: {user.vacationDays}</p>
                    <p>Paid Leave: {user.paidLeaveDays}</p>
                    <p>Sick Leave: Unlimited</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">Add New User</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="user-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
              <input
                type="text"
                id="user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                placeholder="Enter user name"
              />
            </div>
            <div>
              <label htmlFor="user-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <input
                type="email"
                id="user-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                placeholder="Enter user email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Roles</label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Admin</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isCEO}
                    onChange={(e) => setIsCEO(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">CEO</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isProjectManager}
                    onChange={(e) => setIsProjectManager(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Project Manager</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isEmployee}
                    onChange={(e) => setIsEmployee(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Employee</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="vacation-days" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Vacation Days</label>
                <input
                  type="number"
                  id="vacation-days"
                  value={vacationDays}
                  onChange={(e) => setVacationDays(Number(e.target.value))}
                  min="0"
                  className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                />
              </div>
              <div>
                <label htmlFor="paid-leave-days" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Paid Leave Days</label>
                <input
                  type="number"
                  id="paid-leave-days"
                  value={paidLeaveDays}
                  onChange={(e) => setPaidLeaveDays(Number(e.target.value))}
                  min="0"
                  className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-md text-center">
                <p className="font-semibold text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit">Add User</Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

export default UserManagement;