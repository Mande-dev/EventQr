const DELAI_DEFAUT_MS = 450

// Simule une latente réseau avant de résoudre une promesse.
export const simulerDelai = <T>(
  donnee: T,
  delaiMs: number = DELAI_DEFAUT_MS
): Promise<T> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(donnee), delaiMs)
  })
