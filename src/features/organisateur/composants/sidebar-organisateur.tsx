import { Link, useRouterState } from '@tanstack/react-router'
import { ChevronsUpDown } from 'lucide-react'
import { useAuthentification } from '@/hooks/use-authentification'
import { cn } from '@/lib/utils'
import {
  NAV_EVENEMENT,
  NAV_GENERAL,
} from '@/features/organisateur/navigation'
import { useEvenementActif } from '@/context/evenement-actif-provider'
import { AppTitle } from '@/components/layout/app-title'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useNavigate } from '@tanstack/react-router'
import { demanderConfirmation } from '@/lib/alertes'

/** Indique si un lien de sidebar est actif. */
function lienActif(chemin: string, url: string): boolean {
  if (url === '/organisateur') return chemin === '/organisateur'
  return chemin === url || chemin.startsWith(`${url}/`)
}

/** Sidebar bureau de l'organisateur (sections Général / Événement). */
export function SidebarOrganisateur() {
  const chemin = useRouterState({ select: (s) => s.location.pathname })
  const utilisateur = useAuthentification((e) => e.utilisateur)
  const deconnecter = useAuthentification((e) => e.deconnecter)
  const { evenementActif } = useEvenementActif()
  const { isMobile, setOpenMobile } = useSidebar()
  const navigate = useNavigate()

  const initiales = utilisateur
    ? `${utilisateur.prenom.charAt(0)}${utilisateur.nom.charAt(0)}`.toUpperCase()
    : 'OR'

  // Déconnexion avec confirmation.
  const seDeconnecter = async () => {
    const ok = await demanderConfirmation({
      titre: 'Se déconnecter ?',
      texte: 'Vous quitterez l’espace organisateur.',
    })
    if (!ok) return
    await deconnecter()
    void navigate({ to: '/connexion' })
  }

  return (
    <Sidebar collapsible='icon' variant='sidebar'>
      <SidebarHeader>
        <AppTitle cheminAccueil='/organisateur' />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Général</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_GENERAL.map((lien) => {
              const Icone = lien.icone
              return (
                <SidebarMenuItem key={String(lien.url)}>
                  <SidebarMenuButton
                    asChild
                    isActive={lienActif(chemin, String(lien.url))}
                    tooltip={lien.titre}
                    onClick={() => {
                      if (isMobile) setOpenMobile(false)
                    }}
                  >
                    <Link to={lien.url}>
                      <Icone />
                      <span>{lien.titre}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
            Événement en cours
            {evenementActif ? (
              <span className='mt-0.5 block truncate text-[10px] font-normal opacity-70'>
                {evenementActif.nom_evenement}
              </span>
            ) : null}
          </SidebarGroupLabel>
          <SidebarMenu>
            {NAV_EVENEMENT.map((lien) => {
              const Icone = lien.icone
              return (
                <SidebarMenuItem key={String(lien.url)}>
                  <SidebarMenuButton
                    asChild
                    isActive={lienActif(chemin, String(lien.url))}
                    tooltip={lien.titre}
                    className={cn(!evenementActif && 'opacity-70')}
                    onClick={() => {
                      if (isMobile) setOpenMobile(false)
                    }}
                  >
                    <Link to={lien.url}>
                      <Icone />
                      <span>{lien.titre}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  <Avatar className='size-8 rounded-lg'>
                    <AvatarFallback className='rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                      {initiales}
                    </AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-semibold'>
                      {utilisateur
                        ? `${utilisateur.prenom} ${utilisateur.nom}`
                        : 'Organisateur'}
                    </span>
                    <span className='truncate text-xs opacity-80'>
                      {utilisateur?.email}
                    </span>
                  </div>
                  <ChevronsUpDown className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
                side='bottom'
                align='end'
                sideOffset={4}
              >
                <DropdownMenuLabel className='font-normal'>
                  Mon compte
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to='/organisateur/profil'>Profil</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void seDeconnecter()}>
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
