import {
  MOCK_AFFECTATIONS,
  MOCK_EVENEMENTS,
  MOCK_INVITATIONS,
  MOCK_INVITES,
  MOCK_MODELES,
  MOCK_TABLES,
  MOCK_UTILISATEURS,
  MOCK_UTILISATEURS_EVENEMENTS,
} from '@/mocks'
import type {
  Affectation,
  Evenement,
  Invitation,
  Invite,
  ModeleInvitation,
  TableEvenement,
  Utilisateur,
  UtilisateurEvenement,
} from '@/types'

/** Stockage mutable partagé pour les services (session navigateur). */
export const memoire = {
  utilisateurs: structuredClone(MOCK_UTILISATEURS) as Utilisateur[],
  evenements: structuredClone(MOCK_EVENEMENTS) as Evenement[],
  utilisateursEvenements: structuredClone(
    MOCK_UTILISATEURS_EVENEMENTS
  ) as UtilisateurEvenement[],
  invites: structuredClone(MOCK_INVITES) as Invite[],
  tables: structuredClone(MOCK_TABLES) as TableEvenement[],
  affectations: structuredClone(MOCK_AFFECTATIONS) as Affectation[],
  invitations: structuredClone(MOCK_INVITATIONS) as Invitation[],
  modeles: structuredClone(MOCK_MODELES) as ModeleInvitation[],
}

/** Génère un identifiant unique préfixé. */
export function genererId(prefixe: string): string {
  return `${prefixe}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/** Génère un code QR unique (réservé aux invitations). */
export function genererCodeQr(): string {
  const partie = Math.random().toString(36).slice(2, 8).toUpperCase()
  const annee = new Date().getFullYear()
  return `EQR-${partie}-${annee}`
}
