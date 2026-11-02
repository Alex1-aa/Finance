// Browser-only accounts for the demo: users and the current session live in
// localStorage, and passwords are stored as salted PBKDF2 hashes. This keeps the
// app deployable as a static site, but it is not a substitute for a real auth server.
export type User = {
  id: string
  name: string
  email: string
  createdAt: string
}

type StoredUser = User & {
  salt: string
  passwordHash: string
}

const USERS_KEY = 'finance.users'
const SESSION_KEY = 'finance.session'

function readUsers(): StoredUser[] {
  try {
    const stored = JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]')
    return Array.isArray(stored) ? stored : []
  } catch {
    return []
  }
}

function writeUsers(users: StoredUser[]) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } catch {
    throw new Error('Your browser is blocking storage, so accounts can’t be saved.')
  }
}

function toPublicUser({ id, name, email, createdAt }: StoredUser): User {
  return { id, name, email, createdAt }
}

function toHex(bytes: ArrayBuffer | Uint8Array) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function hashPassword(password: string, salt: string) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Signing in needs a secure connection (HTTPS or localhost).')
  }
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 100_000 },
    key,
    256,
  )
  return toHex(bits)
}

function startSession(userId: string) {
  try {
    localStorage.setItem(SESSION_KEY, userId)
  } catch {
    // Without storage the session simply won't survive a reload.
  }
}

const normaliseEmail = (email: string) => email.trim().toLowerCase()

export function getCurrentUser(): User | null {
  try {
    const userId = localStorage.getItem(SESSION_KEY)
    const user = readUsers().find((item) => item.id === userId)
    return user ? toPublicUser(user) : null
  } catch {
    return null
  }
}

export async function signUp(input: { name: string; email: string; password: string }) {
  const name = input.name.trim()
  const email = normaliseEmail(input.email)

  if (!name) throw new Error('Enter your name.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.')
  if (input.password.length < 8) throw new Error('Use at least 8 characters for your password.')

  const users = readUsers()
  if (users.some((user) => user.email === email)) {
    throw new Error('An account with this email already exists. Try signing in.')
  }

  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)))
  const user: StoredUser = {
    id: crypto.randomUUID(),
    name,
    email,
    createdAt: new Date().toISOString(),
    salt,
    passwordHash: await hashPassword(input.password, salt),
  }

  writeUsers([...users, user])
  startSession(user.id)
  return toPublicUser(user)
}

export async function signIn(input: { email: string; password: string }) {
  const email = normaliseEmail(input.email)
  if (!email || !input.password) throw new Error('Enter your email and password.')

  const user = readUsers().find((item) => item.email === email)
  // Same message for an unknown email and a wrong password, so neither is revealed.
  if (!user || (await hashPassword(input.password, user.salt)) !== user.passwordHash) {
    throw new Error('Email or password is incorrect.')
  }

  startSession(user.id)
  return toPublicUser(user)
}

export function signOut() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // Nothing stored, so there is nothing to clear.
  }
}

export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}
