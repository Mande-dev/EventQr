import { memoire } from './memoire'
import type { Utilisateur } from '@/types'
import { simulerDelai } from './delai'

// Met à jour le profil de l'utilisateur connecté (mock mémoire).
export const mettreAJourProfil = async (
  idUtilisateur: string,
  donnees: Pick<Utilisateur, 'nom' | 'prenom' | 'email' | 'telephone'>
): Promise<Utilisateur> => {
  const index = memoire.utilisateurs.findIndex(
    (item) => item.id_utilisateur === idUtilisateur
  )
  if (index < 0) {
    await simulerDelai(null)
    throw new Error('Profil introuvable.')
  }
  memoire.utilisateurs[index] = {
    ...memoire.utilisateurs[index],
    ...donnees,
  }
  return simulerDelai(structuredClone(memoire.utilisateurs[index]))
}

// Change le mot de passe après vérification de l'ancien.
export const changerMotDePasse = async (
  idUtilisateur: string,
  ancienMotDePasse: string,
  nouveauMotDePasse: string
): Promise<void> => {
  const index = memoire.utilisateurs.findIndex(
    (item) => item.id_utilisateur === idUtilisateur
  )
  if (index < 0) {
    await simulerDelai(null)
    throw new Error('Utilisateur introuvable.')
  }
  if (memoire.utilisateurs[index].mot_de_passe !== ancienMotDePasse) {
    await simulerDelai(null)
    throw new Error('Ancien mot de passe incorrect.')
  }
  memoire.utilisateurs[index].mot_de_passe = nouveauMotDePasse
  await simulerDelai(undefined)
}
