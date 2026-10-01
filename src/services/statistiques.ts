import { memoire } from './memoire'
import type { StatistiquesGlobales } from '@/types'
import { simulerDelai } from './delai'

const LIBELLES_MOIS = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Aoû',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
]

// Calcule les statistiques globales à partir des mocks mémoire.
export const obtenirStatistiquesGlobales =
  async (): Promise<StatistiquesGlobales> => {
    const invitesPresents = memoire.invites.filter(
      (item) => item.statut_presence === 'present'
    ).length
    const invitesAbsents = memoire.invites.length - invitesPresents
    const tauxPresence =
      memoire.invites.length === 0
        ? 0
        : Math.round((invitesPresents / memoire.invites.length) * 1000) / 10

    const compteurTypes = new Map<string, number>()
    for (const evenement of memoire.evenements) {
      compteurTypes.set(
        evenement.type_evenement,
        (compteurTypes.get(evenement.type_evenement) ?? 0) + 1
      )
    }

    const evolution_mensuelle = LIBELLES_MOIS.map((mois, index) => {
      const evenements = memoire.evenements.filter((item) => {
        const moisDate = new Date(item.date_evenement).getMonth()
        return moisDate === index
      }).length
      const invites = memoire.invites.filter((item) => {
        const evenement = memoire.evenements.find(
          (evt) => evt.id_evenement === item.id_evenement
        )
        if (!evenement) return false
        return new Date(evenement.date_evenement).getMonth() === index
      }).length
      return { mois, evenements, invites }
    }).filter((item) => item.evenements > 0 || item.invites > 0)

    return simulerDelai({
      nombre_utilisateurs: memoire.utilisateurs.length,
      nombre_evenements: memoire.evenements.length,
      total_invites: memoire.invites.length,
      invites_presents: invitesPresents,
      invites_absents: invitesAbsents,
      taux_presence: tauxPresence,
      evenements_par_type: Array.from(compteurTypes.entries()).map(
        ([type, nombre]) => ({ type, nombre })
      ),
      evolution_mensuelle,
    })
  }
