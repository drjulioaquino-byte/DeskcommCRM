// @vitest-environment node
import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { executeCallWebhook, idDaEntrega } from "@/lib/automation/actions/call-webhook";
import { createAutomationRuleSchema, updateAutomationRuleSchema } from "@/lib/schemas/webhooks";
import type { ActionCtx } from "@/lib/automation/types";
import type { NextRequest } from "next/server";

const deps = vi.hoisted(() => ({
  role: vi.fn(),
  support: vi.fn(),
  client: vi.fn(),
  audit: vi.fn(),
  resolveDestination: vi.fn(async () => undefined),
}));
vi.mock("@/lib/auth/require-role", () => ({ requireRole: deps.role }));
vi.mock("@/lib/impersonate/support", () => ({ requireSupportWrite: deps.support }));
vi.mock("@/lib/supabase/server", () => ({ createClient: deps.client }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: deps.client }));
vi.mock("@/lib/audit", () => ({ audit: deps.audit }));
vi.mock("@/lib/automation/outbound-ip", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  assertDestinoResolvidoSeguro: deps.resolveDestination,
}));
import { PATCH } from "@/app/api/v1/automation-rules/[id]/route";
import { GET, POST } from "@/app/api/v1/automation-rules/route";
import { patchContactHandler } from "@/app/api/v1/contacts/_handler";
import { updateLeadHandler } from "@/app/api/v1/leads/_handler";
import { contactPatchSchema } from "@/lib/schemas/contacts";
import { updateLeadSchema } from "@/lib/schemas/leads";
import { getAction } from "@/lib/automation/actions";
import "@/lib/automation/actions/add-tag";
import type { HandlerCtx } from "@/lib/api/handlers/types";

const ORG = "10000000-0000-4000-8000-000000000001";
const CONTACT = "20000000-0000-4000-8000-000000000002";
const LEAD = "30000000-0000-4000-8000-000000000003";
const projection = { mode: "contact_minimal", tag: "contrato" };
const config = { url: "https://receiver.example.invalid/hook", projection };
const fetcher = vi.fn<typeof fetch>(async () => new Response(null, { status: 204 }));
function context(event = "contact.tag_added"): ActionCtx {
  return {
    admin: {} as ActionCtx["admin"],
    organizationId: ORG,
    ruleId: "rule-fiction",
    ruleName: "Regra fictícia",
    requestId: "request-fiction",
    event: {
      id: "event-fiction",
      organization_id: ORG,
      event_type: event,
      entity_kind: event === "contact.tag_added" ? "contact" : "crm_lead",
      entity_id: event === "contact.tag_added" ? CONTACT : LEAD,
      created_at: "2026-11-19T22:00:00.000Z",
      metadata: {},
      attempts: 0,
      consumed_by: [],
      payload: {
        added_tags: ["Outra", " Contrato "],
        contact_id: "INJECTED_ID",
        email: "private@example.invalid",
        service_origin: "PRIVATE_PAYLOAD",
        unexpected: "PRIVATE_PAYLOAD",
      },
    },
    context: {
      contact: {
        id: CONTACT,
        organization_id: ORG,
        name: "Contato fictício",
        phone_number: "+5511000000000",
        email: "PRIVATE_EMAIL",
        tags: ["PRIVATE_TAG"],
        custom_fields: { private: "PRIVATE_FIELD" },
      },
      lead: { id: LEAD, organization_id: ORG, contact_id: CONTACT, title: "PRIVATE_LEAD" },
      appointment: { owner_user_id: "PRIVATE_OWNER", location_details: "PRIVATE_LOCATION" },
    },
    ruleActions: [{ type: "call_webhook", config }],
    actionIndex: 0,
  };
}
const send = (ctx = context(), cfg: Record<string, unknown> = config) =>
  executeCallWebhook(ctx, cfg, { skipUrlCheck: true, retryDelaysMs: [] });
