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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ssoToken = urlParams.get('sso_token');
    const userName = urlParams.get('user_name');
    const userEmail = urlParams.get('user_email');
    
    if (ssoToken && userName) {
      localStorage.setItem('sso_token', ssoToken);
      localStorage.setItem('user_email', userEmail || '');
      
      let user = users.find(u => u.name === userName);
      if (!user && userEmail) {
        const emailLower = userEmail.toLowerCase();
        if (emailLower === 'nikola@valens.dev') {
          user = users.find(u => u.name === 'Nikola Andrić');
        }
      }
      if (!user) user = users[0];
      
      if (user) {
        dispatch({ type: 'LOGIN', payload: { userName: user.name } });
        
        if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification('Welcome to Vacation Tracker!', {
              body: `Hello ${user.name}! Logged in via SSO`,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              tag: 'sso-login'
            });
          });
        }
        
        window.history.replaceState({}, document.title, window.location.pathname);
        
        dispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            id: new Date().toISOString(),
            type: 'success',
            message: `Welcome ${user.name}! Successfully logged in via SSO`,
          },
        });
      }
      return;
    }

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

  const handleGoogleSSO = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    window.location.href = `${apiUrl}/api/auth/google`;
  };

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
                <Button
                  onClick={handleGoogleSSO}
                  className="w-full bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100 dark:border-slate-500 flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">Or continue with email</span>
                  </div>
                </div>

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