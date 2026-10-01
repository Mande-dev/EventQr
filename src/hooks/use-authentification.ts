import { create } from 'zustand'
import type { Utilisateur } from '@/types'
import {
  connecter as serviceConnecter,
  deconnecter as serviceDeconnecter,
  lireSession,
  type SessionAuthentifiee,
} from '@/services/authentification'

type UtilisateurSession = Omit<Utilisateur, 'mot_de_passe'>

type EtatAuthentification = {
  utilisateur: UtilisateurSession | null
  jeton: string
  estCharge: boolean
  connecter: (email: string, motDePasse: string) => Promise<void>
  deconnecter: () => Promise<void>
  restaurerSession: () => void
  definirUtilisateur: (utilisateur: UtilisateurSession) => void
}

// Applique une session authentifiée dans le store.
const appliquerSession = (
  session: SessionAuthentifiee | null
): Pick<EtatAuthentification, 'utilisateur' | 'jeton'> => ({
  utilisateur: session?.utilisateur ?? null,
  jeton: session?.jeton ?? '',
})

// Store d'authentification simulée (sessionStorage, super_admin ou organisateur).
export const useAuthentification = create<EtatAuthentification>((set) => ({
  ...appliquerSession(null),
  estCharge: false,

  connecter: async (email, motDePasse) => {
    const session = await serviceConnecter(email.trim(), motDePasse.trim())
    set({ ...appliquerSession(session), estCharge: true })
  },

  deconnecter: async () => {
    await serviceDeconnecter()
    set({ utilisateur: null, jeton: '', estCharge: true })
  },

  restaurerSession: () => {
    set({ ...appliquerSession(lireSession()), estCharge: true })
  },

  definirUtilisateur: (utilisateur) => {
    const session = lireSession()
    if (!session) return
    const nouvelleSession = { ...session, utilisateur }
    sessionStorage.setItem('eventqr_session', JSON.stringify(nouvelleSession))
    set({ utilisateur })
  },
}))
