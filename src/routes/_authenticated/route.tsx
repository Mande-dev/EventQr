import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useAuthentification } from '@/hooks/use-authentification'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    useAuthentification.getState().restaurerSession()
    const { jeton, utilisateur } = useAuthentification.getState()

    if (!jeton || !utilisateur) {
      throw redirect({
        to: '/connexion',
        search: { redirect: location.href },
      })
    }

    if (utilisateur.role_systeme !== 'super_admin') {
      throw redirect({ to: '/403' })
    }
  },
  component: AuthenticatedLayout,
})
