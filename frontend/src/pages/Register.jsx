import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { HiOutlineEye, HiOutlineEyeSlash, HiExclamationCircle } from 'react-icons/hi2';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});

  const getFieldValue = (field) => {
    if (field === 'email') return email;
    if (field === 'password') return password;
    if (field === 'confirmPassword') return confirmPassword;
    return '';
  };

  const validateField = (field, value) => {
    switch (field) {
      case 'email':
        if (!value.trim()) return t('auth.validation.emailRequired');
        if (!EMAIL_REGEX.test(value.trim())) return t('auth.validation.emailInvalid');
        return '';
      case 'password':
        if (!value) return t('auth.validation.passwordRequired');
        if (value.length < 6) return t('auth.validation.passwordMinLength');
        return '';
      case 'confirmPassword':
        if (!value) return t('auth.validation.confirmPasswordRequired');
        if (value !== password) return t('auth.validation.passwordsMismatch');
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = getFieldValue(field);
    const err = validateField(field, value);
    setFieldErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleChange = (field, value) => {
    if (field === 'email') setEmail(value);
    if (field === 'password') {
      setPassword(value);
      if (touched.confirmPassword && confirmPassword) {
        const confirmErr = value !== confirmPassword ? t('auth.validation.passwordsMismatch') : '';
        setFieldErrors((prev) => ({ ...prev, confirmPassword: confirmErr }));
      }
    }
    if (field === 'confirmPassword') setConfirmPassword(value);
    if (touched[field]) {
      const err = validateField(field, field === 'confirmPassword' ? value : value);
      setFieldErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const validate = () => {
    const errors = {
      email: validateField('email', email),
      password: validateField('password', password),
      confirmPassword: validateField('confirmPassword', confirmPassword),
    };
    setFieldErrors(errors);
    setTouched({ email: true, password: true, confirmPassword: true });
    return !errors.email && !errors.password && !errors.confirmPassword;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await register(email.trim(), password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {t('app.name')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('app.tagline')}
        </p>
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">{t('auth.createAccount')}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t('auth.createAccountSubtitle')}
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <HiExclamationCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                autoComplete="email"
                className={`h-12 text-base ${
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
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  autoComplete="new-password"
                  className={`h-12 text-base pr-12 ${
                    touched.password && fieldErrors.password
                      ? 'border-destructive focus-visible:ring-destructive'
                      : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPassword ? (
                    <HiOutlineEyeSlash className="h-5 w-5" />
                  ) : (
                    <HiOutlineEye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {touched.password && fieldErrors.password && (
                <p className="text-xs text-destructive mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  autoComplete="new-password"
                  className={`h-12 text-base pr-12 ${
                    touched.confirmPassword && fieldErrors.confirmPassword
                      ? 'border-destructive focus-visible:ring-destructive'
                      : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showConfirmPassword ? (
                    <HiOutlineEyeSlash className="h-5 w-5" />
                  ) : (
                    <HiOutlineEye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {touched.confirmPassword && fieldErrors.confirmPassword && (
                <p className="text-xs text-destructive mt-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t('auth.creatingAccount')}
                </span>
              ) : (
                t('auth.createAccount')
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6 py-2">
            {t('auth.hasAccount')}{' '}
            <Link
              to="/login"
              className="font-medium text-primary hover:underline transition-colors inline-block py-1"
            >
              {t('auth.signIn')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </>
  );
}
