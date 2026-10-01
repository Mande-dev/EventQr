import { createFileRoute, redirect } from '@tanstack/react-router'
import { LayoutOrganisateur } from '@/features/organisateur/composants/layout-organisateur'
import { useAuthentification } from '@/hooks/use-authentification'
import { listerRolesEvenementUtilisateur } from '@/services/authentification'
import {
  cheminApresConnexion,
  estUniquementAgent,
} from '@/lib/roles-evenement'

export const Route = createFileRoute('/organisateur')({
  beforeLoad: ({ location }) => {
    useAuthentification.getState().restaurerSession()
    const { jeton, utilisateur } = useAuthentification.getState()

    if (!jeton || !utilisateur) {
      throw redirect({
        to: '/connexion',
        search: { redirect: location.href },
      })
    }

    if (utilisateur.role_systeme === 'super_admin') {
      throw redirect({ to: '/' })
    }

    if (utilisateur.role_systeme !== 'organisateur') {
      throw redirect({ to: '/403' })
    }

    const roles = listerRolesEvenementUtilisateur(utilisateur.id_utilisateur)
    if (estUniquementAgent(roles)) {
      throw redirect({ to: '/agent' })
    }

    // Sécurité : s'assurer qu'on ne reste pas sur une mauvaise destination.
    const cible = cheminApresConnexion(utilisateur.role_systeme, roles)
    if (cible === '/agent') {
      throw redirect({ to: '/agent' })
    }
  },
  component: LayoutOrganisateur,
})
