import { createFileRoute } from '@tanstack/react-router'
import { PageTables } from '@/features/organisateur/tables'

export const Route = createFileRoute('/organisateur/tables')({
  component: PageTables,
})
