export default async function (page, ui) {
  await page.goto('http://localhost:5173/connexion', { waitUntil: 'networkidle' })

  // Connexion organisateur avec les identifiants du formulaire.
  await page.getByLabel('E-mail').fill('organisateur@eventqr.com')
  await page.getByLabel('Mot de passe').fill('Organisateur123!')
  await page.getByRole('button', { name: 'Se connecter' }).click()

  // Attendre la confirmation SweetAlert puis OK.
  await page.waitForSelector('.swal2-confirm, .eventqr-swal-confirmer', {
    timeout: 15000,
  })
  const texteAlerte = await page.locator('.swal2-title, .eventqr-swal-title').first().textContent()
  await page.locator('.swal2-confirm, .eventqr-swal-confirmer').first().click()

  await page.waitForURL(/\/organisateur/, { timeout: 15000 })

  return {
    alerte: texteAlerte?.trim() ?? null,
    url: page.url(),
    titre: await page.title(),
  }
}
