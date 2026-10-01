import { beforeEach, describe, expect, it } from 'vitest'
import {
  connecter,
  deconnecter,
  listerRolesEvenementUtilisateur,
} from './authentification'
import { cheminApresConnexion } from '@/lib/roles-evenement'
import { memoire } from './memoire'
import { MOCK_UTILISATEURS } from '@/mocks'

/** Réinitialise la session et restaure les utilisateurs mock. */
function reinitialiser(): void {
  sessionStorage.clear()
  memoire.utilisateurs = structuredClone(MOCK_UTILISATEURS)
}

describe('authentification organisateur', () => {
  beforeEach(() => {
    reinitialiser()
  })

  it('connecte organisateur@eventqr.com avec le mot de passe mock', async () => {
    const session = await connecter(
      'organisateur@eventqr.com',
      'Organisateur123!'
    )
    expect(session.utilisateur.email).toBe('organisateur@eventqr.com')
    expect(session.utilisateur.role_systeme).toBe('organisateur')
    expect(session.utilisateur.id_utilisateur).toBe('usr-002')
    expect(session.jeton).toBeTruthy()
  })

  it('accepte l’e-mail sans tenir compte de la casse', async () => {
    const session = await connecter(
      'Organisateur@EventQR.com',
      'Organisateur123!'
    )
    expect(session.utilisateur.id_utilisateur).toBe('usr-002')
  })

  it('connecte aussi via l’ancien e-mail marie.kasongo@email.cd', async () => {
    const session = await connecter('marie.kasongo@email.cd', 'Marie2024!')
    expect(session.utilisateur.id_utilisateur).toBe('usr-002')
    expect(session.utilisateur.email).toBe('organisateur@eventqr.com')
  })

  it('refuse un mauvais mot de passe', async () => {
    await expect(
      connecter('organisateur@eventqr.com', 'Mauvais123!')
    ).rejects.toThrow('Identifiants incorrects.')
  })

  it('redirige l’organisateur vers /organisateur', async () => {
    const session = await connecter(
      'organisateur@eventqr.com',
      'Organisateur123!'
    )
    const roles = listerRolesEvenementUtilisateur(
      session.utilisateur.id_utilisateur
    )
    expect(cheminApresConnexion(session.utilisateur.role_systeme, roles)).toBe(
      '/organisateur'
    )
  })

  it('redirige l’agent vers /agent', async () => {
    const session = await connecter('agent.demo@email.cd', 'Agent2024!')
    const roles = listerRolesEvenementUtilisateur(
      session.utilisateur.id_utilisateur
    )
    expect(cheminApresConnexion(session.utilisateur.role_systeme, roles)).toBe(
      '/agent'
    )
  })

  it('redirige le super admin vers /', async () => {
    const session = await connecter('admin@eventqr.com', 'Admin123!')
    expect(cheminApresConnexion(session.utilisateur.role_systeme, [])).toBe(
      '/'
    )
  })

  it('déconnecte correctement', async () => {
    await connecter('organisateur@eventqr.com', 'Organisateur123!')
    await deconnecter()
    expect(sessionStorage.getItem('eventqr_session')).toBeNull()
  })
})
