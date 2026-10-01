import { chromium } from 'playwright'

/** Teste la connexion organisateur dans le navigateur. */
async function main() {
  const navigateur = await chromium.launch({
    headless: true,
    executablePath:
      process.env.LOCALAPPDATA +
      '\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe',
  })
  const page = await navigateur.newPage()

  try {
    await page.goto('http://localhost:5173/connexion', {
      waitUntil: 'networkidle',
      timeout: 60000,
    })

    await page.locator('input[type="email"]').fill('organisateur@eventqr.com')
    await page.locator('input[type="password"]').fill('Organisateur123!')
    await page.getByRole('button', { name: 'Se connecter' }).click()

    await page.waitForSelector('.swal2-popup', { timeout: 20000 })
    const titre = (await page.locator('.swal2-title').textContent())?.trim()
    console.log('Alerte:', titre)

    if (titre?.includes('impossible') || titre?.includes('Identifiants')) {
      throw new Error(`Connexion échouée: ${titre}`)
    }

    await page.locator('.swal2-confirm').click()
    await page.waitForURL(/\/organisateur/, { timeout: 20000 })
    console.log('URL après connexion:', page.url())
    console.log('OK — organisateur connecté et redirigé.')

    // Second essai : alias marie.kasongo
    await page.goto('http://localhost:5173/connexion')
    // Déconnexion éventuelle si encore connecté
    await page.evaluate(() => sessionStorage.clear())
    await page.goto('http://localhost:5173/connexion', {
      waitUntil: 'networkidle',
    })
    await page.locator('input[type="email"]').fill('marie.kasongo@email.cd')
    await page.locator('input[type="password"]').fill('Marie2024!')
    await page.getByRole('button', { name: 'Se connecter' }).click()
    await page.waitForSelector('.swal2-popup', { timeout: 20000 })
    const titre2 = (await page.locator('.swal2-title').textContent())?.trim()
    console.log('Alerte alias:', titre2)
    if (titre2?.includes('impossible')) {
      throw new Error(`Alias échoué: ${titre2}`)
    }
    await page.locator('.swal2-confirm').click()
    await page.waitForURL(/\/organisateur/, { timeout: 20000 })
    console.log('OK — alias marie.kasongo connecté ->', page.url())
  } finally {
    await navigateur.close()
  }
}

main().catch((erreur) => {
  console.error(erreur)
  process.exit(1)
})
