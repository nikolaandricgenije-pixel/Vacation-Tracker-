import React, { useState, useEffect } from 'react';
import { useVacationState, useVacationDispatch } from '../context/VacationContext';
import Button from './ui/Button';
import Card from './ui/Card';

function Login() {
  const { users } = useVacationState();
  const dispatch = useVacationDispatch();
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicCode, setMagicCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);

  // Check for magic link in URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const emailParam = urlParams.get('email');

    if (code && emailParam) {
      // Verify magic link
      const storedData = localStorage.getItem(`magicLink_${emailParam}`);
      if (storedData) {
        const { code: storedCode, expires } = JSON.parse(storedData);
        if (storedCode === code && Date.now() < expires) {
          // Valid magic link - auto login
          // Map email to users
          const emailLower = emailParam.toLowerCase();
          let user;
          if (emailLower === 'nikola@valens.dev') user = users.find(u => u.name === 'Nikola Andrić');
          else user = users[0]; // Default to first user

          if (user) {
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

            // Clear URL and localStorage
            window.history.replaceState({}, document.title, window.location.pathname);
            localStorage.removeItem(`magicLink_${emailParam}`);

            dispatch({
              type: 'ADD_NOTIFICATION',
              payload: {
                id: new Date().toISOString(),
                type: 'success',
                message: `Welcome back, ${user.name}!`,
              },
            });
          }
        }
      }
    }
  }, [users, dispatch]);

  const handleSendMagicLink = () => {
    if (email) {
      // Generate magic code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expires = Date.now() + (15 * 60 * 1000); // 15 minutes

      // Store in localStorage (simulating email sending)
      localStorage.setItem(`magicLink_${email}`, JSON.stringify({ code, expires }));

      // Create magic link URL
      const magicLink = `${window.location.origin}${window.location.pathname}?email=${encodeURIComponent(email)}&code=${code}`;

      // Show the link (in real app, this would be sent via email)
      alert(`Magic Link sent! Click here to login:\n\n${magicLink}\n\n(This simulates email sending)`);

      setMagicLinkSent(true);
      setShowCodeInput(true);
    }
  };

  const handleManualCodeEntry = () => {
    if (magicCode && email) {
      const storedData = localStorage.getItem(`magicLink_${email}`);
      if (storedData) {
        const { code: storedCode, expires } = JSON.parse(storedData);
        if (storedCode === magicCode.toUpperCase() && Date.now() < expires) {
          // Valid code - login
          const emailLower = email.toLowerCase();
          let user;
          if (emailLower === 'nikola@valens.dev') user = users.find(u => u.name === 'Nikola Andrić');
          else user = users[0]; // Default to first user

          if (user) {
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

            localStorage.removeItem(`magicLink_${email}`);

            dispatch({
              type: 'ADD_NOTIFICATION',
              payload: {
                id: new Date().toISOString(),
                type: 'success',
                message: `Welcome back, ${user.name}!`,
              },
            });
          }
        } else {
          alert('Invalid or expired code');
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-200 mb-6">
            Welcome to Vacation Tracker
          </h2>
          <p className="text-center text-slate-600 dark:text-slate-400 mb-6">
            Sign in with your email address
          </p>
          <div className="space-y-4">
            {!magicLinkSent ? (
              <>
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
                  />
                </div>
                <Button
                  onClick={handleSendMagicLink}
                  disabled={!email}
                  className="w-full"
                >
                  Send Magic Link
                </Button>
              </>
            ) : (
              <>
                <div className="text-center text-green-600 dark:text-green-400 mb-4">
                  Magic link sent! Check your email or enter the code below.
                </div>
                {showCodeInput && (
                  <>
                    <div>
                      <label htmlFor="code" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Enter Code
                      </label>
                      <input
                        type="text"
                        id="code"
                        value={magicCode}
                        onChange={(e) => setMagicCode(e.target.value.toUpperCase())}
                        className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 text-center font-mono"
                        placeholder="ABC123"
                        maxLength={6}
                      />
                    </div>
                    <Button
                      onClick={handleManualCodeEntry}
                      disabled={!magicCode}
                      className="w-full"
                    >
                      Verify Code
                    </Button>
                  </>
                )}
                <Button
                  onClick={() => {
                    setMagicLinkSent(false);
                    setEmail('');
                    setMagicCode('');
                    setShowCodeInput(false);
                  }}
                  className="w-full bg-slate-500 hover:bg-slate-600"
                >
                  Try Different Email
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

export default Login;