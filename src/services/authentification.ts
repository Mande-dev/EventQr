import { memoire } from './memoire'
import type { RoleEvenement, Utilisateur } from '@/types'
import { simulerDelai } from './delai'

export type SessionAuthentifiee = {
  utilisateur: Omit<Utilisateur, 'mot_de_passe'>
  jeton: string
}

const CLE_SESSION = 'eventqr_session'

/**
 * Alias e-mail de démo → e-mail canonique du mock.
 * Évite les échecs si l’ancien e-mail marie.kasongo est encore saisi.
 */
const ALIAS_EMAIL_DEMO: Record<string, string> = {
  'marie.kasongo@email.cd': 'organisateur@eventqr.com',
}

/**
 * Alias mot de passe de démo pour le compte organisateur principal.
 * Accepte l’ancien mot de passe Marie2024! en plus du canonique.
 */
const ALIAS_MOT_DE_PASSE_DEMO: Record<string, string[]> = {
  'organisateur@eventqr.com': ['Organisateur123!', 'Marie2024!'],
}

// Retire le mot de passe avant exposition côté interface.
const sansMotDePasse = (
  utilisateur: Utilisateur
): Omit<Utilisateur, 'mot_de_passe'> => {
  const { mot_de_passe: _motDePasse, ...reste } = utilisateur
  return reste
}

/** Migre l'ancienne clé de session super_admin si présente. */
function migrerAncienneSession(): void {
  const ancienne = sessionStorage.getItem('eventqr_session_super_admin')
  if (ancienne && !sessionStorage.getItem(CLE_SESSION)) {
    sessionStorage.setItem(CLE_SESSION, ancienne)
    sessionStorage.removeItem('eventqr_session_super_admin')
  }
}

/** Normalise l’e-mail saisi (trim, minuscules, alias démo). */
function normaliserEmail(email: string): string {
  const brut = email.trim().toLowerCase()
  return ALIAS_EMAIL_DEMO[brut] ?? brut
}

/** Vérifie le mot de passe (canonique ou alias démo). */
function motDePasseValide(
  emailCanonique: string,
  motDePasseStocke: string,
  motDePasseSaisi: string
): boolean {
  const saisi = motDePasseSaisi.trim()
  if (motDePasseStocke === saisi) return true
  const alias = ALIAS_MOT_DE_PASSE_DEMO[emailCanonique]
  return Boolean(alias?.includes(saisi))
}

/** Rôles d'événement de l'utilisateur connecté. */
export const listerRolesEvenementUtilisateur = (
  idUtilisateur: string
): RoleEvenement[] =>
  memoire.utilisateursEvenements
    .filter((item) => item.id_utilisateur === idUtilisateur)
    .map((item) => item.role_evenement)

// Authentifie un super administrateur ou un organisateur à partir des mocks.
export const connecter = async (
  email: string,
  motDePasse: string
): Promise<SessionAuthentifiee> => {
  migrerAncienneSession()

  const emailCanonique = normaliserEmail(email)
  const utilisateur = memoire.utilisateurs.find(
    (item) => item.email.toLowerCase() === emailCanonique
  )

  if (
    !utilisateur ||
    !motDePasseValide(emailCanonique, utilisateur.mot_de_passe, motDePasse)
  ) {
    await simulerDelai(null)
    throw new Error('Identifiants incorrects.')
  }

  if (!utilisateur.actif) {
    await simulerDelai(null)
    throw new Error('Ce compte est désactivé.')
  }

  if (
    utilisateur.role_systeme !== 'super_admin' &&
    utilisateur.role_systeme !== 'organisateur'
  ) {
    await simulerDelai(null)
    throw new Error('Accès non autorisé.')
  }

  const session: SessionAuthentifiee = {
    utilisateur: sansMotDePasse(utilisateur),
    jeton: `jeton-${utilisateur.id_utilisateur}-${Date.now()}`,
  }

  sessionStorage.setItem(CLE_SESSION, JSON.stringify(session))
  return simulerDelai(session)
}

// Restaure la session depuis le stockage de session.
export const lireSession = (): SessionAuthentifiee | null => {
  migrerAncienneSession()
  const brut = sessionStorage.getItem(CLE_SESSION)
  if (!brut) return null
  try {
    return JSON.parse(brut) as SessionAuthentifiee
  } catch {
    sessionStorage.removeItem(CLE_SESSION)
    return null
  }
}

// Supprime la session courante.
export const deconnecter = async (): Promise<void> => {
  sessionStorage.removeItem(CLE_SESSION)
  sessionStorage.removeItem('eventqr_session_super_admin')
  await simulerDelai(undefined, 200)
}
