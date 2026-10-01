import { genererCodeQr, genererId, memoire } from './memoire'
import { simulerDelai } from './delai'
import type {
  Invitation,
  Invite,
  StatutPresence,
  TypeInvitation,
} from '@/types'

export type InvitationEnrichie = Invitation & {
  invites: Invite[]
  libelle_noms: string
}

export type DonneesCreationInvitation = {
  ids_invites: string[]
  type_invitation?: TypeInvitation
  libelle_groupe?: string
}

/** Déduit le type d’invitation à partir du nombre de personnes. */
export function deduireTypeInvitation(
  nombre: number,
  typeForce?: TypeInvitation
): TypeInvitation {
  if (typeForce) return typeForce
  if (nombre <= 1) return 'seul'
  if (nombre === 2) return 'couple'
  return 'groupe'
}

/** Libellé d’affichage d’une invitation (groupe ou noms joints). */
export function libelleInvitation(invitation: Invitation, invites: Invite[]): string {
  if (
    invitation.libelle_groupe &&
    (invitation.type_invitation === 'famille' ||
      invitation.type_invitation === 'groupe')
  ) {
    return invitation.libelle_groupe
  }
  return invites.map((i) => i.nom_complet).join(' · ')
}

/** Indique si l’invitation est une unité multi-personnes indivisible. */
export function estUniteIndivisible(invitation: Invitation): boolean {
  return (
    invitation.type_invitation !== 'seul' || invitation.ids_invites.length > 1
  )
}

/** Enrichit une invitation avec les invités liés. */
function enrichirInvitation(invitation: Invitation): InvitationEnrichie {
  const invites = invitation.ids_invites
    .map((id) => memoire.invites.find((i) => i.id_invite === id))
    .filter((i): i is Invite => Boolean(i))
  return {
    ...invitation,
    invites,
    libelle_noms: libelleInvitation(invitation, invites),
  }
}

/** Liste les invitations d’un événement. */
export const listerInvitations = async (
  idEvenement: string
): Promise<InvitationEnrichie[]> => {
  const liste = memoire.invitations
    .filter((i) => i.id_evenement === idEvenement)
    .map(enrichirInvitation)
    .sort(
      (a, b) =>
        new Date(b.date_creation).getTime() -
        new Date(a.date_creation).getTime()
    )
  return simulerDelai(structuredClone(liste))
}

/**
 * Crée une invitation pour 1..n invités et génère immédiatement le code QR.
 * Un invité ne peut appartenir qu’à une seule invitation.
 */
export const creerInvitation = async (
  idEvenement: string,
  idsInvites: string[],
  options?: {
    type_invitation?: TypeInvitation
    libelle_groupe?: string
  }
): Promise<InvitationEnrichie> => {
  const uniques = [...new Set(idsInvites)]
  if (uniques.length < 1) {
    await simulerDelai(null)
    throw new Error('Sélectionnez au moins une personne.')
  }

  const type = deduireTypeInvitation(uniques.length, options?.type_invitation)
  if (type === 'couple' && uniques.length !== 2) {
    await simulerDelai(null)
    throw new Error('Un couple doit comporter exactement 2 personnes.')
  }
  if (
    (type === 'famille' || type === 'groupe') &&
    uniques.length < 2
  ) {
    await simulerDelai(null)
    throw new Error('Une famille ou un groupe doit comporter au moins 2 personnes.')
  }
  if (
    (type === 'famille' || type === 'groupe') &&
    !options?.libelle_groupe?.trim()
  ) {
    await simulerDelai(null)
    throw new Error('Le nom du groupe / de la famille est obligatoire.')
  }

  for (const id of uniques) {
    const invite = memoire.invites.find(
      (i) => i.id_invite === id && i.id_evenement === idEvenement
    )
    if (!invite) {
      await simulerDelai(null)
      throw new Error('Un invité sélectionné est introuvable.')
    }
    const deja = memoire.invitations.some((inv) =>
      inv.ids_invites.includes(id)
    )
    if (deja) {
      await simulerDelai(null)
      throw new Error(`${invite.nom_complet} a déjà une invitation.`)
    }
  }

  const nouvelle: Invitation = {
    id_invitation: genererId('invi'),
    id_evenement: idEvenement,
    ids_invites: uniques,
    code_qr: genererCodeQr(),
    type_invitation: type,
    libelle_groupe:
      type === 'famille' || type === 'groupe'
        ? options?.libelle_groupe?.trim()
        : undefined,
    statut_presence: 'absent',
    date_scan: null,
    date_creation: new Date().toISOString(),
  }
  memoire.invitations = [nouvelle, ...memoire.invitations]
  return simulerDelai(structuredClone(enrichirInvitation(nouvelle)))
}

/**
 * Supprime une invitation.
 * Pour couple/famille/groupe : supprime aussi tous les invités et leurs affectations
 * (unité indivisible). Pour seul : retire seulement l’invitation (l’invité reste).
 */
export const supprimerInvitation = async (
  idInvitation: string
): Promise<void> => {
  const invitation = memoire.invitations.find(
    (i) => i.id_invitation === idInvitation
  )
  if (!invitation) {
    await simulerDelai(null)
    throw new Error('Invitation introuvable.')
  }

  if (estUniteIndivisible(invitation)) {
    const ids = new Set(invitation.ids_invites)
    memoire.invites = memoire.invites.filter((i) => !ids.has(i.id_invite))
    memoire.affectations = memoire.affectations.filter(
      (a) => !ids.has(a.id_invite)
    )
  }

  memoire.invitations = memoire.invitations.filter(
    (i) => i.id_invitation !== idInvitation
  )
  await simulerDelai(undefined)
}

/**
 * Simule un scan QR d’invitation : marque l’invitation et tous ses invités présents.
 */
export const simulerScanInvitation = async (
  idInvitation: string
): Promise<InvitationEnrichie> => {
  const index = memoire.invitations.findIndex(
    (i) => i.id_invitation === idInvitation
  )
  if (index < 0) {
    await simulerDelai(null)
    throw new Error('Invitation introuvable.')
  }
  const maintenant = new Date().toISOString()
  const statut: StatutPresence = 'present'
  memoire.invitations[index] = {
    ...memoire.invitations[index],
    statut_presence: statut,
    date_scan: maintenant,
  }
  for (const idInvite of memoire.invitations[index].ids_invites) {
    const idx = memoire.invites.findIndex((i) => i.id_invite === idInvite)
    if (idx >= 0) {
      memoire.invites[idx] = {
        ...memoire.invites[idx],
        statut_presence: statut,
        date_scan: maintenant,
      }
    }
  }
  return simulerDelai(
    structuredClone(enrichirInvitation(memoire.invitations[index]))
  )
}

/** Invités d’un événement sans invitation encore créée. */
export const listerInvitesSansInvitation = async (
  idEvenement: string
): Promise<Invite[]> => {
  const deja = new Set(memoire.invitations.flatMap((i) => i.ids_invites))
  const liste = memoire.invites.filter(
    (i) => i.id_evenement === idEvenement && !deja.has(i.id_invite)
  )
  return simulerDelai(structuredClone(liste))
}

/** Retrouve l’invitation d’un invité, ou null. */
export function trouverInvitationParInvite(
  idInvite: string
): Invitation | null {
  return (
    memoire.invitations.find((inv) => inv.ids_invites.includes(idInvite)) ??
    null
  )
}
