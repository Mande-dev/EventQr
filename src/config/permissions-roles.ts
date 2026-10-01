import type { RoleEvenement } from '@/types'

/** Actions protégées dans l'interface organisateur. */
export type ActionPermission =
  | 'supprimer_evenement'
  | 'modifier_proprietaire'
  | 'retirer_proprietaire'
  | 'gerer_utilisateurs_evenement'
  | 'gerer_invites'
  | 'gerer_tables'
  | 'gerer_affectations'
  | 'gerer_invitations'
  | 'voir_presences'
  | 'voir_statistiques'

/**
 * Matrice de permissions par rôle d'événement.
 * Facile à ajuster sans toucher aux pages.
 */
export const PERMISSIONS_ROLES: Record<
  RoleEvenement,
  ReadonlyArray<ActionPermission>
> = {
  Propriétaire: [
    'supprimer_evenement',
    'modifier_proprietaire',
    'retirer_proprietaire',
    'gerer_utilisateurs_evenement',
    'gerer_invites',
    'gerer_tables',
    'gerer_affectations',
    'gerer_invitations',
    'voir_presences',
    'voir_statistiques',
  ],
  Organisateur: [
    'gerer_utilisateurs_evenement',
    'gerer_invites',
    'gerer_tables',
    'gerer_affectations',
    'gerer_invitations',
    'voir_presences',
    'voir_statistiques',
  ],
  'Agent de contrôle': ['voir_presences'],
}

/** Indique si un rôle autorise une action. */
export function aPermission(
  role: RoleEvenement | null | undefined,
  action: ActionPermission
): boolean {
  if (!role) return false
  return PERMISSIONS_ROLES[role].includes(action)
}
