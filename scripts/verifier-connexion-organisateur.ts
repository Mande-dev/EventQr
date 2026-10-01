import { MOCK_UTILISATEURS } from '../src/mocks/utilisateurs'
import { memoire } from '../src/services/memoire'
import {
  connecter,
  deconnecter,
  listerRolesEvenementUtilisateur,
} from '../src/services/authentification'
import { cheminApresConnexion } from '../src/lib/roles-evenement'

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
  const cible = memoire.utilisateurs.find((u) => u.id_utilisateur === 'usr-002')
  console.log('Compte usr-002:', {
    email: cible?.email,
    mot_de_passe: cible?.mot_de_passe,
    actif: cible?.actif,
    role: cible?.role_systeme,
  })

  const essais: Array<[string, string, boolean]> = [
    ['organisateur@eventqr.com', 'Organisateur123!', true],
    ['Organisateur@EventQR.com', 'Organisateur123!', true],
    ['marie.kasongo@email.cd', 'Marie2024!', true],
    ['organisateur@eventqr.com', 'Mauvais123!', false],
    ['admin@eventqr.com', 'Admin123!', true],
    ['agent.demo@email.cd', 'Agent2024!', true],
  ]

  let echecs = 0
  for (const [email, mdp, doitReussir] of essais) {
    try {
      const session = await connecter(email, mdp)
      const roles = listerRolesEvenementUtilisateur(
        session.utilisateur.id_utilisateur
      )
      const chemin = cheminApresConnexion(
        session.utilisateur.role_systeme,
        roles
      )
      await deconnecter()
      if (!doitReussir) {
        console.error('ATTENDU ECHEC mais OK:', email, '->', chemin)
        echecs += 1
      } else {
        console.log('OK', email, '->', chemin)
      }
    } catch (erreur) {
      const message = erreur instanceof Error ? erreur.message : String(erreur)
      if (doitReussir) {
        console.error('ATTENDU OK mais ECHEC:', email, message)
        echecs += 1
      } else {
        console.log('OK (refuse)', email, '-', message)
      }
    }
  }

  if (echecs > 0) {
    console.error(`\n${echecs} echec(s)`)
    process.exit(1)
  }
  console.log('\nTous les essais de connexion sont conformes.')
}

void executer()
