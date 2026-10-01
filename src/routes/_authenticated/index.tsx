import { createFileRoute } from '@tanstack/react-router'
import { TableauDeBord } from '@/features/tableau-de-bord'

export const Route = createFileRoute('/_authenticated/')({
  component: TableauDeBord,
})
