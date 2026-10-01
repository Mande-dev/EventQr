/**
 * Vérifie rôles (création proprio/agent) + types événement mariage|anniversaire.
 * npx tsx scripts/verifier-roles-evenements.ts
 */
import {
  MOCK_EVENEMENTS,
  MOCK_UTILISATEURS,
  MOCK_UTILISATEURS_EVENEMENTS,
} from '../src/mocks'
import { memoire } from '../src/services/memoire'
import { creerUtilisateur } from '../src/services/utilisateurs'
import {
  basculerActifUtilisateurEvenement,
  creerUtilisateurPourEvenement,
  listerUtilisateursEvenement,
} from '../src/services/utilisateurs-evenement'
import type { TypeEvenement } from '../src/types'

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
  memoire.utilisateurs = structuredClone(MOCK_UTILISATEURS)
  memoire.evenements = structuredClone(MOCK_EVENEMENTS)
  memoire.utilisateursEvenements = structuredClone(MOCK_UTILISATEURS_EVENEMENTS)


  let echecs = 0
  const typesOk: TypeEvenement[] = ['mariage', 'anniversaire']

  // g) Mocks : uniquement mariage | anniversaire
  const typesInvalides = memoire.evenements.filter(
    (e) => !typesOk.includes(e.type_evenement)
  )
  if (typesInvalides.length > 0) {
    console.error('FAIL types événement obsolètes', typesInvalides)
    echecs += 1
  } else console.log('OK mocks : uniquement mariage | anniversaire')

  // a) Super Admin crée organisateur
  const orga = await creerUtilisateur({
    nom: 'Test',
    prenom: 'Orga',
    email: `orga.test.${Date.now()}@eventqr.com`,
    telephone: '+243810099001',
    mot_de_passe: 'OrgaTest123!',
  })
  if (orga.role_systeme !== 'organisateur') {
    console.error('FAIL création organisateur')
    echecs += 1
  } else console.log('OK Super Admin crée organisateur')

  const idEvt = 'evt-001'

  // b) Créer propriétaire
  const proprio = await creerUtilisateurPourEvenement(idEvt, {
    email: `proprio.${Date.now()}@email.cd`,
    telephone: '+243810099002',
    mot_de_passe: 'Proprio123!',
    role_evenement: 'Propriétaire',
  })
  if (
    !proprio.utilisateur?.actif ||
    proprio.role_evenement !== 'Propriétaire' ||
    !proprio.utilisateur.email
  ) {
    console.error('FAIL création propriétaire', proprio)
    echecs += 1
  } else console.log('OK création propriétaire (email+tél+mdp)')

  // c) Créer agent
  const agent = await creerUtilisateurPourEvenement(idEvt, {
    email: `agent.${Date.now()}@email.cd`,
    telephone: '+243810099003',
    mot_de_passe: 'AgentTest123!',
    role_evenement: 'Agent de contrôle',
  })
  if (agent.role_evenement !== 'Agent de contrôle' || !agent.utilisateur?.actif) {
    console.error('FAIL création agent', agent)
    echecs += 1
  } else console.log('OK création agent de contrôle')

  // d) Activer / désactiver
  const desactive = await basculerActifUtilisateurEvenement(
    agent.utilisateur!.id_utilisateur
  )
  if (desactive.actif) {
    console.error('FAIL désactivation')
    echecs += 1
  } else console.log('OK désactivation agent')
  const reactive = await basculerActifUtilisateurEvenement(
    agent.utilisateur!.id_utilisateur
  )
  if (!reactive.actif) {
    console.error('FAIL réactivation')
    echecs += 1
  } else console.log('OK réactivation agent')

  // e) Interdit : rôle Organisateur via création
  try {
    await creerUtilisateurPourEvenement(idEvt, {
      email: `interdit.${Date.now()}@email.cd`,
      telephone: '+243810099004',
      mot_de_passe: 'Interdit123!',
      role_evenement: 'Organisateur',
    })
    console.error('FAIL aurait dû refuser rôle Organisateur')
    echecs += 1
  } catch {
    console.log('OK refus création rôle Organisateur')
  }

  // Liste liée à l’événement
  const liste = await listerUtilisateursEvenement(idEvt)
  if (
    !liste.some((l) => l.id_utilisateur === proprio.utilisateur!.id_utilisateur)
  ) {
    console.error('FAIL proprio non listé')
    echecs += 1
  } else console.log('OK utilisateurs liés à l’événement')

  // Compte démo présent
  const demo = memoire.utilisateurs.find(
    (u) => u.email === 'organisateur@eventqr.com'
  )
  const admin = memoire.utilisateurs.find((u) => u.email === 'admin@eventqr.com')
  if (!demo || !admin) {
    console.error('FAIL comptes démo manquants')
    echecs += 1
  } else console.log('OK comptes démo admin + organisateur')

  if (echecs > 0) {
    console.error(`\nRésultat : ${echecs} échec(s)`)
    process.exit(1)
  }
  console.log('\nRésultat : tous les tests rôles / événements OK')
}

void executer()
