import React, { useState, useEffect } from 'react';
import { useVacationState, useVacationDispatch } from '../context/VacationContext';
import Button from './ui/Button';
import Card from './ui/Card';

function Login() {
    const { users } = useVacationState();
    const dispatch = useVacationDispatch();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const discordLogin = urlParams.get('discord_login');
        const userEmail = urlParams.get('user_email');

        if (discordLogin === 'success' && userEmail) {
            // Find user by email (should be loaded from database)
            const user = users.find(u => u.email.toLowerCase() === userEmail.toLowerCase());

            if (user) {
                dispatch({ type: 'LOGIN', payload: { userName: user.name } });

                if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
                    navigator.serviceWorker.ready.then(registration => {
                        registration.showNotification('Welcome to Vacation Tracker!', {
                            body: `Hello ${user.name}! Logged in via Discord`,
                            icon: '/icon-192.png',
                            badge: '/icon-192.png',
                            tag: 'discord-login'
                        });
                    });
                }

                window.history.replaceState({}, document.title, window.location.pathname);

                dispatch({
                    type: 'ADD_NOTIFICATION',
                    payload: {
                        id: new Date().toISOString(),
                        type: 'success',
                        message: `Welcome ${user.name}! Successfully logged in via Discord`,
                    },
                });
            }
            return;
        }
    }, [users, dispatch]);

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

    const handleDiscordLogin = () => {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        window.location.href = `${apiUrl}/api/auth/discord`;
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
                    <div className="space-y-4">
                        <Button
                            onClick={handleDiscordLogin}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-3"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                            </svg>
                            Sign in with Discord
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">Or sign in with email</span>
                            </div>
                        </div>

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
                </div>
            </Card>
        </div>
    );
}

export default Login;