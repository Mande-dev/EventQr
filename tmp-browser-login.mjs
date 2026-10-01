/** @typedef {import('patchright').Page} Page */

/**
 * @param {Page} page
 * @param {import('C:/Users/mande/.claude/skills/browser-automation/browser.mjs').UiHelper} ui
 */
export default async function run(page, ui) {
  const base = 'http://127.0.0.1:5173/connexion'

  await page.goto(base)
  await page.getByLabel('E-mail').waitFor({ state: 'visible', timeout: 20000 })

  await page.getByLabel('E-mail').fill('organisateur@eventqr.com')
  await page.getByLabel('Mot de passe').fill('Organisateur123!')
  await page.getByRole('button', { name: /Se connecter/i }).click()

  const okButton = page.getByRole('button', { name: /^OK$/i })
  await okButton.waitFor({ state: 'visible', timeout: 15000 })
  await okButton.click()

  await page.waitForURL(/\/organisateur/, { timeout: 20000 })
  const urlAfterLogin = page.url()

  await page.screenshot({
    path: 'C:\\PROJET\\EventQR\\tmp-login-orga.png',
    fullPage: true,
  })

  await page.goto(base)
  await page.getByLabel('E-mail').waitFor({ state: 'visible', timeout: 20000 })
  await page.getByLabel('E-mail').fill('organisateur@eventqr.com')
  await page.getByLabel('Mot de passe').fill('WrongPassword999!')
  await page.getByRole('button', { name: /Se connecter/i }).click()

  await page.getByText('Identifiants incorrects').waitFor({
    state: 'visible',
    timeout: 15000,
  })

  const wrongPasswordVisible = await page
    .getByText('Identifiants incorrects')
    .isVisible()

  return {
    urlAfterLogin,
    loginPathOk: /\/organisateur/.test(urlAfterLogin),
    wrongPasswordMessageVisible: wrongPasswordVisible,
    urlAfterWrongPassword: page.url(),
  }
}
