import { genererId, memoire } from './memoire'
import { simulerDelai } from './delai'
import {
  creerInvitation,
  estUniteIndivisible,
  libelleInvitation,
  trouverInvitationParInvite,
} from './invitations'
import type { Invite, StatutPresence, TypeInvitation } from '@/types'
import type { InvitationEnrichie } from './invitations'

export type DonneesInvite = {
  nom_complet: string
}

export type DonneesCreationGroupe = {
  type_invitation: TypeInvitation
  /** Un nom (seul), deux noms (couple), ou 2..n (famille/groupe). */
  noms: string[]
  /** Requis pour famille / groupe. */
  libelle_groupe?: string
  /** Table optionnelle : affecte tout le groupe si fournie. */
  id_table?: string
}

export type InviteEnrichi = Invite & {
  id_table: string | null
  numero_table: number | null
  nom_table: string | null
  id_invitation: string | null
  code_qr_invitation: string | null
  type_invitation: TypeInvitation | null
  libelle_groupe: string | null
  ids_membres_groupe: string[]
}

/** Bloc d’affichage : un seul, un couple ou une famille/groupe. */
export type BlocInvite = {
  cle: string
  type_invitation: TypeInvitation
  libelle: string
  invites: InviteEnrichi[]
  id_invitation: string | null
  code_qr: string | null
  libelle_groupe: string | null
  id_table: string | null
  numero_table: number | null
  nom_table: string | null
  statut_presence: StatutPresence
  places: number
}

/** Enrichit un invité avec table et invitation éventuelles. */
function enrichirInvite(invite: Invite): InviteEnrichi {
  const affectation = memoire.affectations.find(
    (a) => a.id_invite === invite.id_invite
  )
  const table = affectation
    ? memoire.tables.find((t) => t.id_table === affectation.id_table)
    : null
  const invitation = trouverInvitationParInvite(invite.id_invite)
  return {
    ...invite,
    id_table: table?.id_table ?? null,
    numero_table: table?.numero_table ?? null,
    nom_table: table?.nom_table ?? null,
    id_invitation: invitation?.id_invitation ?? null,
    code_qr_invitation: invitation?.code_qr ?? null,
    type_invitation: invitation?.type_invitation ?? null,
    libelle_groupe: invitation?.libelle_groupe ?? null,
    ids_membres_groupe: invitation?.ids_invites ?? [invite.id_invite],
  }
}

/** Liste les invités d'un événement avec table / invitation. */
export const listerInvites = async (
  idEvenement: string
): Promise<InviteEnrichi[]> => {
  const invites = memoire.invites
    .filter((i) => i.id_evenement === idEvenement)
    .map(enrichirInvite)
  return simulerDelai(structuredClone(invites))
}

/**
 * Liste les blocs d’invités (seul / couple / famille / groupe) pour l’UI.
 * Un couple ou une famille apparaît comme une seule ligne indivisible.
 */
export const listerBlocsInvites = async (
  idEvenement: string
): Promise<BlocInvite[]> => {
  const invites = memoire.invites
    .filter((i) => i.id_evenement === idEvenement)
    .map(enrichirInvite)

  const vus = new Set<string>()
  const blocs: BlocInvite[] = []

  for (const invite of invites) {
    if (vus.has(invite.id_invite)) continue

    const invitation = trouverInvitationParInvite(invite.id_invite)
    if (invitation) {
      const membres = invitation.ids_invites
        .map((id) => invites.find((i) => i.id_invite === id))
        .filter((i): i is InviteEnrichi => Boolean(i))
      for (const m of membres) vus.add(m.id_invite)

      const premier = membres[0] ?? invite
      blocs.push({
        cle: invitation.id_invitation,
        type_invitation: invitation.type_invitation,
        libelle: libelleInvitation(invitation, membres),
        invites: membres,
        id_invitation: invitation.id_invitation,
        code_qr: invitation.code_qr,
        libelle_groupe: invitation.libelle_groupe ?? null,
        id_table: premier.id_table,
        numero_table: premier.numero_table,
        nom_table: premier.nom_table,
        statut_presence: invitation.statut_presence,
        places: membres.length,
      })
    } else {
      vus.add(invite.id_invite)
      blocs.push({
        cle: invite.id_invite,
        type_invitation: 'seul',
        libelle: invite.nom_complet,
        invites: [invite],
        id_invitation: null,
        code_qr: null,
        libelle_groupe: null,
        id_table: invite.id_table,
        numero_table: invite.numero_table,
        nom_table: invite.nom_table,
        statut_presence: invite.statut_presence,
        places: 1,
      })
    }
  }

  return simulerDelai(structuredClone(blocs))
}

/** Crée un invité (nom complet seul — pas de QR). */
export const creerInvite = async (
  idEvenement: string,
  donnees: DonneesInvite
): Promise<Invite> => {
  const nom = donnees.nom_complet.trim()
  if (!nom) {
    await simulerDelai(null)
    throw new Error('Le nom complet est obligatoire.')
  }
  const nouveau: Invite = {
    id_invite: genererId('inv'),
    id_evenement: idEvenement,
    nom_complet: nom,
    statut_presence: 'absent',
    date_scan: null,
    date_creation: new Date().toISOString(),
  }
  memoire.invites = [nouveau, ...memoire.invites]
  return simulerDelai(structuredClone(nouveau))
}

/**
 * Crée un seul / couple / famille / groupe : invités + invitation (QR) en une fois.
 * Affectation table optionnelle pour tout le groupe.
 */
