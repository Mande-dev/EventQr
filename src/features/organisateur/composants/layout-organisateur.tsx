import { useState } from 'react'
import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { FournisseurEvenementActif } from '@/context/evenement-actif-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { SkipToMain } from '@/components/skip-to-main'
import { useEcran } from '@/hooks/use-ecran'
import { BarreNavigationMobile } from '@/features/organisateur/composants/barre-navigation-mobile'
import { SidebarOrganisateur } from '@/features/organisateur/composants/sidebar-organisateur'
import { NAV_MOBILE_PLUS } from '@/features/organisateur/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

/** Layout adaptatif de l'interface organisateur. */
export function LayoutOrganisateur() {
  const { estMobile } = useEcran()
  const [plusOuvert, definirPlusOuvert] = useState(false)
  const chemin = useRouterState({ select: (s) => s.location.pathname })
  const defaultOpen = getCookie('sidebar_state') !== 'false'

  return (
    <FournisseurEvenementActif>
      <SearchProvider>
        <LayoutProvider>
          {estMobile ? (
            <div className='flex min-h-svh flex-col bg-background'>
              <SkipToMain />
              <div className='flex min-h-0 grow flex-col pb-[calc(4rem+env(safe-area-inset-bottom))]'>
                <Outlet />
              </div>
              <BarreNavigationMobile
                plusOuvert={plusOuvert}
                surOuvrirPlus={() => definirPlusOuvert(true)}
              />
              <Sheet open={plusOuvert} onOpenChange={definirPlusOuvert}>
                <SheetContent side='bottom' className='rounded-t-xl pb-[env(safe-area-inset-bottom)]'>
                  <SheetHeader>
                    <SheetTitle>Plus</SheetTitle>
                  </SheetHeader>
                  <ul className='mt-2 grid gap-1 pb-4'>
                    {NAV_MOBILE_PLUS.map((lien) => {
                      const Icone = lien.icone
                      const actif =
                        chemin === String(lien.url) ||
                        chemin.startsWith(`${lien.url}/`)
                      return (
                        <li key={String(lien.url)}>
                          <Link
                            to={lien.url}
                            onClick={() => definirPlusOuvert(false)}
                            className={cn(
                              'flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150',
                              actif
                                ? 'bg-accent font-semibold text-primary'
                                : 'text-foreground hover:bg-muted'
                            )}
                          >
                            <Icone className='size-5 shrink-0' />
                            {lien.titre}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </SheetContent>
              </Sheet>
            </div>
          ) : (
            <SidebarProvider defaultOpen={defaultOpen}>
              <SkipToMain />
              <SidebarOrganisateur />
              <SidebarInset
                className={cn(
                  '@container/content h-svh overflow-y-auto',
                  'md:peer-data-[variant=inset]:h-[calc(100svh-(var(--spacing)*4))]'
                )}
              >
                <div className='flex min-h-full flex-col'>
                  <div className='flex grow flex-col'>
                    <Outlet />
                  </div>
                </div>
              </SidebarInset>
            </SidebarProvider>
          )}
        </LayoutProvider>
      </SearchProvider>
    </FournisseurEvenementActif>
  )
}
