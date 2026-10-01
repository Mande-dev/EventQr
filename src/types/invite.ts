export type StatutPresence = 'present' | 'absent'

/** Type d’unité d’invitation (indivisible pour couple / famille / groupe). */
export type TypeInvitation = 'seul' | 'couple' | 'famille' | 'groupe'

/** Personne invitée — uniquement le nom complet (sans QR). */
export interface Invite {
  id_invite: string
  id_evenement: string
  nom_complet: string
  statut_presence: StatutPresence
  date_scan: string | null
  date_creation: string
}

export interface TableEvenement {
  id_table: string
  id_evenement: string
  numero_table: number
  nom_table: string
  capacite: number
}

export interface Affectation {
  id_affectation: string
  id_invite: string
  id_table: string
  date_affectation: string
}

/**
 * Invitation regroupant 1..n invités.
 * Le code QR est généré à la création de l’invitation (pas à la création de l’invité).
 * Couple / famille / groupe = unité indivisible.
 */
export interface Invitation {
  id_invitation: string
  id_evenement: string
  ids_invites: string[]
  code_qr: string
  type_invitation: TypeInvitation
  /** Libellé affiché (requis pour famille / groupe). */
  libelle_groupe?: string
  statut_presence: StatutPresence
  date_scan: string | null
  date_creation: string
}

/** Modèle PDF d’invitation (zones nom / QR). */
export interface ModeleInvitation {
  id_modele: string
  id_evenement: string
  fichier_pdf: string
  zone_nom_x: number
  zone_nom_y: number
  zone_nom_largeur: number
  zone_nom_hauteur: number
  zone_qr_x: number
  zone_qr_y: number
  zone_qr_largeur: number
  zone_qr_hauteur: number
  date_creation: string
}
