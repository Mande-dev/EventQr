import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn } from 'lucide-react'
import { useAuthentification } from '@/hooks/use-authentification'
import { listerRolesEvenementUtilisateur } from '@/services/authentification'
import { cheminApresConnexion } from '@/lib/roles-evenement'
import { afficherErreur } from '@/lib/alertes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'

const schemaConnexion = z.object({
  email: z.email({ error: 'Adresse e-mail invalide.' }),
  mot_de_passe: z
    .string()
    .min(1, 'Le mot de passe est obligatoire.')
    .min(7, 'Le mot de passe doit contenir au moins 7 caractères.'),
})

type DonneesConnexion = z.infer<typeof schemaConnexion>

type ProprietesFormulaireConnexion = React.HTMLAttributes<HTMLFormElement> & {
  redirectTo?: string
}

/** Normalise une URL ou un chemin de redirection en pathname. */
function normaliserChemin(redirectTo: string): string {
  try {
    if (redirectTo.startsWith('http://') || redirectTo.startsWith('https://')) {
      return new URL(redirectTo).pathname
    }
  } catch {
    /* ignore */
  }
  return redirectTo.split('?')[0]?.split('#')[0] || '/'
}

/**
 * Choisit la destination post-connexion.
 * Ignore un ?redirect= incompatible (ex. / pour un organisateur → évite le 403).
 */
function destinationApresConnexion(
  roleSysteme: string,
  rolesEvenement: ReturnType<typeof listerRolesEvenementUtilisateur>,
  redirectTo?: string
): string {
  const cible = cheminApresConnexion(roleSysteme, rolesEvenement)
  if (!redirectTo) return cible

  const chemin = normaliserChemin(redirectTo)

  if (
    cible === '/organisateur' &&
    (chemin === '/organisateur' || chemin.startsWith('/organisateur/'))
  ) {
    return chemin
  }
  if (cible === '/agent' && (chemin === '/agent' || chemin.startsWith('/agent/'))) {
    return chemin
  }
  if (
    cible === '/' &&
    !chemin.startsWith('/organisateur') &&
    !chemin.startsWith('/agent') &&
    chemin !== '/connexion'
  ) {
    return chemin === '' ? '/' : chemin
  }

  return cible
}

// Formulaire de connexion EventQR (super admin, organisateur, agent).
export function FormulaireConnexion({
  className,
  redirectTo,
  ...props
}: ProprietesFormulaireConnexion) {
  const [chargement, definirChargement] = useState(false)
  const navigate = useNavigate()
  const connecter = useAuthentification((etat) => etat.connecter)

  const formulaire = useForm<DonneesConnexion>({
    resolver: zodResolver(schemaConnexion),
    defaultValues: {
      email: 'organisateur@eventqr.com',
      mot_de_passe: 'Organisateur123!',
    },
  })

  // Soumet les identifiants et redirige selon le rôle.
  const soumettre = async (donnees: DonneesConnexion) => {
    definirChargement(true)
    try {
      await connecter(donnees.email.trim(), donnees.mot_de_passe.trim())
      const utilisateur = useAuthentification.getState().utilisateur
      if (!utilisateur) throw new Error('Session invalide.')

      const roles = listerRolesEvenementUtilisateur(utilisateur.id_utilisateur)
      const destination = destinationApresConnexion(
        utilisateur.role_systeme,
        roles,
        redirectTo
      )

      await navigate({ href: destination, replace: true })
    } catch (erreur) {
      const message =
        erreur instanceof Error ? erreur.message : 'Échec de la connexion.'
      await afficherErreur('Connexion impossible', message)
    } finally {
      definirChargement(false)
    }
  }

  return (
    <Form {...formulaire}>
      <form
        onSubmit={formulaire.handleSubmit(soumettre)}
        className={cn('grid gap-4', className)}
        {...props}
      >
        <FormField
          control={formulaire.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input
                  type='email'
                  autoComplete='username'
                  placeholder='organisateur@eventqr.com'
                  className='min-h-11'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={formulaire.control}
          name='mot_de_passe'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe</FormLabel>
              <FormControl>
                <PasswordInput
                  autoComplete='current-password'
                  placeholder='********'
                  className='min-h-11'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type='submit'
          className='mt-2 min-h-11 hover:bg-principal-hover'
          disabled={chargement}
        >
          {chargement ? <Loader2 className='animate-spin' /> : <LogIn />}
          Se connecter
        </Button>
        <div className='rounded-lg bg-muted/70 px-3 py-2 text-center text-xs text-muted-foreground'>
          <p>Organisateur : organisateur@eventqr.com / Organisateur123!</p>
          <p className='mt-1'>Admin : admin@eventqr.com / Admin123!</p>
          <p className='mt-1'>Agent : agent.demo@email.cd / Agent2024!</p>
          <p className='mt-1'>
            Types d’événement : mariage et anniversaire uniquement.
          </p>
        </div>
      </form>
    </Form>
  )
}
