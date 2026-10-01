export type TypeEvenement = 'mariage' | 'anniversaire'

export type RoleEvenement =
  | 'Propriétaire'
  | 'Organisateur'
  | 'Agent de contrôle'

export interface Evenement {
  id_evenement: string
  id_utilisateur_proprietaire: string
  nom_evenement: string
  type_evenement: TypeEvenement
  date_evenement: string
  heure_evenement: string
  lieu: string
  date_creation: string
}

export interface UtilisateurEvenement {
  id_utilisateur_evenement: string
  id_utilisateur: string
  id_evenement: string
  role_evenement: RoleEvenement
  date_affectation: string
}
