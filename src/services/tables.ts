import { genererId, memoire } from './memoire'
import { simulerDelai } from './delai'
import type { Affectation, Invite, TableEvenement } from '@/types'

export type TableEnrichie = TableEvenement & {
  places_occupees: number
  places_disponibles: number
  invites: Invite[]
}

export type DonneesTable = {
  numero_table: number
  nom_table: string
  capacite: number
}

/** Calcule les places occupées d'une table. */
function calculerOccupation(idTable: string): {
  places_occupees: number
  invites: Invite[]
} {
  const affectations = memoire.affectations.filter((a) => a.id_table === idTable)
  const invites = affectations
    .map((a) => memoire.invites.find((i) => i.id_invite === a.id_invite))
    .filter((i): i is Invite => Boolean(i))
  const places_occupees = invites.length
  return { places_occupees, invites }
}

/** Liste les tables d'un événement avec occupation. */
export const listerTables = async (
  idEvenement: string
): Promise<TableEnrichie[]> => {
  const tables = memoire.tables
    .filter((t) => t.id_evenement === idEvenement)
    .sort((a, b) => a.numero_table - b.numero_table)
    .map((table) => {
      const { places_occupees, invites } = calculerOccupation(table.id_table)
      return {
        ...table,
        places_occupees,
        places_disponibles: Math.max(0, table.capacite - places_occupees),
        invites,
      }
    })
  return simulerDelai(structuredClone(tables))
}

/** Crée une table pour un événement. */
export const creerTable = async (
  idEvenement: string,
  donnees: DonneesTable
): Promise<TableEvenement> => {
  const nom_table = donnees.nom_table.trim()
  if (!nom_table) {
    await simulerDelai(null)
    throw new Error('Le nom de la table est obligatoire.')
  }
  if (donnees.capacite < 1) {
    await simulerDelai(null)
    throw new Error('La capacité doit être au moins 1.')
  }
  const conflitNumero = memoire.tables.some(
    (t) =>
      t.id_evenement === idEvenement && t.numero_table === donnees.numero_table
  )
  if (conflitNumero) {
    await simulerDelai(null)
    throw new Error('Ce numéro de table existe déjà.')
  }
  const conflitNom = memoire.tables.some(
    (t) =>
      t.id_evenement === idEvenement &&
      t.nom_table.trim().toLowerCase() === nom_table.toLowerCase()
  )
  if (conflitNom) {
    await simulerDelai(null)
    throw new Error('Ce nom de table existe déjà.')
  }
  const nouvelle: TableEvenement = {
    id_table: genererId('tbl'),
    id_evenement: idEvenement,
    numero_table: donnees.numero_table,
    nom_table,
    capacite: donnees.capacite,
  }
  memoire.tables = [...memoire.tables, nouvelle]
  return simulerDelai(structuredClone(nouvelle))
}

/** Modifie une table (capacité ≥ places occupées). */
export const modifierTable = async (
  idTable: string,
  donnees: DonneesTable
): Promise<TableEvenement> => {
  const index = memoire.tables.findIndex((t) => t.id_table === idTable)
  if (index < 0) {
    await simulerDelai(null)
    throw new Error('Table introuvable.')
  }
  const nom_table = donnees.nom_table.trim()
  if (!nom_table) {
    await simulerDelai(null)
    throw new Error('Le nom de la table est obligatoire.')
  }
  const { places_occupees } = calculerOccupation(idTable)
  if (donnees.capacite < places_occupees) {
    await simulerDelai(null)
    throw new Error(
      `Impossible de réduire sous ${places_occupees} place(s) déjà occupée(s).`
    )
  }
  const table = memoire.tables[index]
  const conflitNumero = memoire.tables.some(
    (t) =>
      t.id_evenement === table.id_evenement &&
      t.numero_table === donnees.numero_table &&
      t.id_table !== idTable
  )
  if (conflitNumero) {
    await simulerDelai(null)
    throw new Error('Ce numéro de table existe déjà.')
  }
  const conflitNom = memoire.tables.some(
    (t) =>
      t.id_evenement === table.id_evenement &&
      t.id_table !== idTable &&
      t.nom_table.trim().toLowerCase() === nom_table.toLowerCase()
  )
  if (conflitNom) {
    await simulerDelai(null)
    throw new Error('Ce nom de table existe déjà.')
  }
  memoire.tables[index] = {
    ...table,
    numero_table: donnees.numero_table,
    nom_table,
    capacite: donnees.capacite,
  }
  return simulerDelai(structuredClone(memoire.tables[index]))
}

/** Supprime une table et ses affectations. */
export const supprimerTable = async (idTable: string): Promise<void> => {
  const existe = memoire.tables.some((t) => t.id_table === idTable)
  if (!existe) {
    await simulerDelai(null)
    throw new Error('Table introuvable.')
  }
  memoire.tables = memoire.tables.filter((t) => t.id_table !== idTable)
  memoire.affectations = memoire.affectations.filter(
    (a) => a.id_table !== idTable
  )
  await simulerDelai(undefined)
}

/** Liste les invités non affectés d'un événement. */
export const listerInvitesNonAffectes = async (
  idEvenement: string
): Promise<Invite[]> => {
  const idsAffectes = new Set(memoire.affectations.map((a) => a.id_invite))
  const liste = memoire.invites.filter(
    (i) => i.id_evenement === idEvenement && !idsAffectes.has(i.id_invite)
  )
  return simulerDelai(structuredClone(liste))
}

