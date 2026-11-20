/** Ambiente local do harness, dados fictícios, regras sempre pausadas: nenhum POST de saída. */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { test, expect, type Page } from "./helpers/test";

const APP_URL = `http://localhost:${process.env.E2E_PORT ?? "3001"}`;
type Creds = { password: string; users: Record<string, { email: string }> };
let creds: Creds;
test.beforeAll(() => {
  if (!existsSync(".e2e-creds.json")) {
    execFileSync("npx", ["tsx", "scripts/seed-e2e-credentials.ts"], { stdio: "inherit" });
  }
  creds = JSON.parse(readFileSync(".e2e-creds.json", "utf8")) as Creds;
});
async function login(page: Page, role: "manager" | "agent") {
  const user = creds.users[role];
  if (!user) throw new Error(`Falta o usuário fictício ${role} no seed E2E.`);
  await page.goto(`${APP_URL}/login`);
  await page.locator("#email").fill(user.email);
  await page.locator("#password").fill(creds.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL(/\/app\//);
}

for (const trigger of ["contact.tag_added", "lead.tag_added"]) {
  test(`${trigger}: gestor edita, salva e reabre o opt-in`, async ({ page }) => {
    await login(page, "manager");
    const name = `E2E contato mínimo fictício ${trigger} ${Date.now()}`;
    const actions = [
      {
        type: "call_webhook",
        config: {
          url: "https://receiver.example.invalid/hook",
          projection: { mode: "contact_minimal", tag: "contrato" },
        },
      },
    ];
    const created = await page.request.post(`${APP_URL}/api/v1/automation-rules`, {
      data: { name, trigger_event: trigger, actions },
    });
    expect(created.status()).toBe(201);
    const { data: rule } = await created.json();
    expect(rule.is_active).toBe(false);
    try {
      await page.goto(`${APP_URL}/app/webhooks?aba=automacoes`);
      const card = page
        .getByText(name, { exact: true })
        .locator(
          "xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' border-border ')][1]",
        );
      await card.getByRole("button", { name: "Editar automação" }).click();
      const dialog = page.getByRole("dialog");
      await expect(
        dialog.getByRole("switch", { name: "Enviar somente o contato mínimo" }),
      ).toBeChecked();
      await expect(dialog.getByLabel("Etiqueta que dispara o envio")).toHaveValue("contrato");
      await dialog.getByRole("switch", { name: "Incluir o responsável no corpo" }).click();
      await expect(dialog.getByRole("alert")).toContainText("desligue o envio do responsável");
      await expect(
        dialog.getByRole("switch", { name: "Incluir o responsável no corpo" }),
      ).toBeChecked();
      await dialog.getByRole("switch", { name: "Incluir o responsável no corpo" }).click();
      await expect(dialog.getByRole("alert")).not.toBeVisible();
      await dialog.getByLabel("Etiqueta que dispara o envio").fill(" Outra ");
      const saved = page.waitForResponse(
        (r) => r.url().endsWith(`/automation-rules/${rule.id}`) && r.request().method() === "PATCH",
      );
      await dialog.getByRole("button", { name: "Salvar alterações" }).click();
      expect((await saved).status()).toBe(200);
      await expect(dialog).not.toBeVisible();
      await page.reload();
      await card.getByRole("button", { name: "Editar automação" }).click();
      await expect(page.getByLabel("Etiqueta que dispara o envio")).toHaveValue("outra");
      await expect(
        page.getByRole("switch", { name: "Enviar somente o contato mínimo" }),
      ).toBeChecked();
      const listed = await page.request.get(`${APP_URL}/api/v1/automation-rules`);
      const { data: rows } = await listed.json();
      expect(
        rows.find((r: { id: string }) => r.id === rule.id).actions[0].config.projection,
      ).toEqual({ mode: "contact_minimal", tag: "outra" });
      // Remover é uma escolha explícita do gestor, preservando os demais campos.
      await dialog.getByRole("switch", { name: "Enviar somente o contato mínimo" }).click();
      await expect(dialog.getByLabel("Etiqueta que dispara o envio")).toHaveCount(0);
      const removed = page.waitForResponse(
        (r) => r.url().endsWith(`/automation-rules/${rule.id}`) && r.request().method() === "PATCH",
      );
      await dialog.getByRole("button", { name: "Salvar alterações" }).click();
      expect((await removed).status()).toBe(200);
      await page.reload();
      await card.getByRole("button", { name: "Editar automação" }).click();
      await expect(
        dialog.getByRole("switch", { name: "Enviar somente o contato mínimo" }),
      ).not.toBeChecked();
      const afterRemoval = await (
        await page.request.get(`${APP_URL}/api/v1/automation-rules`)
      ).json();
      expect(
        afterRemoval.data.find((r: { id: string }) => r.id === rule.id).actions[0].config,
      ).toEqual({ url: "https://receiver.example.invalid/hook" });
    } finally {
      expect(
        (await page.request.delete(`${APP_URL}/api/v1/automation-rules/${rule.id}`)).status(),
      ).toBe(204);
    }
  });
}

test("agente não ganha acesso ao cadastro da projeção", async ({ page }) => {
  await login(page, "agent");
  const response = await page.request.post(`${APP_URL}/api/v1/automation-rules`, {
    data: {
      name: "Fictícia",
      trigger_event: "contact.tag_added",
      actions: [
        {
          type: "call_webhook",
          config: {
            url: "https://receiver.example.invalid/hook",
            projection: { mode: "contact_minimal", tag: "contrato" },
          },
        },
      ],
    },
  });
  expect(response.status()).toBe(403);
  await page.goto(`${APP_URL}/app/webhooks`);
  await page.waitForURL(/\/app\/inbox/);
});
