import { genererId, memoire } from './memoire'
import { simulerDelai } from './delai'
import { basculerStatutUtilisateur } from './utilisateurs'
import type { RoleEvenement, Utilisateur, UtilisateurEvenement } from '@/types'

export type UtilisateurEvenementEnrichi = UtilisateurEvenement & {
  utilisateur: Utilisateur | null
}

/** Rôles créables par un organisateur (pas Organisateur système / Super Admin). */
export const ROLES_CREABLES_ORGANISATEUR: ReadonlyArray<RoleEvenement> = [
  'Propriétaire',
  'Agent de contrôle',
]

export type DonneesCreationUtilisateurEvenement = {
  email: string
  telephone: string
  mot_de_passe: string
  role_evenement: RoleEvenement
}

/** Dérive un nom technique depuis l’e-mail (partie locale). */
function nomDepuisEmail(email: string): { nom: string; prenom: string } {
  const local = email.split('@')[0]?.trim() || 'utilisateur'
  const parties = local.split(/[._-]+/).filter(Boolean)
  if (parties.length >= 2) {
    return {
      prenom: parties[0],
      nom: parties.slice(1).join(' '),
    }
  }
  return { prenom: '—', nom: local }
}

/** Liste les utilisateurs affectés à un événement. */
export const listerUtilisateursEvenement = async (
  idEvenement: string
): Promise<UtilisateurEvenementEnrichi[]> => {
  const liste = memoire.utilisateursEvenements
    .filter((item) => item.id_evenement === idEvenement)
    .map((item) => ({
      ...item,
      utilisateur:
        memoire.utilisateurs.find(
          (u) => u.id_utilisateur === item.id_utilisateur
        ) ?? null,
    }))
  return simulerDelai(structuredClone(liste))
}

/**
 * Crée un propriétaire ou un agent (email + tél + mdp) et le lie à l’événement.
 * Interdit : Super Admin, rôle événement Organisateur, doublon e-mail.
 */
export const creerUtilisateurPourEvenement = async (
  idEvenement: string,
  donnees: DonneesCreationUtilisateurEvenement
): Promise<UtilisateurEvenementEnrichi> => {
  const email = donnees.email.trim().toLowerCase()
  const telephone = donnees.telephone.trim()
  const mot_de_passe = donnees.mot_de_passe
  const role = donnees.role_evenement

  if (!email || !telephone || !mot_de_passe) {
    await simulerDelai(null)
    throw new Error('E-mail, téléphone et mot de passe sont obligatoires.')
  }
  if (!ROLES_CREABLES_ORGANISATEUR.includes(role)) {
    await simulerDelai(null)
    throw new Error(
      'L’organisateur ne peut créer que des propriétaires ou des agents de contrôle.'
    )
  }

  const evenement = memoire.evenements.find((e) => e.id_evenement === idEvenement)
  if (!evenement) {
    await simulerDelai(null)
    throw new Error('Événement introuvable.')
  }

  const emailExiste = memoire.utilisateurs.some(
    (u) => u.email.toLowerCase() === email
  )
  if (emailExiste) {
    await simulerDelai(null)
    throw new Error('Un compte existe déjà avec cet e-mail.')
  }

  const { nom, prenom } = nomDepuisEmail(email)
  const utilisateur: Utilisateur = {
    id_utilisateur: genererId('usr'),
    nom,
    prenom,
    email,
    telephone,
    mot_de_passe,
    role_systeme: 'organisateur',
    actif: true,
    date_creation: new Date().toISOString(),
  }
  memoire.utilisateurs = [utilisateur, ...memoire.utilisateurs]

  if (role === 'Propriétaire') {
    memoire.utilisateursEvenements = memoire.utilisateursEvenements.map((u) =>
      u.id_evenement === idEvenement && u.role_evenement === 'Propriétaire'
        ? { ...u, role_evenement: 'Organisateur' as RoleEvenement }
        : u
    )
    evenement.id_utilisateur_proprietaire = utilisateur.id_utilisateur
  }

  const lien: UtilisateurEvenement = {
    id_utilisateur_evenement: genererId('ue'),
    id_utilisateur: utilisateur.id_utilisateur,
    id_evenement: idEvenement,
    role_evenement: role,
    date_affectation: new Date().toISOString(),
  }
  memoire.utilisateursEvenements = [lien, ...memoire.utilisateursEvenements]

  return simulerDelai(
    structuredClone({ ...lien, utilisateur })
  )
}

/**
 * Active ou désactive un utilisateur lié à l’événement
 * (propriétaire / agent / organisateur d’événement — pas Super Admin).
 */
export const basculerActifUtilisateurEvenement = async (
  idUtilisateur: string
): Promise<Utilisateur> => {
  const utilisateur = memoire.utilisateurs.find(
    (u) => u.id_utilisateur === idUtilisateur
  )
  if (!utilisateur) {
    await simulerDelai(null)
    throw new Error('Utilisateur introuvable.')
  }
  if (utilisateur.role_systeme === 'super_admin') {
    await simulerDelai(null)
    throw new Error('Impossible de modifier le Super Admin.')
  }
  return basculerStatutUtilisateur(idUtilisateur)
}

