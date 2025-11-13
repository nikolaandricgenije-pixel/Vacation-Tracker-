import React, { useState } from 'react';
import { useVacationState, useVacationDispatch } from '../context/VacationContext';
import Button from './ui/Button';
import Card from './ui/Card';

function Login() {
    const { users } = useVacationState();
    const dispatch = useVacationDispatch();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email.trim() || !password.trim()) {
            setError('Email and password are required.');
            return;
        }

        if (password !== '12345') {
            setError('Invalid password.');
            return;
        }

        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
            setError('User not found.');
            return;
        }

        dispatch({ type: 'LOGIN', payload: { userName: user.name } });

        // Send welcome push notification
        if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification('Welcome to Vacation Tracker!', {
                    body: `Hello ${user.name}! Ready to track your time?`,
                    icon: '/icon-192.png',
                    badge: '/icon-192.png',
                    tag: 'welcome'
                });
            });
        }

        dispatch({
            type: 'ADD_NOTIFICATION',
            payload: {
                id: new Date().toISOString(),
                type: 'success',
                message: `Welcome back, ${user.name}!`,
            },
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
            <Card className="w-full max-w-md">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-200 mb-6">
                        Welcome to Vacation Tracker
                    </h2>
                    <p className="text-center text-slate-600 dark:text-slate-400 mb-6">
                        Sign in with your email and password
                    </p>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3"
                                placeholder="your.email@company.com"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3"
                                placeholder="Enter password"
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full">
                            Sign In
                        </Button>
                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-md text-center">
                                <p className="font-semibold text-red-700 dark:text-red-300">{error}</p>
                            </div>
                        )}
                    </form>
                </div>
            </Card>
        </div>
    );
}

export default Login;