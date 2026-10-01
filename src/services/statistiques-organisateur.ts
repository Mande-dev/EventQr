import { memoire } from './memoire'
import { simulerDelai } from './delai'

export type StatistiquesEvenement = {
  total_invites: number
  presents: number
  absents: number
  affectes: number
  non_affectes: number
  total_tables: number
  places_totales: number
  places_occupees: number
  occupation_tables: Array<{
    numero_table: number
    nom_table: string
    libelle: string
    capacite: number
    occupees: number
  }>
}

export type StatistiquesOrganisateur = {
  nombre_evenements: number
  total_invites: number
  presents: number
  absents: number
  evenements_a_venir: Array<{
    id_evenement: string
    nom_evenement: string
    date_evenement: string
    heure_evenement: string
    lieu: string
  }>
  presence_par_evenement: Array<{
    nom: string
    presents: number
    absents: number
  }>
}

/** Calcule les statistiques globales de l'organisateur connecté. */
export const obtenirStatistiquesOrganisateur = async (
  idUtilisateur: string
): Promise<StatistiquesOrganisateur> => {
  const ids = new Set(
    memoire.utilisateursEvenements
      .filter(
        (u) =>
          u.id_utilisateur === idUtilisateur &&
          u.role_evenement !== 'Agent de contrôle'
      )
      .map((u) => u.id_evenement)
  )
  const evenements = memoire.evenements.filter((e) => ids.has(e.id_evenement))
  const invites = memoire.invites.filter((i) => ids.has(i.id_evenement))
  const presents = invites.filter((i) => i.statut_presence === 'present')
  const absents = invites.filter((i) => i.statut_presence !== 'present')

  const aujourdhui = new Date()
  aujourdhui.setHours(0, 0, 0, 0)
  const evenements_a_venir = evenements
    .filter((e) => new Date(e.date_evenement) >= aujourdhui)
    .sort(
      (a, b) =>
        new Date(a.date_evenement).getTime() -
        new Date(b.date_evenement).getTime()
    )
    .slice(0, 5)
    .map((e) => ({
      id_evenement: e.id_evenement,
      nom_evenement: e.nom_evenement,
      date_evenement: e.date_evenement,
      heure_evenement: e.heure_evenement,
      lieu: e.lieu,
    }))

  const presence_par_evenement = evenements.slice(0, 6).map((e) => {
    const liste = invites.filter((i) => i.id_evenement === e.id_evenement)
    return {
      nom: e.nom_evenement.slice(0, 24),
      presents: liste.filter((i) => i.statut_presence === 'present').length,
      absents: liste.filter((i) => i.statut_presence !== 'present').length,
    }
  })

  return simulerDelai({
    nombre_evenements: evenements.length,
    total_invites: invites.length,
    presents: presents.length,
    absents: absents.length,
    evenements_a_venir,
    presence_par_evenement,
  })
}

/** Calcule les statistiques d'un événement. */
export const obtenirStatistiquesEvenement = async (
  idEvenement: string
): Promise<StatistiquesEvenement> => {
  const invites = memoire.invites.filter((i) => i.id_evenement === idEvenement)
  const tables = memoire.tables.filter((t) => t.id_evenement === idEvenement)
  const idsAffectes = new Set(
    memoire.affectations
      .filter((a) => invites.some((i) => i.id_invite === a.id_invite))
      .map((a) => a.id_invite)
  )

  const occupation_tables = tables
    .sort((a, b) => a.numero_table - b.numero_table)
    .map((table) => {
      const affectations = memoire.affectations.filter(
        (a) => a.id_table === table.id_table
      )
      const occupees = affectations.length
      return {
        numero_table: table.numero_table,
        nom_table: table.nom_table,
        libelle: table.nom_table.trim()
          ? `T${table.numero_table} · ${table.nom_table}`
          : `Table ${table.numero_table}`,
        capacite: table.capacite,
        occupees,
      }
    })

  const places_totales = tables.reduce((s, t) => s + t.capacite, 0)
  const places_occupees = occupation_tables.reduce((s, t) => s + t.occupees, 0)

  return simulerDelai({
    total_invites: invites.length,
    presents: invites.filter((i) => i.statut_presence === 'present').length,
    absents: invites.filter((i) => i.statut_presence !== 'present').length,
    affectes: idsAffectes.size,
    non_affectes: invites.length - idsAffectes.size,
    total_tables: tables.length,
    places_totales,
    places_occupees,
    occupation_tables,
  })
}
