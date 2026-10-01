import {
  LayoutDashboard,
  Users,
  CalendarDays,
  BarChart3,
  Settings,
  UserRound,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Jean-Pierre Mbala',
    email: 'admin@eventqr.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'EventQR',
      logo: LayoutDashboard,
      plan: 'Super Administrateur',
    },
  ],
  navGroups: [
    {
      title: 'Navigation',
      items: [
        {
          title: 'Tableau de bord',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Utilisateurs',
          url: '/utilisateurs',
          icon: Users,
        },
        {
          title: 'Événements',
          url: '/evenements',
          icon: CalendarDays,
        },
        {
          title: 'Statistiques',
          url: '/statistiques',
          icon: BarChart3,
        },
        {
          title: 'Paramètres',
          url: '/parametres',
          icon: Settings,
        },
        {
          title: 'Profil',
          url: '/profil',
          icon: UserRound,
        },
      ],
    },
  ],
}
