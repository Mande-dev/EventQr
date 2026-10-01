import { memoire } from './memoire'
import type { Utilisateur } from '@/types'
import { simulerDelai } from './delai'

export type DonneesCreationOrganisateur = {
  nom: string
  prenom: string
  email: string
  telephone: string
  mot_de_passe: string
  actif?: boolean
}

// Retourne la liste complète des utilisateurs (sans filtrer le MDP côté service).
export const listerUtilisateurs = async (): Promise<Utilisateur[]> =>
  simulerDelai(structuredClone(memoire.utilisateurs))

// Récupère un utilisateur par identifiant.
export const obtenirUtilisateur = async (
  idUtilisateur: string
): Promise<Utilisateur | null> => {
  const trouve = memoire.utilisateurs.find(
    (item) => item.id_utilisateur === idUtilisateur
  )
  return simulerDelai(trouve ? structuredClone(trouve) : null)
}

// Crée un organisateur uniquement (jamais un super_admin).
export const creerUtilisateur = async (
  donnees: DonneesCreationOrganisateur
): Promise<Utilisateur> => {
  const emailExiste = memoire.utilisateurs.some(
    (item) => item.email.toLowerCase() === donnees.email.toLowerCase()
  )
  if (emailExiste) {
    await simulerDelai(null)
    throw new Error('Un compte existe déjà avec cet e-mail.')
  }

  const nouveau: Utilisateur = {
    id_utilisateur: `usr-${String(Date.now()).slice(-6)}`,
    nom: donnees.nom,
    prenom: donnees.prenom,
    email: donnees.email,
    telephone: donnees.telephone,
    mot_de_passe: donnees.mot_de_passe,
    role_systeme: 'organisateur',
    actif: donnees.actif ?? true,
    date_creation: new Date().toISOString(),
  }
  memoire.utilisateurs = [nouveau, ...memoire.utilisateurs]
  return simulerDelai(structuredClone(nouveau))
}

// Active ou désactive un utilisateur (hors super_admin connecté géré côté UI).
export const basculerStatutUtilisateur = async (
  idUtilisateur: string
): Promise<Utilisateur> => {
  const index = memoire.utilisateurs.findIndex(
    (item) => item.id_utilisateur === idUtilisateur
  )
  if (index < 0) {
    await simulerDelai(null)
    throw new Error('Utilisateur introuvable.')
  }

  if (memoire.utilisateurs[index].role_systeme === 'super_admin') {
    await simulerDelai(null)
    throw new Error(
      'Le compte super administrateur ne peut pas être désactivé ici.'
    )
  }

  memoire.utilisateurs[index] = {
    ...memoire.utilisateurs[index],
    actif: !memoire.utilisateurs[index].actif,
  }
  return simulerDelai(structuredClone(memoire.utilisateurs[index]))
}
