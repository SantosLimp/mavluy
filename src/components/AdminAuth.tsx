import React, { useState, useEffect } from 'react';
import { Lock, Mail, User, ArrowRight, ShieldAlert, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import SleekSpinner from './SleekSpinner';

interface AdminAuthProps {
  onSuccess: (adminEmail: string) => void;
  onBackToStore: () => void;
  theme: any;
  initialTab?: 'login' | 'register';
  allowRegistration?: boolean;
  customLoginSlug?: string;
  customRegisterSlug?: string;
  onTabChange?: (tab: 'login' | 'register') => void;
}

export default function AdminAuth({
  onSuccess,
  onBackToStore,
  theme,
  initialTab = 'login',
  allowRegistration = true,
  customLoginSlug = 'admin/login',
  customRegisterSlug = 'admin/register',
  onTabChange
}: AdminAuthProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setCheckingStatus(true);
    fetch('/api/admins/status')
      .then(res => {
        if (!res.ok) throw new Error('API Error');
        return res.json();
      })
      .then(data => {
        setHasAdmin(data.hasAdmin);
        if (!data.hasAdmin) {
          setActiveTab('register');
          if (onTabChange) onTabChange('register');
        } else if (initialTab) {
          setActiveTab(initialTab);
        } else {
          setActiveTab('login');
        }
        setCheckingStatus(false);
      })
      .catch(err => {
        console.error('Error fetching admin setup status:', err);
        setCheckingStatus(false);
      });
  }, [initialTab, onTabChange]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    fetch('/api/admins/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail, password: loginPassword })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Incorrect email or password.');
        }
        return data;
      })
      .then(data => {
        setSuccess(`Welcome back, ${data.admin.name}!`);
        if (data.token) {
          localStorage.setItem('mavluy_admin_token', data.token);
          localStorage.setItem('virtuprod_admin_token', data.token);
        }
        localStorage.setItem('mavluy_logged_in_admin', data.admin.email);
        sessionStorage.setItem('mavluy_logged_in_admin', data.admin.email);
        localStorage.setItem('virtuprod_logged_in_admin', data.admin.email);
        sessionStorage.setItem('virtuprod_logged_in_admin', data.admin.email);
        setTimeout(() => {
          setIsLoading(false);
          onSuccess(data.admin.email);
        }, 1000);
      })
      .catch(err => {
        setIsLoading(false);
        setError(err.message || 'Server error occurred during login.');
      });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    fetch('/api/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        password: regPassword
      })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to register administrator.');
        }
        return data;
      })
      .then(data => {
        setIsLoading(false);
        setSuccess('Master account successfully registered! Redirecting...');
        setHasAdmin(true);
        if (data.token) {
          localStorage.setItem('mavluy_admin_token', data.token);
          localStorage.setItem('virtuprod_admin_token', data.token);
        }
        localStorage.setItem('mavluy_logged_in_admin', regEmail.trim().toLowerCase());
        sessionStorage.setItem('mavluy_logged_in_admin', regEmail.trim().toLowerCase());
        localStorage.setItem('virtuprod_logged_in_admin', regEmail.trim().toLowerCase());
        sessionStorage.setItem('virtuprod_logged_in_admin', regEmail.trim().toLowerCase());

        setTimeout(() => {
          onSuccess(regEmail.trim().toLowerCase());
        }, 1000);
      })
      .catch(err => {
        setIsLoading(false);
        setError(err.message || 'Server error occurred during registration.');
      });
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <SleekSpinner size="lg" variant="primary" />
          <p className="text-xs text-stone-500 font-bold uppercase tracking-widest">Verifying control panel credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      <div className="w-full max-w-md mx-auto z-10 space-y-6">
        <div className="text-center space-y-3">
          <button
            onClick={onBackToStore}
            className="font-logo italic text-2xl sm:text-3xl tracking-normal transition-colors duration-300 focus:outline-none cursor-pointer"
          >
            <span className="text-stone-900">Mav</span>
            <span className="text-[#2563eb]">luy</span>
          </button>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
            Control Panel Access
          </h2>
          <p className="text-xs text-stone-500 font-medium max-w-xs mx-auto">
            {activeTab === 'login' ? 'Secure Login to your administrator dashboard' : 'Register your master administrator profile'}
          </p>
        </div>

        <div className="bg-white p-5 sm:p-8 md:p-10 shadow-2xl rounded-3xl sm:rounded-[2.5rem] border border-stone-200/80 space-y-5 sm:space-y-6 relative">
          {activeTab === 'login' ? (
            <div className="text-center pb-1">
              <h3 className="text-base font-bold text-stone-900 uppercase tracking-wider">Login</h3>
              <p className="text-[11px] text-stone-400 font-semibold mt-0.5">Access your e-commerce management panel</p>
            </div>
          ) : (
            <div className="text-center pb-1">
              <h3 className="text-base font-bold text-stone-900 uppercase tracking-wider">Setup Master Administrator</h3>
              <p className="text-[11px] text-stone-400 font-semibold mt-0.5">Register the primary owner account</p>
            </div>
          )}

          {!hasAdmin && activeTab === 'register' && (
            <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-2xl text-blue-800 text-xs font-semibold leading-relaxed animate-fadeIn">
              No administrator accounts exist yet. Please register the first master administrator profile to secure this control panel.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100/80 p-3.5 rounded-2xl flex items-start gap-2.5 text-red-700 text-xs font-semibold leading-relaxed animate-fadeIn">
              <ShieldAlert className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl flex items-start gap-2.5 text-emerald-700 text-xs font-semibold leading-relaxed animate-fadeIn">
              <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5 text-emerald-500" />
              <span>{success}</span>
            </div>
          )}

          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                  Login
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    disabled={isLoading}
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@mavluy.com"
                    className="block w-full pl-10 pr-3 py-3 border border-stone-200 bg-stone-50/50 rounded-2xl text-stone-900 focus:outline-none focus:border-[#2563eb] focus:bg-white text-xs font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    disabled={isLoading}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-10 py-3 border border-stone-200 bg-stone-50/50 rounded-2xl text-stone-900 focus:outline-none focus:border-[#2563eb] focus:bg-white text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 focus:outline-none cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white text-xs py-4 px-4 rounded-full font-bold uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-blue-600/10 disabled:bg-stone-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <SleekSpinner size="xs" variant="white" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      Login
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {(!hasAdmin || allowRegistration !== false) && (
                <div className="text-center pt-2 text-stone-500 text-[11px] font-semibold">
                  Don't have an admin account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('register');
                      if (onTabChange) onTabChange('register');
                      setError('');
                      setSuccess('');
                    }}
                    className="text-[#2563eb] hover:underline font-bold cursor-pointer"
                  >
                    Register here
                  </button>
                </div>
              )}
            </form>
          )}

          {activeTab === 'register' && (
            (hasAdmin && allowRegistration === false) ? (
              <div className="space-y-4 text-center py-4">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 border border-amber-200">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-stone-900">Registration is Closed & Locked</h4>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto">
                    Admin registration has been disabled in the dashboard settings.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    if (onTabChange) onTabChange('login');
                    setError('');
                    setSuccess('');
                  }}
                  className="w-full bg-[#2563eb] hover:bg-blue-700 text-white text-xs py-3.5 px-4 rounded-full font-bold uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-blue-600/10"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
            <form onSubmit={handleRegister} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                  Your Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    disabled={isLoading}
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Yassine Alaoui"
                    className="block w-full pl-10 pr-3 py-3 border border-stone-200 bg-stone-50/50 rounded-2xl text-stone-900 focus:outline-none focus:border-[#2563eb] focus:bg-white text-xs font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                  Admin Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    disabled={isLoading}
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="alaoui@mavluy.com"
                    className="block w-full pl-10 pr-3 py-3 border border-stone-200 bg-stone-50/50 rounded-2xl text-stone-900 focus:outline-none focus:border-[#2563eb] focus:bg-white text-xs font-medium"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      disabled={isLoading}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-10 py-3 border border-stone-200 bg-stone-50/50 rounded-2xl text-stone-900 focus:outline-none focus:border-[#2563eb] focus:bg-white text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 focus:outline-none cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      required
                      disabled={isLoading}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-10 py-3 border border-stone-200 bg-stone-50/50 rounded-2xl text-stone-900 focus:outline-none focus:border-[#2563eb] focus:bg-white text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 focus:outline-none cursor-pointer"
                    >
                      {showRegConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white text-xs py-4 px-4 rounded-full font-bold uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-blue-600/10 disabled:bg-stone-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <SleekSpinner size="xs" variant="white" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      Register Administrator
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2 text-stone-500 text-[11px] font-semibold">
                Already have an admin account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    if (onTabChange) onTabChange('login');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-[#2563eb] hover:underline font-bold cursor-pointer"
                >
                  Sign In here
                </button>
              </div>
            </form>
            )
          )}
        </div>

        <div className="text-center">
          <button
            onClick={onBackToStore}
            className="text-xs text-stone-500 hover:text-[#2563eb] transition-colors cursor-pointer font-bold underline uppercase tracking-widest text-[10px]"
          >
            ← Return to Homepage
          </button>
        </div>
      </div>
    </div>
  );
}