/**
 * Affecte tous les membres d’une invitation à une table (capacité ≥ N places).
 * Unité indivisible : tout le monde ou erreur.
 */
export const affecterGroupeParInvitation = async (
  idInvitation: string,
  idTable: string
): Promise<Affectation[]> => {
  const invitation = memoire.invitations.find(
    (i) => i.id_invitation === idInvitation
  )
  const table = memoire.tables.find((t) => t.id_table === idTable)
  if (!invitation || !table) {
    await simulerDelai(null)
    throw new Error('Invitation ou table introuvable.')
  }
  if (invitation.id_evenement !== table.id_evenement) {
    await simulerDelai(null)
    throw new Error(
      "L'invitation et la table n'appartiennent pas au même événement."
    )
  }

  const ids = invitation.ids_invites
  const { places_occupees } = calculerOccupation(idTable)
  const dejaSurTable = memoire.affectations.filter(
    (a) => a.id_table === idTable && ids.includes(a.id_invite)
  ).length
  const placesNecessaires = ids.length - dejaSurTable
  if (places_occupees - dejaSurTable + ids.length > table.capacite) {
    await simulerDelai(null)
    throw new Error(
      `Capacité insuffisante : ${ids.length} place(s) requise(s), ${table.capacite - (places_occupees - dejaSurTable)} libre(s).`
    )
  }
  void placesNecessaires

  const maintenant = new Date().toISOString()
  memoire.affectations = memoire.affectations.filter(
    (a) => !ids.includes(a.id_invite)
  )
  const nouvelles: Affectation[] = ids.map((idInvite) => ({
    id_affectation: genererId('aff'),
    id_invite: idInvite,
    id_table: idTable,
    date_affectation: maintenant,
  }))
  memoire.affectations = [...memoire.affectations, ...nouvelles]
  return simulerDelai(structuredClone(nouvelles))
}

/**
 * Affecte un invité à une table.
 * Si membre d’un couple/famille/groupe : affecte tout le groupe.
 */
export const affecterInvite = async (
  idInvite: string,
  idTable: string,
  forcer = false
): Promise<Affectation> => {
  const invitation = memoire.invitations.find((inv) =>
    inv.ids_invites.includes(idInvite)
  )
  if (invitation && invitation.ids_invites.length > 1) {
    const affectations = await affecterGroupeParInvitation(
      invitation.id_invitation,
      idTable
    )
    const cible =
      affectations.find((a) => a.id_invite === idInvite) ?? affectations[0]
    return cible
  }

  const invite = memoire.invites.find((i) => i.id_invite === idInvite)
  const table = memoire.tables.find((t) => t.id_table === idTable)
  if (!invite || !table) {
    await simulerDelai(null)
    throw new Error('Invité ou table introuvable.')
  }
  if (invite.id_evenement !== table.id_evenement) {
    await simulerDelai(null)
    throw new Error("L'invité et la table n'appartiennent pas au même événement.")
  }

  const { places_occupees } = calculerOccupation(idTable)
  const ancienne = memoire.affectations.find((a) => a.id_invite === idInvite)
  let occupationSansInvite = places_occupees
  if (ancienne?.id_table === idTable) {
    occupationSansInvite -= 1
  }

  if (!forcer && occupationSansInvite + 1 > table.capacite) {
    await simulerDelai(null)
    throw new Error(
      `Capacité dépassée : ${occupationSansInvite + 1}/${table.capacite}.`
    )
  }

  memoire.affectations = memoire.affectations.filter(
    (a) => a.id_invite !== idInvite
  )
  const nouvelle: Affectation = {
    id_affectation: genererId('aff'),
    id_invite: idInvite,
    id_table: idTable,
    date_affectation: new Date().toISOString(),
  }
  memoire.affectations = [...memoire.affectations, nouvelle]
  return simulerDelai(structuredClone(nouvelle))
}

/**
 * Retire l'affectation d'un invité.
 * Si membre d’un couple/famille/groupe : retire tout le groupe.
 */
export const retirerAffectation = async (idInvite: string): Promise<void> => {
  const invitation = memoire.invitations.find((inv) =>
    inv.ids_invites.includes(idInvite)
  )
  if (invitation && invitation.ids_invites.length > 1) {
    const ids = new Set(invitation.ids_invites)
    memoire.affectations = memoire.affectations.filter(
      (a) => !ids.has(a.id_invite)
    )
    await simulerDelai(undefined)
    return
  }
  memoire.affectations = memoire.affectations.filter(
    (a) => a.id_invite !== idInvite
  )
  await simulerDelai(undefined)
}

/** Liste toutes les affectations enrichies d'un événement. */
export const listerAffectations = async (
  idEvenement: string
): Promise<
  Array<Affectation & { invite: Invite; table: TableEvenement }>
> => {
  const idsInvites = new Set(
    memoire.invites
      .filter((i) => i.id_evenement === idEvenement)
      .map((i) => i.id_invite)
  )
  const liste = memoire.affectations
    .filter((a) => idsInvites.has(a.id_invite))
    .map((a) => {
      const invite = memoire.invites.find((i) => i.id_invite === a.id_invite)!
      const table = memoire.tables.find((t) => t.id_table === a.id_table)!
      return { ...a, invite, table }
    })
    .filter((a) => a.invite && a.table)
  return simulerDelai(structuredClone(liste))
}
