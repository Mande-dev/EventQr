import { createFileRoute, redirect } from '@tanstack/react-router'

// Redirige l'ancienne route template vers /connexion.
export const Route = createFileRoute('/(auth)/sign-in')({
  beforeLoad: ({ search }) => {
    throw redirect({
      to: '/connexion',
      search,
    })
  },
})
