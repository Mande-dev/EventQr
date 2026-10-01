import { Navigate } from '@tanstack/react-router'

// Ancienne page template : redirige vers la connexion EventQR.
export function SignIn() {
  return <Navigate to='/connexion' />
}
