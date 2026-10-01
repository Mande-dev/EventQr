import type { Evenement, UtilisateurEvenement } from '@/types'

/**
 * Événements mock — uniquement mariage et anniversaire.
 * Compte démo organisateur (usr-002) = propriétaire de evt-001.
 */
export const MOCK_EVENEMENTS: Evenement[] = [
  {
    id_evenement: 'evt-001',
    id_utilisateur_proprietaire: 'usr-002',
    nom_evenement: 'Mariage Kasongo & Ilunga',
    type_evenement: 'mariage',
    date_evenement: '2025-06-14',
    heure_evenement: '15:00',
    lieu: 'Hôtel Memling, Kinshasa',
    date_creation: '2025-01-10T10:00:00.000Z',
  },
  {
    id_evenement: 'evt-003',
    id_utilisateur_proprietaire: 'usr-004',
    nom_evenement: 'Anniversaire 50 ans Mama Grace',
    type_evenement: 'anniversaire',
    date_evenement: '2025-04-05',
    heure_evenement: '18:30',
    lieu: 'Jardin Botanique, Kinshasa',
    date_creation: '2025-01-20T14:00:00.000Z',
  },
  {
    id_evenement: 'evt-008',
    id_utilisateur_proprietaire: 'usr-011',
    nom_evenement: 'Mariage Kalala & Ndaya',
    type_evenement: 'mariage',
    date_evenement: '2025-08-23',
    heure_evenement: '14:00',
    lieu: 'Fleuve Congo Hotel, Kinshasa',
    date_creation: '2025-03-15T10:30:00.000Z',
  },
  {
    id_evenement: 'evt-011',
    id_utilisateur_proprietaire: 'usr-015',
    nom_evenement: 'Anniversaire Entreprise Mputu SA',
    type_evenement: 'anniversaire',
    date_evenement: '2025-12-05',
    heure_evenement: '17:00',
    lieu: 'Terrace Beach, Kinshasa',
    date_creation: '2025-06-01T15:00:00.000Z',
  },
]

/**
 * Affectations utilisateurs ↔ événements.
 * usr-002 (organisateur@) = Propriétaire evt-001 + Organisateur evt-003 (multi-événements).
 */
export const MOCK_UTILISATEURS_EVENEMENTS: UtilisateurEvenement[] = [
  {
    id_utilisateur_evenement: 'ue-001',
    id_utilisateur: 'usr-002',
    id_evenement: 'evt-001',
    role_evenement: 'Propriétaire',
    date_affectation: '2025-01-10T10:00:00.000Z',
  },
  {
    id_utilisateur_evenement: 'ue-002',
    id_utilisateur: 'usr-008',
    id_evenement: 'evt-001',
    role_evenement: 'Organisateur',
    date_affectation: '2025-01-12T10:00:00.000Z',
  },
  {
    id_utilisateur_evenement: 'ue-003',
    id_utilisateur: 'usr-007',
    id_evenement: 'evt-001',
    role_evenement: 'Agent de contrôle',
    date_affectation: '2025-01-15T10:00:00.000Z',
  },
  {
    id_utilisateur_evenement: 'ue-026',
    id_utilisateur: 'usr-018',
    id_evenement: 'evt-001',
    role_evenement: 'Agent de contrôle',
    date_affectation: '2025-05-25T09:00:00.000Z',
  },
  {
    id_utilisateur_evenement: 'ue-007',
    id_utilisateur: 'usr-004',
    id_evenement: 'evt-003',
    role_evenement: 'Propriétaire',
    date_affectation: '2025-01-20T14:00:00.000Z',
  },
  {
    id_utilisateur_evenement: 'ue-008',
    id_utilisateur: 'usr-002',
    id_evenement: 'evt-003',
    role_evenement: 'Organisateur',
    date_affectation: '2025-01-22T14:00:00.000Z',
  },
  {
    id_utilisateur_evenement: 'ue-016',
    id_utilisateur: 'usr-011',
    id_evenement: 'evt-008',
    role_evenement: 'Propriétaire',
    date_affectation: '2025-03-15T10:30:00.000Z',
  },
  {
    id_utilisateur_evenement: 'ue-017',
    id_utilisateur: 'usr-012',
    id_evenement: 'evt-008',
    role_evenement: 'Organisateur',
    date_affectation: '2025-03-16T10:30:00.000Z',
  },
  {
    id_utilisateur_evenement: 'ue-018',
    id_utilisateur: 'usr-017',
    id_evenement: 'evt-008',
    role_evenement: 'Agent de contrôle',
    date_affectation: '2025-03-20T10:30:00.000Z',
  },
  {
    id_utilisateur_evenement: 'ue-022',
    id_utilisateur: 'usr-015',
    id_evenement: 'evt-011',
    role_evenement: 'Propriétaire',
    date_affectation: '2025-06-01T15:00:00.000Z',
  },
  {
    id_utilisateur_evenement: 'ue-023',
    id_utilisateur: 'usr-017',
    id_evenement: 'evt-011',
    role_evenement: 'Organisateur',
    date_affectation: '2025-06-05T15:00:00.000Z',
  },
]
