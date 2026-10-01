import { useSearch } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '@/features/auth/auth-layout'
import { FormulaireConnexion } from './formulaire-connexion'

// Page de connexion EventQR (admin, organisateur, agent).
export function PageConnexion() {
  const { redirect } = useSearch({ from: '/(auth)/connexion' })

  return (
    <AuthLayout>
      <Card className='w-full border-border/80 shadow-sm'>
        <CardHeader className='space-y-1 pb-2 text-center sm:text-start'>
          <CardTitle className='text-xl tracking-tight text-primary'>
            Connexion
          </CardTitle>
          <CardDescription>
            Accédez à votre espace EventQR.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormulaireConnexion redirectTo={redirect} />
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