function webhookRequest(index = 0): RequestInit {
  const request = fetcher.mock.calls[index]?.[1];
  if (!request) throw new Error(`Não houve a requisição fictícia ${index}.`);
  return request;
}
const sent = () => JSON.parse(webhookRequest().body as string);
beforeEach(() => {
  deps.resolveDestination.mockReset().mockResolvedValue(undefined);
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-19T23:00:00.000Z"));
  fetcher.mockClear();
  vi.stubGlobal("fetch", fetcher);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("P-01/P-02: projeção local fechada", () => {
  for (const event of ["contact.tag_added", "lead.tag_added"])
    it(`${event}: somente o contato vinculado e a etiqueta adicionada`, async () => {
      const ctx = context(event),
        before = structuredClone({ event: ctx.event, context: ctx.context });
      expect((await send(ctx)).status).toBe("success");
      expect(sent()).toEqual({
        event,
        occurred_at: "2026-11-19T23:00:00.000Z",
        happened_at: "2026-11-19T22:00:00.000Z",
        delivery_id: idDaEntrega(ctx.event.id, ctx.ruleId, 0, ctx.ruleActions ?? []),
        data: {
          added_tags: ["contrato"],
          contact: { id: CONTACT, name: "Contato fictício", phone_number: "+5511000000000" },
        },
      });
      expect({ event: ctx.event, context: ctx.context }).toEqual(before);
      expect(JSON.stringify(sent())).not.toContain("PRIVATE_");
    });
  it("a ação seguinte sem opt-in conserva a projeção ampla e o contexto", async () => {
    const ctx = context();
    await send(ctx);
    const minimal = sent();
    fetcher.mockClear();
    await send(ctx, { url: config.url });
    expect(sent().data.email).toBe("private@example.invalid");
    expect(sent().data.lead.title).toBe("PRIVATE_LEAD");
    expect(sent().data.contact.email).toBe("PRIVATE_EMAIL");
    expect(minimal.data).not.toHaveProperty("lead");
  });
});
describe("P-04: etiqueta inteira normalizada sem mudar o vocabulário", () => {
  for (const tag of ["Contrato", "contrato", " contrato ", "CONTRATO"])
    it(`aceita ${JSON.stringify(tag)}`, async () => {
      const ctx = context();
      ctx.event.payload.added_tags = [tag, tag, "Outra"];
      await send(ctx);
      expect(sent().data.added_tags).toEqual(["contrato"]);
    });
  for (const tags of [
    ["contráto"],
    ["contrato!"],
    ["contratox"],
    ["contrato anual"],
    [],
    ["Outra"],
  ])
    it(`não envia ${JSON.stringify(tags)}`, async () => {
      const ctx = context();
      ctx.event.payload.added_tags = tags;
      const result = await send(ctx);
      expect(result.status).toBe("skipped");
      expect(result.detail?.reason).toBe("minimal_tag_not_added");
      expect(fetcher).not.toHaveBeenCalled();
    });
});
describe("P-03/P-05/P-08: falha fechada sem vazamento nem fallback", () => {
  for (const value of [
    null,
    {},
    { mode: "unknown", tag: "contrato" },
    { mode: "contact_minimal" },
    { ...projection, extra: true },
    { ...projection, tag: " " },
    { ...projection, tag: "x".repeat(41) },
  ])
    it(`recusa perfil ${JSON.stringify(value)}`, async () => {
      expect((await send(context(), { ...config, projection: value })).status).toBe("failed");
      expect(fetcher).not.toHaveBeenCalled();
    });
  it("include_owner não faz lookup e gatilho incompatível não envia", async () => {
    expect((await send(context(), { ...config, include_owner: true })).error).toBe(
      "minimal_owner_incompatible",
    );
    expect((await send(context("lead.created"))).error).toBe("minimal_trigger_incompatible");
    expect(fetcher).not.toHaveBeenCalled();
  });
  for (const field of ["id", "name", "phone_number"])
    it(`contato sem ${field} falha sem dado substituto`, async () => {
      const ctx = context();
      delete (ctx.context.contact as Record<string, unknown>)[field];
      const result = await send(ctx);
      expect(result.status).toBe("failed");
      expect(JSON.stringify(result)).not.toContain("PRIVATE_");
      expect(fetcher).not.toHaveBeenCalled();
    });
  it("contato de outra organização, evento cruzado, entidade ou vínculo divergente falham", async () => {
    const cases = [
      context(),
      context(),
      context(),
      context("lead.tag_added"),
      context("lead.tag_added"),
    ] as const;
    (cases[0].context.contact as Record<string, unknown>).organization_id = "other-org";
    cases[1].event.organization_id = "other-org";
    cases[2].event.entity_id = LEAD;
    (cases[3].context.lead as Record<string, unknown>).contact_id = "other-contact";
    (cases[4].context.lead as Record<string, unknown>).organization_id = "other-org";
    for (const ctx of cases) expect((await send(ctx)).status).toBe("failed");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("added_tags ausente ou malformado falha antes do envio", async () => {
    for (const value of [undefined, null, "contrato", ["contrato", 42]]) {
      const ctx = context();
      ctx.event.payload.added_tags = value;
      expect((await send(ctx)).status).toBe("failed");
    }
    expect(fetcher).not.toHaveBeenCalled();
  });
});
it("P-06: assina os bytes mínimos, conserva entrega/reenvio e continua a tentativa", async () => {
  const ctx = context(),
    cfg = { ...config, secret: "SYNTHETIC_SECRET_NO_AUTHORITY" };
  await executeCallWebhook(ctx, cfg, {
    skipUrlCheck: true,
    retryDelaysMs: [],
    primeiraTentativa: 4,
  });
  const init = webhookRequest(),
    body = init.body as string,
    headers = init.headers as Record<string, string>;
  expect(headers["X-Webhook-Attempt"]).toBe("4");
  expect(init.redirect).toBe("manual");
  const delivery = sent().delivery_id,
    stamp = headers["X-Webhook-Timestamp"];
  expect(headers["X-Webhook-Signature"]).toBe(
    `t=${stamp},v1=${createHmac("sha256", cfg.secret).update(`${stamp}.${delivery}.${body}`).digest("hex")}`,
  );
  expect(headers["X-Deskcomm-Signature"]).toBe(
    createHmac("sha256", cfg.secret).update(body).digest("hex"),
  );
  expect(sent().data).toEqual({
    added_tags: ["contrato"],
    contact: { id: CONTACT, name: "Contato fictício", phone_number: "+5511000000000" },
  });
});
describe("schema da regra", () => {
  it("persiste o opt-in e não o acrescenta às ações legadas", () => {
    const minimal = createAutomationRuleSchema.parse({
      name: "Fictícia",
      trigger_event: "lead.tag_added",
      actions: [{ type: "call_webhook", config }],
    });
    expect(minimal.actions[0]?.config).toMatchObject({ projection });
    const legacy = createAutomationRuleSchema.parse({
      name: "Fictícia",
      trigger_event: "lead.created",
      actions: [{ type: "call_webhook", config: { url: config.url } }],
    });
    expect(legacy.actions[0]?.config).not.toHaveProperty("projection");
  });
  it("recusa gatilho errado, responsável e perfil desconhecido no create/PATCH", () => {
    for (const [event, cfg] of [
      ["lead.created", config],
      ["contact.tag_added", { ...config, include_owner: true }],
      ["lead.tag_added", { ...config, projection: null }],
    ] as const) {
      const body = {
        name: "Fictícia",
        trigger_event: event,
        actions: [{ type: "call_webhook", config: cfg }],
      };
      expect(createAutomationRuleSchema.safeParse(body).success).toBe(false);
      expect(updateAutomationRuleSchema.safeParse(body).success).toBe(false);
    }
  });
});

describe("P-05/P-07: portas reais de criação e PATCH parcial", () => {
  let existing: Record<string, unknown>, stored: Record<string, unknown> | undefined;
  const filters: Array<[string, unknown]> = [];
  beforeEach(() => {
    existing = {
      id: "rule-fiction",
      organization_id: ORG,
      trigger_event: "contact.tag_added",
      trigger_config: {},
      actions: [{ type: "call_webhook", config }],
    };
    stored = undefined;
    filters.length = 0;
    deps.support.mockResolvedValue(null);
    deps.role.mockResolvedValue({
      ok: true,
      user: { id: CONTACT, idioma: "pt-BR" },
      org: { orgId: ORG, role: "manager" },
    });
    const query = {
      select: () => query,
      eq: (key: string, value: unknown) => {
        filters.push([key, value]);
        return query;
      },
      maybeSingle: async () => ({
        data: filters.every(([key, value]) => existing[key] === value) ? existing : null,
        error: null,
      }),
      order: async () => ({
        data: filters.every(([key, value]) => existing[key] === value) ? [existing] : [],
        error: null,
      }),
      update: (value: Record<string, unknown>) => {
        stored = value;
        return query;
      },
      insert: (value: Record<string, unknown>) => {
        stored = value;
        return query;
      },
      single: async () => ({ data: { ...existing, ...stored }, error: null }),
    };
    deps.client.mockReturnValue({ from: () => query });
  });
  const request = (body: unknown) =>
    new Request("http://localhost/api/v1/automation-rules/rule-fiction", {
      method: "PATCH",
      body: JSON.stringify(body),
    }) as NextRequest;
  const patch = (body: unknown) =>
    PATCH(request(body), { params: Promise.resolve({ id: "rule-fiction" }) });
  it("rejeita trocar apenas o gatilho de uma regra mínima", async () => {
    expect((await patch({ trigger_event: "lead.created" })).status).toBe(400);
    expect(stored).toBeUndefined();
    expect(filters).toContainEqual(["organization_id", ORG]);
  });
  it("rejeita apenas ações mínimas num gatilho legado e a ativação de regra inválida", async () => {
    existing.trigger_event = "lead.created";
    expect((await patch({ actions: existing.actions })).status).toBe(400);
    expect((await patch({ is_active: true })).status).toBe(400);
    expect(stored).toBeUndefined();
    expect((await patch({ is_active: false })).status).toBe(200);
    expect(stored).toMatchObject({ is_active: false });
  });
  it("round-trip PATCH mantém o perfil e usa a organização da sessão no POST", async () => {
    expect((await patch({ actions: existing.actions })).status).toBe(200);
    expect(stored?.actions).toEqual(existing.actions);
    const response = await POST(
      request({
        name: "Fictícia",
        trigger_event: "lead.tag_added",
        actions: existing.actions,
        organization_id: "INJECTED",
      }),
    );
    expect(response.status).toBe(201);
    expect(stored).toMatchObject({ organization_id: ORG, actions: existing.actions });
  });
  it("RBAC e modo suporte impedem gravação pelas duas portas", async () => {
    deps.role.mockResolvedValue({ ok: false, response: new Response(null, { status: 403 }) });
    expect((await patch({ actions: existing.actions })).status).toBe(403);
    expect((await POST(request({}))).status).toBe(403);
    deps.support.mockResolvedValue(new Response(null, { status: 403 }));
    expect((await patch({})).status).toBe(403);
    expect(stored).toBeUndefined();
  });
  it("outra organização não lê nem altera a regra; GET conserva o perfil da sessão", async () => {
    expect((await (await GET()).json()).data[0].actions[0].config.projection).toEqual(projection);
    filters.length = 0;
    deps.role.mockResolvedValue({
      ok: true,
      user: { id: CONTACT, idioma: "pt-BR" },
      org: { orgId: "other-org", role: "manager" },
    });
    expect((await (await GET()).json()).data).toEqual([]);
    expect((await patch({ name: "Tentativa cruzada fictícia" })).status).toBe(404);
    expect(stored).toBeUndefined();
  });
});

it("P-06: retry mantém corpo e id; mudar perfil ou etiqueta muda a identidade", async () => {
  fetcher
    .mockRejectedValueOnce(new Error("PRIVATE_PHONE_AND_URL"))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  const ctx = context();
  const pending = executeCallWebhook(ctx, config, { skipUrlCheck: true, retryDelaysMs: [1000] });
  await vi.advanceTimersByTimeAsync(1000);
  expect((await pending).status).toBe("success");
  expect(webhookRequest().body).toBe(webhookRequest(1).body);
  expect((webhookRequest(1).headers as Record<string, string>)["X-Webhook-Attempt"]).toBe("2");
  const firstHeaders = webhookRequest().headers as Record<string, string>;
  const secondHeaders = webhookRequest(1).headers as Record<string, string>;
  expect(Number(secondHeaders["X-Webhook-Timestamp"])).toBe(
    Number(firstHeaders["X-Webhook-Timestamp"]) + 1,
  );
  const original = idDaEntrega(ctx.event.id, ctx.ruleId, 0, ctx.ruleActions ?? []);
  for (const other of [
    { url: config.url },
    { ...config, projection: { ...projection, tag: "outra" } },
  ]) {
    expect(
      idDaEntrega(ctx.event.id, ctx.ruleId, 0, [{ type: "call_webhook", config: other }]),
    ).not.toBe(original);
  }
});
it("P-08: falha de transporte não registra conteúdo devolvido pelo erro", async () => {
  fetcher.mockRejectedValueOnce(new Error("PRIVATE_PHONE_AND_URL"));
  const result = await send();
  expect(result.error).toBe("minimal_delivery_failed");
  expect(JSON.stringify(result)).not.toContain("PRIVATE_");
});

it("P-06: perfil mínimo preserva as guardas textual e DNS antes do POST", async () => {
  expect(
    (await executeCallWebhook(context(), { ...config, url: "http://127.0.0.1/hook" })).error,
  ).toBe("unsafe_url:private_host");
  expect(deps.resolveDestination).not.toHaveBeenCalled();
  expect(fetcher).not.toHaveBeenCalled();
  deps.resolveDestination.mockRejectedValueOnce(new Error("unsafe_url:private_ip"));
  expect((await executeCallWebhook(context(), config)).error).toBe("unsafe_url:private_ip");
  expect(deps.resolveDestination).toHaveBeenCalledWith("receiver.example.invalid");
  expect(fetcher).not.toHaveBeenCalled();
});

describe("P-04: etiquetas emitidas pelos três caminhos reais de escrita", () => {
  for (const source of ["contact_patch", "lead_patch", "add_tag"] as const) {
    for (const tag of [
      "Contrato",
      "contrato",
      " contrato ",
      "contráto",
      "contrato!",
      "contratox",
      "contrato anual",
    ]) {
      it(`${source}: ${JSON.stringify(tag)}`, async () => {
        const ctx = context(source === "contact_patch" ? "contact.tag_added" : "lead.tag_added");
        const events: Record<string, unknown>[] = [];
        const rows: Record<string, Record<string, unknown>> = {
          contacts: {
            ...(ctx.context.contact as Record<string, unknown>),
            tags: [],
            is_personal: false,
          },
          crm_leads: {
            ...(ctx.context.lead as Record<string, unknown>),
            tags: [],
            title: "Negócio fictício",
          },
        };
        const database = {
          rpc: async (name: string, args: Record<string, unknown>) => {
            if (name === "emit_event") events.push(args);
            if (name === "fn_lead_adicionar_etiquetas")
              return { data: { tags: [tag], adicionadas: [tag] }, error: null };
            return { data: {}, error: null };
          },
          from: (table: string) => {
            let patch: Record<string, unknown> = {};
            const query = {
              select: () => query,
              eq: () => query,
              update: (value: Record<string, unknown>) => {
                patch = value;
                return query;
              },
              insert: () => query,
              maybeSingle: async () => ({ data: { ...rows[table], ...patch }, error: null }),
              then: (resolve: (result: unknown) => unknown) =>
                Promise.resolve({ data: null, error: null }).then(resolve),
            };
            return query;
          },
        };
        deps.client.mockReturnValue(database);
        const handlerCtx: HandlerCtx = {
          organization_id: ORG,
          requestId: "fictício",
          actor: { type: "user", id: CONTACT, role: "manager" },
        };
        if (source === "contact_patch")
          await patchContactHandler(
            database as never,
            handlerCtx,
            CONTACT,
            contactPatchSchema.parse({ tags: [tag] }),
          );
        else if (source === "lead_patch")
          await updateLeadHandler(
            database as never,
            handlerCtx,
            LEAD,
            updateLeadSchema.parse({ tags: [tag] }),
          );
        else {
          ctx.admin = database as never;
          expect((await getAction("add_tag")!.execute(ctx, { tags: [tag] })).status).toBe(
            "success",
          );
        }
        const emitted = events.find((event) => event.p_event_type === ctx.event.event_type);
        expect(emitted).toBeDefined();
        ctx.event.payload = emitted!.p_payload as Record<string, unknown>;
        const before = structuredClone(rows);
        const result = await send(ctx);
        expect(result.status).toBe(
          ["Contrato", "contrato", " contrato "].includes(tag) ? "success" : "skipped",
        );
        if (result.status === "success") expect(sent().data.added_tags).toEqual(["contrato"]);
        else expect(fetcher).not.toHaveBeenCalled();
        expect(rows).toEqual(before);
      });
    }
  }
});
