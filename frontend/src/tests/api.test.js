// TF-29 — Injection automatique du token JWT dans les requêtes API
import { api } from "../lib/api";

beforeEach(() => {
  global.fetch = jest.fn();
  localStorage.clear();
});

afterEach(() => {
  jest.resetAllMocks();
});

function mockFetchOk(body = {}) {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    headers: { get: () => "application/json" },
    json: async () => body,
  });
}

test("TF-29 — injecte le header Authorization si un token est présent en localStorage", async () => {
  localStorage.setItem("token", "test-jwt-token");
  mockFetchOk({ data: "ok" });

  await api("/some/path");

  const [, options] = global.fetch.mock.calls[0];
  expect(options.headers["Authorization"]).toBe("Bearer test-jwt-token");
});

test("TF-29 — n'envoie pas de header Authorization si aucun token en localStorage", async () => {
  mockFetchOk({ data: "ok" });

  await api("/some/path");

  const [, options] = global.fetch.mock.calls[0];
  expect(options.headers["Authorization"]).toBeUndefined();
});

test("TF-29 — lève une erreur si la réponse est 4xx", async () => {
  global.fetch.mockResolvedValueOnce({
    ok: false,
    status: 404,
    statusText: "Not Found",
    headers: { get: () => "application/json" },
    json: async () => ({ message: "Ressource introuvable." }),
  });

  await expect(api("/not-found")).rejects.toThrow("Ressource introuvable.");
});
