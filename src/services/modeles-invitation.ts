import { genererId, memoire } from './memoire'
import { simulerDelai } from './delai'
import type { ModeleInvitation } from '@/types'

export type DonneesModeleInvitation = {
  fichier_pdf: string
  zone_nom_x: number
  zone_nom_y: number
  zone_nom_largeur: number
  zone_nom_hauteur: number
  zone_qr_x: number
  zone_qr_y: number
  zone_qr_largeur: number
  zone_qr_hauteur: number
}

const CLE_INDEXED_DB = 'eventqr_modeles_pdf'

/** Ouvre (ou crée) la base IndexedDB pour les PDF modèles. */
async function ouvrirBase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const requete = indexedDB.open(CLE_INDEXED_DB, 1)
    requete.onupgradeneeded = () => {
      const db = requete.result
      if (!db.objectStoreNames.contains('pdfs')) {
        db.createObjectStore('pdfs')
      }
    }
    requete.onsuccess = () => resolve(requete.result)
    requete.onerror = () => reject(requete.error)
  })
}

/** Enregistre un PDF modèle en IndexedDB. */
export async function stockerPdfModele(
  idEvenement: string,
  dataUrl: string
): Promise<void> {
  const db = await ouvrirBase()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('pdfs', 'readwrite')
    tx.objectStore('pdfs').put(dataUrl, idEvenement)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

/** Lit un PDF modèle depuis IndexedDB. */
export async function lirePdfModele(
  idEvenement: string
): Promise<string | null> {
  try {
    const db = await ouvrirBase()
    const resultat = await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction('pdfs', 'readonly')
      const req = tx.objectStore('pdfs').get(idEvenement)
      req.onsuccess = () => resolve((req.result as string) ?? null)
      req.onerror = () => reject(req.error)
    })
    db.close()
    return resultat
  } catch {
    return null
  }
}

/** Récupère le modèle d'invitation d'un événement. */
export const obtenirModeleInvitation = async (
  idEvenement: string
): Promise<ModeleInvitation | null> => {
  const modele = memoire.modeles.find((m) => m.id_evenement === idEvenement)
  if (!modele) return simulerDelai(null)

  const pdfStocke = await lirePdfModele(idEvenement)
  return simulerDelai(
    structuredClone({
      ...modele,
      fichier_pdf: pdfStocke ?? modele.fichier_pdf,
    })
  )
}

/** Enregistre ou met à jour le modèle d'invitation. */
export const enregistrerModeleInvitation = async (
  idEvenement: string,
  donnees: DonneesModeleInvitation
): Promise<ModeleInvitation> => {
  await stockerPdfModele(idEvenement, donnees.fichier_pdf)
  const index = memoire.modeles.findIndex((m) => m.id_evenement === idEvenement)
  if (index >= 0) {
    memoire.modeles[index] = {
      ...memoire.modeles[index],
      ...donnees,
      fichier_pdf: `indexeddb://${idEvenement}`,
    }
    return simulerDelai(structuredClone(memoire.modeles[index]))
  }
  const nouveau: ModeleInvitation = {
    id_modele: genererId('mdl'),
    id_evenement: idEvenement,
    ...donnees,
    fichier_pdf: `indexeddb://${idEvenement}`,
    date_creation: new Date().toISOString(),
  }
  memoire.modeles = [nouveau, ...memoire.modeles]
  return simulerDelai(structuredClone(nouveau))
}
