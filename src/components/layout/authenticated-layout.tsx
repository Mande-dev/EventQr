import { Outlet } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Footer } from '@/components/layout/footer'
import { SkipToMain } from '@/components/skip-to-main'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

// Layout authentifié : sidebar + zone scrollable avec footer en bas de page.
export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  return (
    <SearchProvider>
      <LayoutProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <SkipToMain />
          <AppSidebar />
          <SidebarInset
            className={cn(
              '@container/content',
              // Hauteur viewport + scroll : le footer suit le flux (bas de page)
              'h-svh overflow-y-auto',
              'md:peer-data-[variant=inset]:h-[calc(100svh-(var(--spacing)*4))]'
            )}
          >
            {/*
              min-h-full = au moins toute la zone visible.
              Pas de min-h-0 : le contenu allonge la page et pousse le footer en bas.
              mt-auto sur le footer le plaque en bas si le contenu est court.
            */}
            <div className='flex min-h-full flex-col'>
              <div className='flex grow flex-col'>{children ?? <Outlet />}</div>
              <Footer />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </LayoutProvider>
    </SearchProvider>
  )
}
