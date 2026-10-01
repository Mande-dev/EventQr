import { createFileRoute } from '@tanstack/react-router'
import { DetailUtilisateur } from '@/features/utilisateurs/detail-utilisateur'

export const Route = createFileRoute(
  '/_authenticated/utilisateurs/$idUtilisateur'
)({
  component: function RouteDetailUtilisateur() {
    const { idUtilisateur } = Route.useParams()
    return <DetailUtilisateur idUtilisateur={idUtilisateur} />
  },
})
