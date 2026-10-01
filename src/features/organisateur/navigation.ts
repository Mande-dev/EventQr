import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UserRound,
  Table2,
  UserCheck,
  Mail,
  Ticket,
  FileDown,
  ClipboardCheck,
  BarChart3,
  MoreHorizontal,
} from 'lucide-react'
import type { LinkProps } from '@tanstack/react-router'

export type LienNavigation = {
  titre: string
  url: LinkProps['to']
  icone: React.ElementType
  necessiteEvenement?: boolean
}

/** Navigation section Général (pages globales). */
export const NAV_GENERAL: LienNavigation[] = [
  {
    titre: 'Tableau de bord',
    url: '/organisateur',
    icone: LayoutDashboard,
  },
  {
    titre: 'Mes événements',
    url: '/organisateur/evenements',
    icone: CalendarDays,
  },
  {
    titre: 'Profil',
    url: '/organisateur/profil',
    icone: UserRound,
  },
]

/** Navigation dépendante de l'événement actif. */
export const NAV_EVENEMENT: LienNavigation[] = [
  {
    titre: 'Utilisateurs',
    url: '/organisateur/utilisateurs',
    icone: Users,
    necessiteEvenement: true,
  },
  {
    titre: 'Invités',
    url: '/organisateur/invites',
    icone: UserCheck,
    necessiteEvenement: true,
  },
  {
    titre: 'Tables',
    url: '/organisateur/tables',
    icone: Table2,
    necessiteEvenement: true,
  },
  {
    titre: 'Affectation',
    url: '/organisateur/affectation',
    icone: ClipboardCheck,
    necessiteEvenement: true,
  },
  {
    titre: 'Invitations',
    url: '/organisateur/invitations',
    icone: Ticket,
    necessiteEvenement: true,
  },
  {
    titre: 'Modèle PDF',
    url: '/organisateur/invitation',
    icone: Mail,
    necessiteEvenement: true,
  },
  {
    titre: 'Export PDF',
    url: '/organisateur/generation',
    icone: FileDown,
    necessiteEvenement: true,
  },
  {
    titre: 'Présences',
    url: '/organisateur/presences',
    icone: ClipboardCheck,
    necessiteEvenement: true,
  },
  {
    titre: 'Statistiques',
    url: '/organisateur/statistiques',
    icone: BarChart3,
    necessiteEvenement: true,
  },
]

/** Onglets de la barre mobile (max 5 dont Plus). */
export const NAV_MOBILE_PRINCIPALE: LienNavigation[] = [
  {
    titre: 'Accueil',
    url: '/organisateur',
    icone: LayoutDashboard,
  },
  {
    titre: 'Événements',
    url: '/organisateur/evenements',
    icone: CalendarDays,
  },
  {
    titre: 'Invités',
    url: '/organisateur/invites',
    icone: UserCheck,
    necessiteEvenement: true,
  },
  {
    titre: 'Présences',
    url: '/organisateur/presences',
    icone: ClipboardCheck,
    necessiteEvenement: true,
  },
]

export const NAV_MOBILE_PLUS: LienNavigation[] = [
  ...NAV_EVENEMENT.filter(
    (l) =>
      l.url !== '/organisateur/invites' &&
      l.url !== '/organisateur/presences'
  ),
  {
    titre: 'Profil',
    url: '/organisateur/profil',
    icone: UserRound,
  },
]

export const ICONE_PLUS = MoreHorizontal
