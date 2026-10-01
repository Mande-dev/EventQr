// Formate une date ISO ou AAAA-MM-JJ au format jj/mm/aaaa.
export const formaterDate = (valeur: string | null | undefined): string => {
  if (!valeur) return '—'
  const date = new Date(valeur)
  if (Number.isNaN(date.getTime())) {
    const parties = valeur.split('-')
    if (parties.length === 3) {
      return `${parties[2]}/${parties[1]}/${parties[0]}`
    }
    return valeur
  }
  const jour = String(date.getDate()).padStart(2, '0')
  const mois = String(date.getMonth() + 1).padStart(2, '0')
  const annee = date.getFullYear()
  return `${jour}/${mois}/${annee}`
}

// Libellé français d'un type d'événement (mariage | anniversaire).
export const libelleTypeEvenement = (type: string): string => {
  const libelles: Record<string, string> = {
    mariage: 'Mariage',
    anniversaire: 'Anniversaire',
  }
  return libelles[type] ?? type
}

// Évalue la force d'un mot de passe (0 à 4).
export const evaluerForceMotDePasse = (motDePasse: string): number => {
  let score = 0
  if (motDePasse.length >= 8) score += 1
  if (/[A-Z]/.test(motDePasse)) score += 1
  if (/[0-9]/.test(motDePasse)) score += 1
  if (/[^A-Za-z0-9]/.test(motDePasse)) score += 1
  return score
}

/** Libellé d’affichage d’une table (numéro + nom optionnel). */
export const libelleTable = (
  numero: number | null | undefined,
  nom?: string | null
): string => {
  if (numero == null && !nom) return '—'
  if (numero == null) return nom!.trim() || '—'
  const nomNettoye = nom?.trim()
  if (nomNettoye) return `Table ${numero} — ${nomNettoye}`
  return `Table ${numero}`
}
