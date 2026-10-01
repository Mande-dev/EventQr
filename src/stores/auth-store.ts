import { create } from 'zustand'
import { useAuthentification } from '@/hooks/use-authentification'

interface AuthUser {
  accountNo: string
  email: string
  role: string[]
  exp: number
}

interface AuthState {
  auth: {
    user: AuthUser | null
    setUser: (user: AuthUser | null) => void
    accessToken: string
    setAccessToken: (accessToken: string) => void
    resetAccessToken: () => void
    reset: () => void
  }
}

// Construit un utilisateur legacy à partir de la session EventQR.
const depuisSession = (): {
  user: AuthUser | null
  accessToken: string
} => {
  const { utilisateur, jeton } = useAuthentification.getState()
  if (!utilisateur) {
    return { user: null, accessToken: '' }
  }
  return {
    user: {
      accountNo: utilisateur.id_utilisateur,
      email: utilisateur.email,
      role: [utilisateur.role_systeme],
      exp: Date.now() + 24 * 60 * 60 * 1000,
    },
    accessToken: jeton,
  }
}

// Pont de compatibilité avec le store d'auth du template.
export const useAuthStore = create<AuthState>()((set) => {
  const initial = depuisSession()
  return {
    auth: {
      user: initial.user,
      setUser: (user) =>
        set((state) => ({ ...state, auth: { ...state.auth, user } })),
      accessToken: initial.accessToken,
      setAccessToken: (accessToken) =>
        set((state) => ({
          ...state,
          auth: { ...state.auth, accessToken },
        })),
      resetAccessToken: () => {
        void useAuthentification.getState().deconnecter()
        set((state) => ({
          ...state,
          auth: { ...state.auth, accessToken: '' },
        }))
      },
      reset: () => {
        void useAuthentification.getState().deconnecter()
        set((state) => ({
          ...state,
          auth: { ...state.auth, user: null, accessToken: '' },
        }))
      },
    },
  }
})
