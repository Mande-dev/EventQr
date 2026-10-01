export interface ParametresPlateforme {
  nom_plateforme: string
  description: string
  email_contact: string
  telephone_contact: string
  longueur_minimale_mot_de_passe: number
  duree_session_minutes: number
  fuseau_horaire: string
  langue_par_defaut: string
}

export interface StatistiquesGlobales {
  nombre_utilisateurs: number
  nombre_evenements: number
  total_invites: number
  invites_presents: number
  invites_absents: number
  taux_presence: number
  evenements_par_type: { type: string; nombre: number }[]
  evolution_mensuelle: { mois: string; evenements: number; invites: number }[]
}
