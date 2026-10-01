import type { ParametresPlateforme } from '@/types'

// Paramètres initiaux de la plateforme EventQR.
export const MOCK_PARAMETRES: ParametresPlateforme = {
  nom_plateforme: 'EventQR',
  description:
    'Plateforme SaaS de gestion d’événements avec invitations à QR code.',
  email_contact: 'contact@eventqr.com',
  telephone_contact: '+243810000000',
  longueur_minimale_mot_de_passe: 8,
  duree_session_minutes: 480,
  fuseau_horaire: 'Africa/Kinshasa',
  langue_par_defaut: 'fr',
}
