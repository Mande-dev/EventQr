import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { useAuthentification } from '@/hooks/use-authentification'
import { AppTitle } from './app-title'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'

// Sidebar principale du Super Administrateur EventQR.
export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const utilisateur = useAuthentification((etat) => etat.utilisateur)

  const utilisateurNav = utilisateur
    ? {
        name: `${utilisateur.prenom} ${utilisateur.nom}`,
        email: utilisateur.email,
        avatar: '/avatars/shadcn.jpg',
      }
    : sidebarData.user

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <AppTitle />
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((groupe) => (
          <NavGroup key={groupe.title} {...groupe} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={utilisateurNav} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
