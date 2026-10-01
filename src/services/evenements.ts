import { genererId, memoire } from './memoire'
import { simulerDelai } from './delai'
import type { Evenement, TypeEvenement, UtilisateurEvenement } from '@/types'

export type DonneesEvenement = {
  nom_evenement: string
  type_evenement: TypeEvenement
  date_evenement: string
  heure_evenement: string
  lieu: string
}

export type DetailEvenement = {
  evenement: Evenement
  proprietaire: (typeof memoire.utilisateurs)[number] | null
  utilisateurs_affectes: Array<
    UtilisateurEvenement & {
      utilisateur: (typeof memoire.utilisateurs)[number] | null
    }
  >
}

/** Liste tous les événements (super admin). */
export const listerEvenements = async (): Promise<Evenement[]> =>
  simulerDelai(structuredClone(memoire.evenements))

/** Liste les événements accessibles à un organisateur (hors agent seul). */
export const listerEvenementsOrganisateur = async (
  idUtilisateur: string
): Promise<Evenement[]> => {
  const ids = new Set(
    memoire.utilisateursEvenements
      .filter(
        (item) =>
          item.id_utilisateur === idUtilisateur &&
          item.role_evenement !== 'Agent de contrôle'
      )
      .map((item) => item.id_evenement)
  )
  const liste = memoire.evenements.filter((e) => ids.has(e.id_evenement))
  return simulerDelai(structuredClone(liste))
}

/** Récupère le détail d'un événement avec propriétaire et affectations. */
export const obtenirDetailEvenement = async (
  idEvenement: string
): Promise<DetailEvenement | null> => {
  const evenement = memoire.evenements.find(
    (item) => item.id_evenement === idEvenement
  )
  if (!evenement) {
    return simulerDelai(null)
  }

  const proprietaire =
    memoire.utilisateurs.find(
      (item) => item.id_utilisateur === evenement.id_utilisateur_proprietaire
    ) ?? null

  const utilisateurs_affectes = memoire.utilisateursEvenements
    .filter((item) => item.id_evenement === idEvenement)
    .map((affectation) => ({
      ...affectation,
      utilisateur:
        memoire.utilisateurs.find(
          (item) => item.id_utilisateur === affectation.id_utilisateur
        ) ?? null,
    }))

  return simulerDelai({
    evenement: structuredClone(evenement),
    proprietaire: proprietaire ? structuredClone(proprietaire) : null,
    utilisateurs_affectes: structuredClone(utilisateurs_affectes),
  })
}

/** Crée un événement et affecte le créateur comme Propriétaire. */
export const creerEvenement = async (
  idProprietaire: string,
  donnees: DonneesEvenement
): Promise<Evenement> => {
  const nouveau: Evenement = {
    id_evenement: genererId('evt'),
    id_utilisateur_proprietaire: idProprietaire,
    ...donnees,
    date_creation: new Date().toISOString(),
  }
  memoire.evenements = [nouveau, ...memoire.evenements]
  memoire.utilisateursEvenements = [
    {
      id_utilisateur_evenement: genererId('ue'),
      id_utilisateur: idProprietaire,
      id_evenement: nouveau.id_evenement,
      role_evenement: 'Propriétaire',
      date_affectation: new Date().toISOString(),
    },
    ...memoire.utilisateursEvenements,
  ]
  return simulerDelai(structuredClone(nouveau))
}

/** Met à jour un événement existant. */
export const modifierEvenement = async (
  idEvenement: string,
  donnees: DonneesEvenement
): Promise<Evenement> => {
  const index = memoire.evenements.findIndex(
    (item) => item.id_evenement === idEvenement
  )
  if (index < 0) {
    await simulerDelai(null)
    throw new Error('Événement introuvable.')
  }
  memoire.evenements[index] = { ...memoire.evenements[index], ...donnees }
  return simulerDelai(structuredClone(memoire.evenements[index]))
}

/** Supprime un événement et ses données liées. */
export const supprimerEvenement = async (
  idEvenement: string
): Promise<void> => {
  const existe = memoire.evenements.some((e) => e.id_evenement === idEvenement)
  if (!existe) {
    await simulerDelai(null)
    throw new Error('Événement introuvable.')
  }

  const idsInvites = new Set(
    memoire.invites
      .filter((i) => i.id_evenement === idEvenement)
      .map((i) => i.id_invite)
  )
  const idsTables = new Set(
    memoire.tables
      .filter((t) => t.id_evenement === idEvenement)
      .map((t) => t.id_table)
  )

  memoire.evenements = memoire.evenements.filter(
    (e) => e.id_evenement !== idEvenement
  )
  memoire.utilisateursEvenements = memoire.utilisateursEvenements.filter(
    (u) => u.id_evenement !== idEvenement
  )
  memoire.invites = memoire.invites.filter(
    (i) => i.id_evenement !== idEvenement
  )
  memoire.tables = memoire.tables.filter((t) => t.id_evenement !== idEvenement)
  memoire.affectations = memoire.affectations.filter(
    (a) => !idsInvites.has(a.id_invite) && !idsTables.has(a.id_table)
  )
  memoire.modeles = memoire.modeles.filter(
    (m) => m.id_evenement !== idEvenement
  )
  await simulerDelai(undefined)
}
