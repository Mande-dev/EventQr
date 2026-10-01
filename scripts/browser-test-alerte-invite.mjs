/** Script navigateur : alerte OK après ajout invité depuis FeuilleModale. */
export default async function (page, ui) {
  await page.goto('http://127.0.0.1:5174/connexion', {
    waitUntil: 'networkidle',
  })

  await page.getByLabel(/email/i).fill('organisateur@eventqr.com')
  await page.getByLabel(/mot de passe/i).fill('Organisateur123!')
  await page.getByRole('button', { name: /connexion|se connecter/i }).click()
  await page.waitForURL(/organisateur/, { timeout: 15000 })

  await page.goto('http://127.0.0.1:5174/organisateur/invites', {
    waitUntil: 'networkidle',
  })

  // Attendre l’événement actif / liste
  await page.waitForTimeout(800)

  const ajouter = page.getByRole('button', { name: /^Ajouter$/ }).first()
  if (await ajouter.isVisible().catch(() => false)) {
    await ajouter.click()
  } else {
    await page.getByRole('button', { name: /Ajouter un invité/i }).first().click()
  }

  await page.waitForTimeout(400)
  const champNom = page.getByLabel(/nom complet/i)
  await champNom.fill(`Test Alerte ${Date.now()}`)
  await page.getByRole('button', { name: /^Ajouter$/ }).last().click()

  // Attendre SweetAlert
  const popup = page.locator('.swal2-popup')
  await popup.waitFor({ state: 'visible', timeout: 10000 })
  const titre = await page.locator('.swal2-title').innerText()

  const ok = page.locator('.swal2-confirm')
  await ok.click()
  await popup.waitFor({ state: 'hidden', timeout: 5000 })

  const encoreVisible = await popup.isVisible().catch(() => false)

  return {
    titreAlerte: titre,
    okFermeAlerte: !encoreVisible,
  }
}