export const creerGroupeInvites = async (
  idEvenement: string,
  donnees: DonneesCreationGroupe
): Promise<{
  invites: Invite[]
  invitation: InvitationEnrichie
}> => {
  const type = donnees.type_invitation
  const noms = donnees.noms.map((n) => n.trim()).filter(Boolean)

  if (type === 'seul') {
    if (noms.length !== 1) {
      await simulerDelai(null)
      throw new Error('Un invité seul nécessite exactement un nom.')
    }
  } else if (type === 'couple') {
    if (noms.length !== 2) {
      await simulerDelai(null)
      throw new Error('Un couple nécessite exactement deux noms.')
    }
  } else if (type === 'famille' || type === 'groupe') {
    if (noms.length < 2) {
      await simulerDelai(null)
      throw new Error('Une famille ou un groupe nécessite au moins deux membres.')
    }
    if (!donnees.libelle_groupe?.trim()) {
      await simulerDelai(null)
      throw new Error('Le nom du groupe / de la famille est obligatoire.')
    }
  }

  const invites: Invite[] = []
  const maintenant = new Date().toISOString()
  for (const nom of noms) {
    const invite: Invite = {
      id_invite: genererId('inv'),
      id_evenement: idEvenement,
      nom_complet: nom,
      statut_presence: 'absent',
      date_scan: null,
      date_creation: maintenant,
    }
    invites.push(invite)
  }
  memoire.invites = [...invites, ...memoire.invites]

  const invitation = await creerInvitation(
    idEvenement,
    invites.map((i) => i.id_invite),
    {
      type_invitation: type,
      libelle_groupe: donnees.libelle_groupe,
    }
  )

  const idTable = donnees.id_table?.trim()
  if (idTable) {
    const { affecterGroupeParInvitation } = await import('./tables')
    await affecterGroupeParInvitation(invitation.id_invitation, idTable)
  }

  return simulerDelai({ invites: structuredClone(invites), invitation })
}

/** Modifie le nom complet d’un invité. */
export const modifierInvite = async (
  idInvite: string,
  donnees: DonneesInvite
): Promise<Invite> => {
  const index = memoire.invites.findIndex((i) => i.id_invite === idInvite)
  if (index < 0) {
    await simulerDelai(null)
    throw new Error('Invité introuvable.')
  }
  const nom = donnees.nom_complet.trim()
  if (!nom) {
    await simulerDelai(null)
    throw new Error('Le nom complet est obligatoire.')
  }
  memoire.invites[index] = {
    ...memoire.invites[index],
    nom_complet: nom,
  }
  return simulerDelai(structuredClone(memoire.invites[index]))
}

/**
 * Supprime un invité.
 * Si membre d’un couple/famille/groupe : supprime tout le groupe (indivisible).
 */
export const supprimerInvite = async (idInvite: string): Promise<void> => {
  const existe = memoire.invites.some((i) => i.id_invite === idInvite)
  if (!existe) {
    await simulerDelai(null)
    throw new Error('Invité introuvable.')
  }

  const invitation = trouverInvitationParInvite(idInvite)
  if (invitation && estUniteIndivisible(invitation)) {
    const ids = new Set(invitation.ids_invites)
    memoire.invites = memoire.invites.filter((i) => !ids.has(i.id_invite))
    memoire.affectations = memoire.affectations.filter(
      (a) => !ids.has(a.id_invite)
    )
    memoire.invitations = memoire.invitations.filter(
      (i) => i.id_invitation !== invitation.id_invitation
    )
    await simulerDelai(undefined)
    return
  }

  memoire.invites = memoire.invites.filter((i) => i.id_invite !== idInvite)
  memoire.affectations = memoire.affectations.filter(
    (a) => a.id_invite !== idInvite
  )
  memoire.invitations = memoire.invitations
    .map((inv) => ({
      ...inv,
      ids_invites: inv.ids_invites.filter((id) => id !== idInvite),
    }))
    .filter((inv) => inv.ids_invites.length > 0)
  await simulerDelai(undefined)
}

/**
 * Importe plusieurs invités (colonne nom_complet) : chaque ligne = seul + invitation QR.
 */
export const importerInvites = async (
  idEvenement: string,
  lignes: DonneesInvite[]
): Promise<{ importes: number; invites: Invite[] }> => {
  const crees: Invite[] = []
  for (const ligne of lignes) {
    const nom = ligne.nom_complet.trim()
    if (!nom) continue
    const resultat = await creerGroupeInvites(idEvenement, {
      type_invitation: 'seul',
      noms: [nom],
    })
    crees.push(...resultat.invites)
  }
  return simulerDelai({
    importes: crees.length,
    invites: structuredClone(crees),
  })
}

/** Bascule le statut de présence d'un invité (démo / manuel). */
export const basculerPresence = async (idInvite: string): Promise<Invite> => {
  const index = memoire.invites.findIndex((i) => i.id_invite === idInvite)
  if (index < 0) {
    await simulerDelai(null)
    throw new Error('Invité introuvable.')
  }
  const actuel = memoire.invites[index]
  const present = actuel.statut_presence !== 'present'
  memoire.invites[index] = {
    ...actuel,
    statut_presence: present ? 'present' : 'absent',
    date_scan: present ? new Date().toISOString() : null,
  }
  return simulerDelai(structuredClone(memoire.invites[index]))
}

/** Simule un scan en marquant un invité présent (dev). */
export const simulerScanPresence = async (
  idInvite: string
): Promise<Invite> => {
  const index = memoire.invites.findIndex((i) => i.id_invite === idInvite)
  if (index < 0) {
    await simulerDelai(null)
    throw new Error('Invité introuvable.')
  }
  const statut: StatutPresence = 'present'
  memoire.invites[index] = {
    ...memoire.invites[index],
    statut_presence: statut,
    date_scan: new Date().toISOString(),
  }
  return simulerDelai(structuredClone(memoire.invites[index]))
}
