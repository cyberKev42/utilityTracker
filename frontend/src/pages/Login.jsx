import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineEye, HiOutlineEyeSlash, HiExclamationCircle } from 'react-icons/hi2';

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});

  const validateField = (field, value) => {
    switch (field) {
      case 'email':
        if (!value.trim()) return t('auth.validation.emailRequired');
        return '';
      case 'password':
        if (!value) return t('auth.validation.passwordRequired');
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = field === 'email' ? email : password;
    const err = validateField(field, value);
    setFieldErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleChange = (field, value) => {
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    if (touched[field]) {
      const err = validateField(field, value);
      setFieldErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const validate = () => {
    const errors = {
      email: validateField('email', email),
      password: validateField('password', password),
    };
    setFieldErrors(errors);
    setTouched({ email: true, password: true });
    return !errors.email && !errors.password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <img src="/assets/images/logo.png" alt="UtilityTracker" className="h-8 w-8 rounded-lg object-cover" />
        </div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          {t('app.name')}
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          {t('app.tagline')}
        </p>
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground">{t('auth.signIn')}</h2>
            <p className="text-[13px] text-muted-foreground mt-1">
              {t('auth.signInSubtitle')}
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <HiExclamationCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                required
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                autoComplete="email"
                className={`h-11 ${
                  touched.email && fieldErrors.email
                    ? 'border-destructive focus-visible:ring-destructive'
                    : ''
                }`}
              />
              {touched.email && fieldErrors.email && (
                <p className="text-xs text-destructive mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  autoComplete="current-password"
                  className={`h-11 pr-11 ${
                    touched.password && fieldErrors.password
                      ? 'border-destructive focus-visible:ring-destructive'
                      : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPassword ? (
                    <HiOutlineEyeSlash className="h-4 w-4" />
                  ) : (
                    <HiOutlineEye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {touched.password && fieldErrors.password && (
                <p className="text-xs text-destructive mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                className="w-full h-11 font-medium"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t('auth.signingIn')}
                  </span>
                ) : (
                  t('auth.signIn')
                )}
              </Button>
            </motion.div>
          </form>

          <p className="text-center text-[13px] text-muted-foreground mt-6 py-2">
            {t('auth.noAccount')}{' '}
            <Link
              to="/register"
              className="font-medium text-primary hover:underline transition-colors inline-block py-1"
            >
              {t('auth.createOne')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </>
  );
}
