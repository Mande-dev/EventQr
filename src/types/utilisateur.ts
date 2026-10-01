export type RoleSysteme = 'super_admin' | 'organisateur'

export interface Utilisateur {
  id_utilisateur: string
  nom: string
  prenom: string
  email: string
  telephone: string
  mot_de_passe: string
  role_systeme: RoleSysteme
  actif: boolean
  date_creation: string
}
