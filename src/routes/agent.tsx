import { createFileRoute, redirect } from '@tanstack/react-router'
import { PageAgentProvisoire } from '@/features/agent/page-agent-provisoire'
import { useAuthentification } from '@/hooks/use-authentification'
import { listerRolesEvenementUtilisateur } from '@/services/authentification'
import { estUniquementAgent } from '@/lib/roles-evenement'

export const Route = createFileRoute('/agent')({
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

    const roles = listerRolesEvenementUtilisateur(utilisateur.id_utilisateur)
    // Un organisateur « complet » n'a pas vocation à rester ici.
    if (
      utilisateur.role_systeme === 'organisateur' &&
      !estUniquementAgent(roles) &&
      roles.some((r) => r === 'Propriétaire' || r === 'Organisateur')
    ) {
      throw redirect({ to: '/organisateur' })
    }
  },
  component: PageAgentProvisoire,
})
