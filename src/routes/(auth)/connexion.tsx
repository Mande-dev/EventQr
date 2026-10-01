import { z } from 'zod'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { PageConnexion } from '@/features/connexion'
import { useAuthentification } from '@/hooks/use-authentification'
import { listerRolesEvenementUtilisateur } from '@/services/authentification'
import { cheminApresConnexion } from '@/lib/roles-evenement'

const schemaRecherche = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/(auth)/connexion')({
  validateSearch: schemaRecherche,
  beforeLoad: () => {
    useAuthentification.getState().restaurerSession()
    const { jeton, utilisateur } = useAuthentification.getState()
    if (jeton && utilisateur) {
      const roles = listerRolesEvenementUtilisateur(utilisateur.id_utilisateur)
      throw redirect({
        to: cheminApresConnexion(utilisateur.role_systeme, roles),
      })
    }
  },
  component: PageConnexion,
})
