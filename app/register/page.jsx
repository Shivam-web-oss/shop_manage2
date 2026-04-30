/**
 * BEGINNER NOTES
 * File: app/register/page.jsx
 * Purpose: Next.js route file for `/register`.
 * Data sources: The actual registration UI and API call live in `app/src/registration.jsx`.
 * Why this exists: Keeps routing separate from the larger registration form component.
 */

import RegistrationPage from '../src/registration'

export default function RegisterRoute() {
  // Render the reusable registration screen at the `/register` URL.
  return <RegistrationPage />
}
