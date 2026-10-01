import type { RoleEvenement } from '@/types'

const ROLES_ORGANISATEUR: RoleEvenement[] = ['Propriétaire', 'Organisateur']

/** True si l'utilisateur a au moins un rôle Propriétaire ou Organisateur. */
export function peutAccederInterfaceOrganisateur(
  roles: RoleEvenement[]
): boolean {
  return roles.some((role) => ROLES_ORGANISATEUR.includes(role))
}

/** True si l'utilisateur n'a que le rôle Agent de contrôle (au moins un). */
export function estUniquementAgent(roles: RoleEvenement[]): boolean {
  return (
    roles.length > 0 && roles.every((role) => role === 'Agent de contrôle')
  )
}

/** Destination post-connexion selon le rôle système et les rôles d'événement. */
export function cheminApresConnexion(
  roleSysteme: string,
  rolesEvenement: RoleEvenement[]
): '/' | '/organisateur' | '/agent' {
  if (roleSysteme === 'super_admin') return '/'
  if (estUniquementAgent(rolesEvenement)) return '/agent'
  return '/organisateur'
}
