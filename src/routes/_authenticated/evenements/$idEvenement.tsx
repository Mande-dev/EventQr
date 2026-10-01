import { createFileRoute } from '@tanstack/react-router'
import { DetailEvenement } from '@/features/evenements/detail-evenement'

export const Route = createFileRoute('/_authenticated/evenements/$idEvenement')({
  component: function RouteDetailEvenement() {
    const { idEvenement } = Route.useParams()
    return <DetailEvenement idEvenement={idEvenement} />
  },
})
