/**
 * Vérifie Seul / Couple / Famille-Groupe + indivisibilité + QR sur invitation.
 * npx tsx scripts/verifier-groupes-invitations.ts
 */
import {
  MOCK_AFFECTATIONS,
  MOCK_INVITES,
  MOCK_INVITATIONS,
  MOCK_TABLES,
} from '../src/mocks'
import { memoire } from '../src/services/memoire'
import { creerGroupeInvites, listerBlocsInvites, supprimerInvite } from '../src/services/invites'
import {
  affecterInvite,
  affecterGroupeParInvitation,
  listerTables,
  retirerAffectation,
} from '../src/services/tables'
import { listerInvitations } from '../src/services/invitations'

const stock: Record<string, string> = {}
;(globalThis as { sessionStorage: Storage }).sessionStorage = {
  getItem: (k) => stock[k] ?? null,
  setItem: (k, v) => {
    stock[k] = String(v)
  },
  removeItem: (k) => {
    delete stock[k]
  },
  clear: () => {
    for (const k of Object.keys(stock)) delete stock[k]
  },
  key: () => null,
  length: 0,
}

async function executer(): Promise<void> {
  memoire.invites = structuredClone(MOCK_INVITES)
  memoire.affectations = structuredClone(MOCK_AFFECTATIONS)
  memoire.invitations = structuredClone(MOCK_INVITATIONS)
  memoire.tables = structuredClone(MOCK_TABLES)

  const idEvt = 'evt-001'
  let echecs = 0

  // a) SEUL
  const seul = await creerGroupeInvites(idEvt, {
    type_invitation: 'seul',
    noms: ['Solo Test'],
  })
  if (
    seul.invites.length !== 1 ||
    !seul.invitation.code_qr ||
    seul.invitation.type_invitation !== 'seul' ||
    seul.invitation.ids_invites.length !== 1
  ) {
    console.error('FAIL seul', seul)
    echecs += 1
  } else console.log('OK SEUL → 1 invite + 1 invitation + QR')

  // b) COUPLE
  const couple = await creerGroupeInvites(idEvt, {
    type_invitation: 'couple',
    noms: ['Alice Couple', 'Bob Couple'],
  })
  if (
    couple.invites.length !== 2 ||
    couple.invitation.ids_invites.length !== 2 ||
    couple.invitation.type_invitation !== 'couple' ||
    !couple.invitation.code_qr
  ) {
    console.error('FAIL couple', couple)
    echecs += 1
  } else console.log('OK COUPLE → 2 invites + 1 invitation + QR')

  // Affectation couple indivisible
  const tables = await listerTables(idEvt)
  const tableOk = tables.find((t) => t.places_disponibles >= 2)
  if (!tableOk) {
    console.error('FAIL pas de table pour couple')
    echecs += 1
  } else {
    await affecterInvite(couple.invites[0].id_invite, tableOk.id_table)
    const aff = memoire.affectations.filter((a) =>
      couple.invitation.ids_invites.includes(a.id_invite)
    )
    if (
      aff.length !== 2 ||
      aff.some((a) => a.id_table !== tableOk.id_table)
    ) {
      console.error('FAIL affectation couple non groupée', aff)
      echecs += 1
    } else console.log('OK affectation couple = 2 places même table')

    await retirerAffectation(couple.invites[1].id_invite)
    const reste = memoire.affectations.filter((a) =>
      couple.invitation.ids_invites.includes(a.id_invite)
    )
    if (reste.length !== 0) {
      console.error('FAIL retrait couple non groupé', reste)
      echecs += 1
    } else console.log('OK retrait affectation couple = groupe entier')
  }

  // c) FAMILLE
  const famille = await creerGroupeInvites(idEvt, {
    type_invitation: 'famille',
    libelle_groupe: 'Famille Test Demo',
    noms: ['Parent A', 'Parent B', 'Enfant C'],
  })
  if (
    famille.invites.length !== 3 ||
    famille.invitation.libelle_groupe !== 'Famille Test Demo' ||
    famille.invitation.type_invitation !== 'famille' ||
    !famille.invitation.code_qr
  ) {
    console.error('FAIL famille', famille)
    echecs += 1
  } else console.log('OK FAMILLE → 3 invites + libelle_groupe + 1 QR')

  const tableFam = (await listerTables(idEvt)).find(
    (t) => t.places_disponibles >= 3
  )
  if (tableFam) {
    await affecterGroupeParInvitation(
      famille.invitation.id_invitation,
      tableFam.id_table
    )
    const affF = memoire.affectations.filter((a) =>
      famille.invitation.ids_invites.includes(a.id_invite)
    )
    if (affF.length !== 3) {
      console.error('FAIL affectation famille', affF.length)
      echecs += 1
    } else console.log('OK affectation famille groupée')
  }

  // Capacité insuffisante
  const petite = (await listerTables(idEvt)).find(
    (t) => t.places_disponibles === 1
  )
  if (petite) {
    try {
      await affecterGroupeParInvitation(
        famille.invitation.id_invitation,
        petite.id_table
      )
      console.error('FAIL aurait dû refuser capacité')
      echecs += 1
    } catch {
      console.log('OK refus capacité insuffisante pour groupe')
    }
  }

  // Blocs UI : couple = 1 ligne
  const blocs = await listerBlocsInvites(idEvt)
  const blocCouple = blocs.find(
    (b) => b.id_invitation === couple.invitation.id_invitation
  )
  if (!blocCouple || blocCouple.places !== 2 || blocCouple.invites.length !== 2) {
    console.error('FAIL bloc couple', blocCouple)
    echecs += 1
  } else console.log('OK liste blocs : couple = 1 ligne indivisible')

  // Suppression indivisible
  const idMembre = famille.invites[0].id_invite
  await supprimerInvite(idMembre)
  const encoreInvites = memoire.invites.some((i) =>
    famille.invitation.ids_invites.includes(i.id_invite)
  )
  const encoreInvi = memoire.invitations.some(
    (i) => i.id_invitation === famille.invitation.id_invitation
  )
  if (encoreInvites || encoreInvi) {
    console.error('FAIL suppression groupe incomplète')
    echecs += 1
  } else console.log('OK suppression membre → tout le groupe retiré')

  const liste = await listerInvitations(idEvt)
  if (!liste.some((i) => i.id_invitation === seul.invitation.id_invitation)) {
    console.error('FAIL seul disparu des invitations')
    echecs += 1
  } else console.log('OK invitations listables avec types')

  if (echecs > 0) {
    console.error(`\nRésultat : ${echecs} échec(s)`)
    process.exit(1)
  }
  console.log('\nRésultat : tous les tests groupes OK')
}

void executer()
