import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import {
  ICONE_PLUS,
  NAV_MOBILE_PRINCIPALE,
  type LienNavigation,
} from '@/features/organisateur/navigation'

type ProprietesBarreMobile = {
  surOuvrirPlus: () => void
  plusOuvert: boolean
}

/** Indique si un lien correspond à la route courante. */
function estActif(chemin: string, url: string): boolean {
  if (url === '/organisateur') return chemin === '/organisateur'
  return chemin === url || chemin.startsWith(`${url}/`)
}

/** Barre de navigation fixe en bas (mobile). */
export function BarreNavigationMobile({
  surOuvrirPlus,
  plusOuvert,
}: ProprietesBarreMobile) {
  const chemin = useRouterState({ select: (s) => s.location.pathname })
  const IconePlus = ICONE_PLUS

  return (
    <nav
      className='fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden'
      aria-label='Navigation principale'
    >
      <ul className='grid h-16 grid-cols-5'>
        {NAV_MOBILE_PRINCIPALE.map((lien: LienNavigation) => {
          const Icone = lien.icone
          const actif = estActif(chemin, String(lien.url))
          return (
            <li key={String(lien.url)}>
              <Link
                to={lien.url}
                className={cn(
                  'flex h-full min-h-11 flex-col items-center justify-center gap-0.5 px-1 text-[10px] transition-colors duration-200',
                  actif
                    ? 'font-semibold text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <Icone className='size-5' aria-hidden />
                <span className='truncate'>{lien.titre}</span>
              </Link>
            </li>
          )
        })}
        <li>
          <button
            type='button'
            onClick={surOuvrirPlus}
            className={cn(
              'flex h-full min-h-11 w-full flex-col items-center justify-center gap-0.5 px-1 text-[10px] transition-colors duration-200',
              plusOuvert
                ? 'font-semibold text-primary'
                : 'text-muted-foreground'
            )}
            aria-expanded={plusOuvert}
            aria-label='Plus de navigation'
          >
            <IconePlus className='size-5' aria-hidden />
            <span>Plus</span>
          </button>
        </li>
      </ul>
    </nav>
  )
}
