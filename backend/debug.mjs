const BASE = "http://localhost:3001";
const login = await fetch(BASE + "/api/auth/login", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@projeto.com", password: "admin" }),
}).then(r => r.json());

const teams = await fetch(BASE + "/api/teams", {
  headers: { "Authorization": "Bearer " + login.token },
}).then(r => r.json());

const mentora = (await fetch(BASE + "/api/users").then(r => r.json())).find(u => u.role === "MENTORA");

// Cria
const created = await fetch(BASE + "/api/teams", {
  method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + login.token },
  body: JSON.stringify({ name: "DebugTime", mentorId: mentora.id, status: "IDEACAO", accessCode: "debug" }),
}).then(r => r.json());
console.log("Created:", created.id);

// PUT - testa erro
const putRes = await fetch(BASE + "/api/teams/" + created.id, {
  method: "PUT", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + login.token },
  body: JSON.stringify({ name: "Atualizado", status: "PROTOTIPAGEM" }),
});
console.log("PUT status:", putRes.status);
console.log("PUT body:", await putRes.text());

// Cleanup
await fetch(BASE + "/api/teams/" + created.id, {
  method: "DELETE", headers: { "Authorization": "Bearer " + login.token },
});
