/**
 * Vérifie : création invité ± table, affectation capacité, parcours invitations.
 * Exécution : npx tsx scripts/verifier-ux-invites-invitations.ts
 */
import {
  MOCK_AFFECTATIONS,
  MOCK_INVITES,
  MOCK_INVITATIONS,
  MOCK_TABLES,
} from '../src/mocks'
import { memoire } from '../src/services/memoire'
import { creerInvite, listerInvites } from '../src/services/invites'
import {
  affecterInvite,
  listerInvitesNonAffectes,
  listerTables,
} from '../src/services/tables'
import {
  creerInvitation,
  listerInvitations,
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
  memoire.tables = structuredClone(MOCK_TABLES)

  const idEvt = 'evt-001'
  let echecs = 0

  // a) Créer invité SANS table
  const sansTable = await creerInvite(idEvt, {
    nom_complet: 'Sans Table Demo',
  })
  const liste1 = await listerInvites(idEvt)
  const trouve1 = liste1.find((i) => i.id_invite === sansTable.id_invite)
  if (!trouve1 || trouve1.id_table !== null) {
    console.error('FAIL créer sans table')
    echecs += 1
  } else console.log('OK créer invité sans table')

  // b) Créer invité PUIS affecter (équivalent formulaire avec table)
  const avecTable = await creerInvite(idEvt, {
    nom_complet: 'Avec Table Demo',
  })
  const tables = await listerTables(idEvt)
  const tableLibre = tables.find((t) => t.places_disponibles >= 1)
  if (!tableLibre) {
    console.error('FAIL aucune table libre')
    echecs += 1
  } else {
    await affecterInvite(avecTable.id_invite, tableLibre.id_table)
    const liste2 = await listerInvites(idEvt)
    const trouve2 = liste2.find((i) => i.id_invite === avecTable.id_invite)
    if (trouve2?.id_table !== tableLibre.id_table) {
      console.error('FAIL créer + affecter')
      echecs += 1
    } else console.log('OK créer invité puis affecter à une table')
  }

  // c) Bouton Affecter depuis non affectés
  const nonAffectes = await listerInvitesNonAffectes(idEvt)
  const cible = nonAffectes.find((i) => i.id_invite === sansTable.id_invite)
  const table2 = (await listerTables(idEvt)).find(
    (t) => t.places_disponibles >= 1
  )
  if (!cible || !table2) {
    console.error('FAIL non affecté / table pour Affecter')
    echecs += 1
  } else {
    await affecterInvite(cible.id_invite, table2.id_table)
    const apres = await listerInvites(idEvt)
    const ok = apres.find((i) => i.id_invite === cible.id_invite)
    if (ok?.id_table !== table2.id_table) {
      console.error('FAIL Affecter depuis non affectés')
      echecs += 1
    } else console.log('OK Affecter depuis non affectés')
  }

  // d) Capacité : 1 place = 1 invité (remplir jusqu’à plein)
  const tablesMaj = await listerTables(idEvt)
  const petite = tablesMaj.find((t) => t.places_disponibles === 1) ??
    tablesMaj.find((t) => t.places_disponibles >= 1)
  if (petite && petite.places_disponibles >= 1) {
    const placesAvant = petite.places_disponibles
    const inv = await creerInvite(idEvt, { nom_complet: 'Place Unique' })
    await affecterInvite(inv.id_invite, petite.id_table)
    const apresCap = await listerTables(idEvt)
    const maj = apresCap.find((t) => t.id_table === petite.id_table)
    if (!maj || maj.places_disponibles !== placesAvant - 1) {
      console.error('FAIL capacité places', {
        placesAvant,
        placesApres: maj?.places_disponibles,
      })
      echecs += 1
    } else console.log('OK capacité 1 place = 1 invité')

    if (maj && maj.places_disponibles === 0) {
      const surplus = await creerInvite(idEvt, { nom_complet: 'Trop Plein' })
      try {
        await affecterInvite(surplus.id_invite, petite.id_table)
        console.error('FAIL devrait refuser table pleine')
        echecs += 1
      } catch {
        console.log('OK refus table pleine')
      }
    }
  }

  // e) Parcours génération : table → invités → invitation → visible
  const tablesFinales = await listerTables(idEvt)
  const tableAvecInvites = tablesFinales.find((t) => t.invites.length >= 1)
  if (!tableAvecInvites) {
    console.error('FAIL aucune table avec invités')
    echecs += 1
  } else {
    const eligibles = tableAvecInvites.invites.filter((inv) => {
      return !(memoire.invitations ?? []).some(
        (invitation) =>
          invitation.id_evenement === idEvt &&
          invitation.ids_invites.includes(inv.id_invite)
      )
    })
    const aInviter = eligibles.slice(0, Math.min(2, eligibles.length))
    if (aInviter.length === 0) {
      console.log('OK (skip) tous les invités de la table ont déjà une invitation')
    } else {
      const invitation = await creerInvitation(
        idEvt,
        aInviter.map((i) => i.id_invite)
      )
      const listeInv = await listerInvitations(idEvt)
      const vue = listeInv.find((i) => i.id_invitation === invitation.id_invitation)
      if (
        !vue ||
        !vue.code_qr ||
        !vue.libelle_noms ||
        !vue.date_creation
      ) {
        console.error('FAIL invitation dans tableau', vue)
        echecs += 1
      } else {
        console.log(
          'OK parcours table → invités → invitation → tableau',
          vue.code_qr,
          vue.libelle_noms
        )
        console.log('OK aperçu possible (noms + code_qr présents)')
      }
    }
  }

  if (echecs > 0) {
    console.error(`\nRésultat : ${echecs} échec(s)`)
    process.exit(1)
  }
  console.log('\nRésultat : tous les tests mock OK')
}

void executer()
