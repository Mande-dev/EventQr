import { MOCK_PARAMETRES } from '@/mocks'
import type { ParametresPlateforme } from '@/types'
import { simulerDelai } from './delai'

let parametresEnMemoire: ParametresPlateforme = structuredClone(MOCK_PARAMETRES)

// Charge les paramètres de la plateforme.
export const obtenirParametres = async (): Promise<ParametresPlateforme> =>
  simulerDelai(structuredClone(parametresEnMemoire))

// Enregistre les paramètres (simulation locale).
export const enregistrerParametres = async (
  parametres: ParametresPlateforme
): Promise<ParametresPlateforme> => {
  parametresEnMemoire = structuredClone(parametres)
  return simulerDelai(structuredClone(parametresEnMemoire))
}