/** @deprecated Préférer creerUtilisateurPourEvenement. */
export const ajouterUtilisateurEvenement = async (
  idEvenement: string,
  idUtilisateur: string,
  role: RoleEvenement
): Promise<UtilisateurEvenement> => {
  if (role === 'Organisateur') {
    await simulerDelai(null)
    throw new Error(
      'Utilisez la création propriétaire / agent. Le rôle Organisateur n’est pas créable ici.'
    )
  }
  const utilisateur = memoire.utilisateurs.find(
    (u) => u.id_utilisateur === idUtilisateur
  )
  if (!utilisateur || utilisateur.role_systeme === 'super_admin') {
    await simulerDelai(null)
    throw new Error('Utilisateur invalide.')
  }
  const existe = memoire.utilisateursEvenements.some(
    (u) =>
      u.id_evenement === idEvenement && u.id_utilisateur === idUtilisateur
  )
  if (existe) {
    await simulerDelai(null)
    throw new Error('Cet utilisateur est déjà affecté à l’événement.')
  }

  if (role === 'Propriétaire') {
    memoire.utilisateursEvenements = memoire.utilisateursEvenements.map(
      (u) =>
        u.id_evenement === idEvenement && u.role_evenement === 'Propriétaire'
          ? { ...u, role_evenement: 'Organisateur' as RoleEvenement }
          : u
    )
    const evt = memoire.evenements.find((e) => e.id_evenement === idEvenement)
    if (evt) evt.id_utilisateur_proprietaire = idUtilisateur
  }

  const nouveau: UtilisateurEvenement = {
    id_utilisateur_evenement: genererId('ue'),
    id_utilisateur: idUtilisateur,
    id_evenement: idEvenement,
    role_evenement: role,
    date_affectation: new Date().toISOString(),
  }
  memoire.utilisateursEvenements = [
    nouveau,
    ...memoire.utilisateursEvenements,
  ]
  return simulerDelai(structuredClone(nouveau))
}

/** Modifie le rôle d'un utilisateur sur un événement (usage admin / legacy). */
export const modifierRoleUtilisateurEvenement = async (
  idUtilisateurEvenement: string,
  role: RoleEvenement
): Promise<UtilisateurEvenement> => {
  const index = memoire.utilisateursEvenements.findIndex(
    (u) => u.id_utilisateur_evenement === idUtilisateurEvenement
  )
  if (index < 0) {
    await simulerDelai(null)
    throw new Error('Affectation introuvable.')
  }
  const courant = memoire.utilisateursEvenements[index]

  if (role === 'Propriétaire') {
    memoire.utilisateursEvenements = memoire.utilisateursEvenements.map(
      (u) =>
        u.id_evenement === courant.id_evenement &&
        u.role_evenement === 'Propriétaire' &&
        u.id_utilisateur_evenement !== idUtilisateurEvenement
          ? { ...u, role_evenement: 'Organisateur' as RoleEvenement }
          : u
    )
    const evt = memoire.evenements.find(
      (e) => e.id_evenement === courant.id_evenement
    )
    if (evt) evt.id_utilisateur_proprietaire = courant.id_utilisateur
  }

  if (
    courant.role_evenement === 'Propriétaire' &&
    role !== 'Propriétaire'
  ) {
    const autresProprietaires = memoire.utilisateursEvenements.filter(
      (u) =>
        u.id_evenement === courant.id_evenement &&
        u.role_evenement === 'Propriétaire' &&
        u.id_utilisateur_evenement !== idUtilisateurEvenement
    )
    if (autresProprietaires.length === 0) {
      await simulerDelai(null)
      throw new Error('Un événement doit toujours avoir un propriétaire.')
    }
  }

  memoire.utilisateursEvenements[index] = {
    ...courant,
    role_evenement: role,
  }
  return simulerDelai(structuredClone(memoire.utilisateursEvenements[index]))
}

/** Retire un utilisateur d'un événement (garde au moins un propriétaire). */
export const retirerUtilisateurEvenement = async (
  idUtilisateurEvenement: string
): Promise<void> => {
  const courant = memoire.utilisateursEvenements.find(
    (u) => u.id_utilisateur_evenement === idUtilisateurEvenement
  )
  if (!courant) {
    await simulerDelai(null)
    throw new Error('Affectation introuvable.')
  }
  if (courant.role_evenement === 'Propriétaire') {
    const autres = memoire.utilisateursEvenements.filter(
      (u) =>
        u.id_evenement === courant.id_evenement &&
        u.role_evenement === 'Propriétaire' &&
        u.id_utilisateur_evenement !== idUtilisateurEvenement
    )
    if (autres.length === 0) {
      await simulerDelai(null)
      throw new Error('Impossible de retirer le dernier propriétaire.')
    }
  }
  memoire.utilisateursEvenements = memoire.utilisateursEvenements.filter(
    (u) => u.id_utilisateur_evenement !== idUtilisateurEvenement
  )
  await simulerDelai(undefined)
}
