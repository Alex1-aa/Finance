import { useState, type FormEvent, type ReactNode } from 'react'
import { ArrowRight, CircleAlert, LogIn, LogOut, ShieldCheck, UserPlus } from 'lucide-react'
import App from './App'
import { getCurrentUser, signIn, signOut, signUp, type User } from './auth'

type AuthMode = 'signin' | 'signup'

export default function AuthGate() {
  const [user, setUser] = useState<User | null>(getCurrentUser)
  const [mode, setMode] = useState<AuthMode>('signin')
  const [signedOut, setSignedOut] = useState(false)

  if (user) {
    return (
      <App
        user={user}
        onSignOut={() => {
          signOut()
          setUser(null)
          setSignedOut(true)
        }}
      />
    )
  }

  if (signedOut) {
    return (
      <SignedOutPage
        onSignIn={() => {
          setMode('signin')
          setSignedOut(false)
        }}
      />
    )
  }

  return <AuthPage mode={mode} onModeChange={setMode} onAuthenticated={setUser} />
}

function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell">
      <section className="auth-intro" aria-hidden="true">
        <div className="brand-lockup">
          <div className="brand-mark">
            <span />
            <span />
          </div>
          <div>
            <span className="brand-name">Alex</span>
            <span className="brand-tag">money, made legible.</span>
          </div>
        </div>
        <div className="auth-intro-copy">
          <div className="eyebrow">
            PERSONAL FINANCE <span className="eyebrow-line" />
          </div>
          <h1>
            Your spending has a shape<span className="heading-period">.</span>
          </h1>
          <p>Budgets, goals, and every transaction in one calm, clear view.</p>
        </div>
        <div className="auth-intro-foot">
          <ShieldCheck size={15} />
          <span>Demo accounts are stored only in this browser.</span>
        </div>
      </section>
      <main className="auth-main">{children}</main>
    </div>
  )
}

function AuthPage({
  mode,
  onModeChange,
  onAuthenticated,
}: {
  mode: AuthMode
  onModeChange: (mode: AuthMode) => void
  onAuthenticated: (user: User) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const isSignUp = mode === 'signup'

  const switchMode = (nextMode: AuthMode) => {
    setError('')
    setPassword('')
    onModeChange(nextMode)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const user = isSignUp
        ? await signUp({ name, email, password })
        : await signIn({ email, password })
      onAuthenticated(user)
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Something went wrong.')
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="auth-tabs" role="tablist" aria-label="Account">
          <button
            role="tab"
            aria-selected={!isSignUp}
            className={!isSignUp ? 'active' : ''}
            onClick={() => switchMode('signin')}
          >
            <LogIn size={14} /> Sign in
          </button>
          <button
            role="tab"
            aria-selected={isSignUp}
            className={isSignUp ? 'active' : ''}
            onClick={() => switchMode('signup')}
          >
            <UserPlus size={14} /> Sign up
          </button>
        </div>

        <div className="panel-kicker">{isSignUp ? 'NEW ACCOUNT' : 'WELCOME BACK'}</div>
        <h2>{isSignUp ? 'Create your account' : 'Sign in to your workspace'}</h2>
        <p className="auth-subtitle">
          {isSignUp
            ? 'Set up a personal workspace in under a minute.'
            : 'Pick up right where you left your numbers.'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {isSignUp && (
            <label>
              Full name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                placeholder="Ada Lovelace"
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              placeholder={isSignUp ? 'At least 8 characters' : '••••••••'}
            />
          </label>

          {error && (
            <div className="form-error" role="alert">
              <CircleAlert size={14} /> {error}
            </div>
          )}

          <button className="primary-button auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
            {!submitting && <ArrowRight size={16} />}
          </button>
        </form>

        <p className="auth-switch">
          {isSignUp ? 'Already have an account?' : 'New here?'}{' '}
          <button
            className="text-button"
            onClick={() => switchMode(isSignUp ? 'signin' : 'signup')}
          >
            {isSignUp ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </div>
    </AuthLayout>
  )
}

function SignedOutPage({ onSignIn }: { onSignIn: () => void }) {
  return (
    <AuthLayout>
      <div className="auth-card auth-card-centered">
        <div className="auth-signout-icon">
          <LogOut size={20} />
        </div>
        <div className="panel-kicker">SESSION ENDED</div>
        <h2>You’ve been signed out</h2>
        <p className="auth-subtitle">
          Your workspace is locked. Sign back in whenever you’re ready to pick it up again.
        </p>
        <button className="primary-button auth-submit" onClick={onSignIn}>
          Sign in again <ArrowRight size={16} />
        </button>
      </div>
    </AuthLayout>
  )
}
