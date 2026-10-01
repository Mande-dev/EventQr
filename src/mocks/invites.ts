import type {
  Affectation,
  Invitation,
  Invite,
  ModeleInvitation,
  TableEvenement,
} from '@/types'
import { MOCK_EVENEMENTS } from './evenements'

const PRENOMS = [
  'Patrick',
  'Marie',
  'Grace',
  'David',
  'Sarah',
  'Eric',
  'Chantal',
  'Joseph',
  'Amina',
  'Bruno',
  'Fatou',
  'Michel',
  'Nadine',
  'Olivier',
  'Aïcha',
  'Christian',
  'Esther',
  'Paul',
  'Divine',
  'Jonathan',
  'Ruth',
  'Samuel',
  'Dorcas',
  'Emmanuel',
  'Rebecca',
]

const NOMS = [
  'Mbala',
  'Kasongo',
  'Mukendi',
  'Nzuzi',
  'Kabongo',
  'Ilunga',
  'Mwamba',
  'Banza',
  'Kalala',
  'Ndaya',
  'Okito',
  'Senga',
  'Wamba',
  'Diop',
  'Mputu',
  'Tshibangu',
  'Lukaku',
  'Kabila',
  'Mobutu',
  'Kanku',
]

/** Construit des invités (nom complet seul, sans QR). */
const construireInvites = (): Invite[] => {
  const invites: Invite[] = []
  let compteur = 1

  for (const evenement of MOCK_EVENEMENTS) {
    const nombrePourEvenement = evenement.id_evenement === 'evt-002' ? 35 : 18
    for (let i = 0; i < nombrePourEvenement; i++) {
      const present = compteur % 3 !== 0
      invites.push({
        id_invite: `inv-${String(compteur).padStart(4, '0')}`,
        id_evenement: evenement.id_evenement,
        nom_complet: `${PRENOMS[compteur % PRENOMS.length]} ${NOMS[compteur % NOMS.length]}`,
        statut_presence: present ? 'present' : 'absent',
        date_scan: present
          ? new Date(
              new Date(evenement.date_evenement).getTime() +
                (i % 8) * 15 * 60 * 1000
            ).toISOString()
          : null,
        date_creation: evenement.date_creation,
      })
      compteur += 1
    }
  }

  return invites
}

export const MOCK_INVITES: Invite[] = construireInvites()

const NOMS_TABLES_DEMO = [
  'VIP',
  'Famille',
  'Amis',
  'Collègues',
  'Honneur',
]

export const MOCK_TABLES: TableEvenement[] = MOCK_EVENEMENTS.flatMap(
  (evenement, indexEvenement) =>
    Array.from({ length: 5 }, (_, index) => ({
      id_table: `tbl-${evenement.id_evenement}-${index + 1}`,
      id_evenement: evenement.id_evenement,
      numero_table: index + 1,
      nom_table: NOMS_TABLES_DEMO[index] ?? `Table ${index + 1}`,
      capacite: 8 + ((indexEvenement + index) % 4),
    }))
)

/**
 * Affecte ~55 % des invités par événement ; le reste reste non affecté
 * pour tester la page Affectation.
 */
export const MOCK_AFFECTATIONS: Affectation[] = (() => {
  const resultats: Affectation[] = []
  let compteur = 1

  for (const evenement of MOCK_EVENEMENTS) {
    const invitesEvt = MOCK_INVITES.filter(
      (i) => i.id_evenement === evenement.id_evenement
    )
    const tablesEvt = MOCK_TABLES.filter(
      (t) => t.id_evenement === evenement.id_evenement
    )
    if (tablesEvt.length === 0) continue

    const limite = Math.floor(invitesEvt.length * 0.55)
    invitesEvt.slice(0, limite).forEach((invite, index) => {
      const table = tablesEvt[index % tablesEvt.length]
      resultats.push({
        id_affectation: `aff-${String(compteur).padStart(4, '0')}`,
        id_invite: invite.id_invite,
        id_table: table.id_table,
        date_affectation: invite.date_creation,
      })
      compteur += 1
    })
  }

  return resultats
})()

/** Génère un code QR mock pour une invitation. */
const genererCodeQrInvitation = (index: number): string =>
  `INV-${String(index).padStart(5, '0')}-${Math.abs((index * 7919) % 10000)
    .toString()
    .padStart(4, '0')}`

/**
 * Quelques invitations mock (1 ou plusieurs invités) sur les premiers événements.
 * QR généré au niveau invitation.
 */
export const MOCK_INVITATIONS: Invitation[] = (() => {
  const liste: Invitation[] = []
  let n = 1

  for (const evenement of MOCK_EVENEMENTS.slice(0, 4)) {
    const invitesEvt = MOCK_INVITES.filter(
      (i) => i.id_evenement === evenement.id_evenement
    )
    if (invitesEvt.length < 3) continue

    // Invitation solo
    liste.push({
      id_invitation: `invi-${String(n).padStart(3, '0')}`,
      id_evenement: evenement.id_evenement,
      ids_invites: [invitesEvt[0].id_invite],
      code_qr: genererCodeQrInvitation(n),
      type_invitation: 'seul',
      statut_presence: invitesEvt[0].statut_presence,
      date_scan: invitesEvt[0].date_scan,
      date_creation: evenement.date_creation,
    })
    n += 1

    // Invitation couple
    liste.push({
      id_invitation: `invi-${String(n).padStart(3, '0')}`,
      id_evenement: evenement.id_evenement,
      ids_invites: [invitesEvt[1].id_invite, invitesEvt[2].id_invite],
      code_qr: genererCodeQrInvitation(n),
      type_invitation: 'couple',
      statut_presence:
        invitesEvt[1].statut_presence === 'present' &&
        invitesEvt[2].statut_presence === 'present'
          ? 'present'
          : 'absent',
      date_scan: null,
      date_creation: evenement.date_creation,
    })
    n += 1

    // Invitation famille (si assez d’invités)
    if (invitesEvt.length >= 6) {
      liste.push({
        id_invitation: `invi-${String(n).padStart(3, '0')}`,
        id_evenement: evenement.id_evenement,
        ids_invites: [
          invitesEvt[3].id_invite,
          invitesEvt[4].id_invite,
          invitesEvt[5].id_invite,
        ],
        code_qr: genererCodeQrInvitation(n),
        type_invitation: 'famille',
        libelle_groupe: `Famille ${invitesEvt[3].nom_complet.split(' ').slice(-1)[0] ?? 'Demo'}`,
        statut_presence: 'absent',
        date_scan: null,
        date_creation: evenement.date_creation,
      })
      n += 1
    }
  }

  return liste
})()

export const MOCK_MODELES: ModeleInvitation[] = MOCK_EVENEMENTS.map(
  (evenement) => ({
    id_modele: `mod-${evenement.id_evenement}`,
    id_evenement: evenement.id_evenement,
    fichier_pdf: `/modeles/${evenement.id_evenement}.pdf`,
    zone_nom_x: 120,
    zone_nom_y: 340,
    zone_nom_largeur: 280,
    zone_nom_hauteur: 40,
    zone_qr_x: 420,
    zone_qr_y: 480,
    zone_qr_largeur: 120,
    zone_qr_hauteur: 120,
    date_creation: evenement.date_creation,
  })
)
