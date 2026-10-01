import { ArrowLeft } from 'lucide-react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useEcran } from '@/hooks/use-ecran'

type ProprietesEnTete = {
  titre: string
  actions?: React.ReactNode
  afficherRetour?: boolean
  className?: string
}

/** En-tête compact type application (mobile) / sticky (bureau). */
export function EnTeteOrganisateur({
  titre,
  actions,
  afficherRetour = false,
  className,
}: ProprietesEnTete) {
  const { estMobile } = useEcran()
  const navigate = useNavigate()
  const router = useRouter()

  // Revient à la page précédente ou au tableau de bord.
  const revenir = () => {
    if (window.history.length > 1) {
      router.history.back()
    } else {
      void navigate({ to: '/organisateur' })
    }
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 sm:h-16 sm:px-4',
        'pt-[env(safe-area-inset-top)]',
        className
      )}
    >
      {estMobile && afficherRetour ? (
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='size-11 shrink-0'
          onClick={revenir}
          aria-label='Retour'
        >
          <ArrowLeft className='size-5' />
        </Button>
      ) : null}
      <h1 className='min-w-0 flex-1 truncate text-base font-semibold tracking-tight text-primary sm:text-lg'>
        {titre}
      </h1>
      {actions ? (
        <div className='flex shrink-0 items-center gap-2'>{actions}</div>
      ) : null}
    </header>
  )
}
