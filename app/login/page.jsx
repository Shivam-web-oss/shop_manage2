/**
 * BEGINNER NOTES
 * File: app/login/page.jsx
 * Purpose: Next.js route file for `/login`.
 * Data sources: The actual login UI and form action live in `app/src/login.jsx`.
 * Why this exists: Keeps the route path small while reusing the login screen component.
 */

import LoginPage from '@/login'

export default function Login() {
  // Render the reusable login screen at the `/login` URL.
  return <LoginPage />
}
