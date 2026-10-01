import { MOCK_AFFECTATIONS, MOCK_INVITES, MOCK_INVITATIONS } from '../src/mocks'
import { memoire } from '../src/services/memoire'
import {
  creerInvite,
  listerInvites,
} from '../src/services/invites'
import {
  affecterInvite,
  listerInvitesNonAffectes,
  listerTables,
  retirerAffectation,
} from '../src/services/tables'
import {
  creerInvitation,
  listerInvitations,
  listerInvitesSansInvitation,
} from '../src/services/invitations'

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

  const idEvt = 'evt-001'
  let echecs = 0

  const nonAffectes = await listerInvitesNonAffectes(idEvt)
  console.log('Non affectés evt-001:', nonAffectes.length)
  if (nonAffectes.length < 1) {
    console.error('FAIL: aucun invité non affecté')
    echecs += 1
  } else console.log('OK non affectés')

  const cree = await creerInvite(idEvt, { nom_complet: 'Test Complet Demo' })
  if (!cree.nom_complet || 'prenom' in cree || 'code_qr' in cree) {
    console.error('FAIL créer invité', cree)
    echecs += 1
  } else console.log('OK créer invité nom_complet seul')

  const tables = await listerTables(idEvt)
  if (tables.length < 1) throw new Error('pas de tables')
  const table = tables.find((t) => t.places_disponibles >= 1) ?? tables[0]
  await affecterInvite(cree.id_invite, table.id_table)
  const apres = await listerInvites(idEvt)
  const trouve = apres.find((i) => i.id_invite === cree.id_invite)
  if (trouve?.id_table !== table.id_table) {
    console.error('FAIL affectation')
    echecs += 1
  } else console.log('OK affectation')

  await retirerAffectation(cree.id_invite)
  const nonAff2 = await listerInvitesNonAffectes(idEvt)
  if (!nonAff2.some((i) => i.id_invite === cree.id_invite)) {
    console.error('FAIL retrait affectation')
    echecs += 1
  } else console.log('OK retrait affectation')

  const sansInvi = await listerInvitesSansInvitation(idEvt)
  const un = sansInvi[0]
  const deux = sansInvi.slice(0, 2)
  if (!un) {
    console.error('FAIL pas d invités sans invitation')
    echecs += 1
  } else {
    const invi1 = await creerInvitation(idEvt, [un.id_invite])
    if (!invi1.code_qr) {
      console.error('FAIL QR invitation solo')
      echecs += 1
    } else console.log('OK invitation solo QR', invi1.code_qr)

    if (deux.length >= 2) {
      const invi2 = await creerInvitation(idEvt, [
        deux[0].id_invite === un.id_invite ? deux[1].id_invite : deux[0].id_invite,
        ...(deux[0].id_invite === un.id_invite
          ? deux.slice(2, 3).map((i) => i.id_invite)
          : [deux[1]?.id_invite].filter(Boolean) as string[]),
      ].filter((id, i, a) => id && a.indexOf(id) === i && id !== un.id_invite))

      // simpler multi: take 2 from sans invitation after first create
      const encore = await listerInvitesSansInvitation(idEvt)
      if (encore.length >= 2) {
        const multi = await creerInvitation(idEvt, [
          encore[0].id_invite,
          encore[1].id_invite,
        ])
        if (!multi.code_qr || multi.ids_invites.length !== 2) {
          console.error('FAIL invitation multi')
          echecs += 1
        } else console.log('OK invitation multi QR', multi.code_qr)
      } else {
        console.log('OK (skip multi — pas assez d invités restants)')
      }
      void invi2
    }
  }

  const liste = await listerInvitations(idEvt)
  console.log('Invitations evt-001:', liste.length)

  if (echecs > 0) {
    console.error(`\n${echecs} echec(s)`)
    process.exit(1)
  }
  console.log('\nTous les tests métier mock sont OK.')
}

void executer()
