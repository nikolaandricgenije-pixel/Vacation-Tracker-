import React, { useState, useEffect } from 'react';
import { useVacationState, useVacationDispatch } from '../context/VacationContext';
import Button from './ui/Button';
import Card from './ui/Card';
import emailjs from '@emailjs/browser';

function Login() {
   const { users } = useVacationState();
   const dispatch = useVacationDispatch();
   const [email, setEmail] = useState('');
   const [magicLinkSent, setMagicLinkSent] = useState(false);
   const [magicCode, setMagicCode] = useState('');
   const [showCodeInput, setShowCodeInput] = useState(false);
   const [sendingEmail, setSendingEmail] = useState(false);
   const [emailError, setEmailError] = useState<string | null>(null);

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

  const handleSendMagicLink = async () => {
    if (email) {
      setSendingEmail(true);
      setEmailError(null);

      try {
        // Generate magic code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const expires = Date.now() + (15 * 60 * 1000); // 15 minutes

        // Store in localStorage for verification
        localStorage.setItem(`magicLink_${email}`, JSON.stringify({ code, expires }));

        // Create magic link URL
        const magicLink = `${window.location.origin}${window.location.pathname}?email=${encodeURIComponent(email)}&code=${code}`;

        // EmailJS configuration - these should be set in environment variables
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'your_service_id';
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'your_template_id';
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'your_public_key';

        // Prepare email template parameters
        const templateParams = {
          to_email: email,
          magic_link: magicLink,
          magic_code: code,
          expires_in: '15 minutes',
        };

        // Send email using EmailJS
        if (serviceId !== 'your_service_id' && templateId !== 'your_template_id' && publicKey !== 'your_public_key') {
          await (emailjs as any).send(serviceId, templateId, templateParams, publicKey);
          setMagicLinkSent(true);
          setShowCodeInput(true);
        } else {
          // Fallback to simulation if EmailJS not configured
          alert(`Magic Link sent! Click here to login:\n\n${magicLink}\n\n(This simulates email sending - configure EmailJS for real emails)`);
          setMagicLinkSent(true);
          setShowCodeInput(true);
        }
      } catch (error) {
        console.error('Error sending email:', error);
        setEmailError('Failed to send email. Please try again.');
      } finally {
        setSendingEmail(false);
      }
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
                  disabled={!email || sendingEmail}
                  className="w-full"
                >
                  {sendingEmail ? 'Sending...' : 'Send Magic Link'}
                </Button>
                {emailError && (
                  <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-md text-center">
                    <p className="font-semibold text-red-700 dark:text-red-300">{emailError}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-center text-green-600 dark:text-green-400 mb-4">
                  {import.meta.env.VITE_EMAILJS_SERVICE_ID !== 'your_service_id' ?
                    'Magic link sent! Check your email.' :
                    'Magic link simulated! Check your email (configure EmailJS for real emails).'
                  }
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