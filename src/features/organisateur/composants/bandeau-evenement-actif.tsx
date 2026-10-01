import { Link, useRouterState } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import { useEvenementActif } from '@/context/evenement-actif-provider'
import { useQuery } from '@tanstack/react-query'
import { listerEvenementsOrganisateur } from '@/services/evenements'
import { useAuthentification } from '@/hooks/use-authentification'
import { formaterDate } from '@/lib/formatage'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EtatVide } from '@/components/etat-vide'

type ProprietesBandeau = {
  className?: string
  obligatoire?: boolean
}

/** Bandeau / sélecteur de l'événement actif. */
export function BandeauEvenementActif({
  className,
  obligatoire = false,
}: ProprietesBandeau) {
  const utilisateur = useAuthentification((e) => e.utilisateur)
  const { evenementActif, definirEvenementActif } = useEvenementActif()
  const chemin = useRouterState({ select: (s) => s.location.pathname })

  const { data: evenements = [] } = useQuery({
    queryKey: ['evenements-organisateur', utilisateur?.id_utilisateur],
    queryFn: () =>
      listerEvenementsOrganisateur(utilisateur!.id_utilisateur),
    enabled: Boolean(utilisateur),
  })

  if (!evenementActif && obligatoire) {
    return (
      <div className={cn('px-4 py-6', className)}>
        <EtatVide
          titre='Aucun événement sélectionné'
          description='Choisissez un événement pour accéder à cette page.'
          action={
            <Button asChild>
              <Link to='/organisateur/evenements'>Mes événements</Link>
            </Button>
          }
        />
      </div>
    )
  }

  if (!evenementActif && !obligatoire) return null

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 border-b border-border bg-accent/40 px-3 py-2 sm:px-4',
        className
      )}
    >
      <span className='text-xs font-medium text-muted-foreground'>
        Événement en cours
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='outline'
            size='sm'
            className='min-h-11 max-w-full gap-2 truncate sm:min-h-9'
          >
            <span className='truncate font-semibold text-primary'>
              {evenementActif?.nom_evenement ?? 'Choisir…'}
            </span>
            <ChevronDown className='size-4 shrink-0 opacity-70' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start' className='w-72'>
          <DropdownMenuLabel>Changer d’événement</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {evenements.map((evt) => (
            <DropdownMenuItem
              key={evt.id_evenement}
              onClick={() => definirEvenementActif(evt)}
              className={cn(
                evt.id_evenement === evenementActif?.id_evenement &&
                  'bg-accent'
              )}
            >
              <div className='flex min-w-0 flex-col'>
                <span className='truncate font-medium'>{evt.nom_evenement}</span>
                <span className='text-xs text-muted-foreground'>
                  {formaterDate(evt.date_evenement)} · {evt.heure_evenement}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
          {evenements.length === 0 ? (
            <DropdownMenuItem disabled>Aucun événement</DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to='/organisateur/evenements'>Voir tous les événements</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {chemin.includes('/organisateur/') ? null : null}
    </div>
  )
}

/** Affiche un état vide si aucun événement actif (pages 3–10). */
export function GardeEvenementActif({
  children,
}: {
  children: React.ReactNode
}) {
  const { evenementActif } = useEvenementActif()
  if (!evenementActif) {
    return <BandeauEvenementActif obligatoire />
  }
  return (
    <>
      <BandeauEvenementActif />
      {children}
    </>
  )
}
