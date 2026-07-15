// TF-36 — Dashboard admin
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ManageUsers from "../pages/ManageUsers";

const mockApi = jest.fn();
const mockNavigate = jest.fn();

jest.mock("../lib/api", () => ({
  api: (...args) => mockApi(...args),
}));

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { role: "admin" }, logout: jest.fn() }),
}));

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const fakeUsers = [
  {
    _id: "u1",
    displayName: "Alice Admin",
    email: "alice@test.com",
    role: "admin",
    emailVerified: true,
    reputation: { score: 4.5, votes: 3 },
    createdAt: "2025-01-01",
  },
  {
    _id: "u2",
    firstName: "Bob",
    lastName: "User",
    email: "bob@test.com",
    role: "user",
    emailVerified: false,
    reputation: { score: 3.2, votes: 2 },
    createdAt: "2025-03-15",
  },
];

const fakeProjects = [
  {
    _id: "p1",
    title: "Projet Alpha",
    status: "open",
    ownerId: { _id: "u1", displayName: "Alice Admin" },
    projectMeta: { city: "Genève" },
    createdAt: "2025-02-01",
  },
  {
    _id: "p2",
    title: "Projet Beta",
    status: "closed",
    ownerId: { _id: "u2", displayName: "Bob User" },
    projectMeta: { city: "Lausanne" },
    createdAt: "2025-04-10",
  },
];

beforeEach(() => {
  mockApi.mockReset();
  mockNavigate.mockReset();
  mockApi.mockImplementation((path) => {
    if (path === "/admin/users") return Promise.resolve(fakeUsers);
    if (path === "/admin/projects") return Promise.resolve(fakeProjects);
    return Promise.resolve({});
  });
});

// TF-36 — chargement du tableau de bord
test("TF-36 — affiche les statistiques globales (KPI)", async () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ManageUsers />
    </MemoryRouter>
  );

  await waitFor(() => expect(screen.queryByText(/chargement/i)).not.toBeInTheDocument());

  // Les stat cards affichent les totaux
  const allTwos = screen.getAllByText("2");
  expect(allTwos.length).toBeGreaterThan(0); // total users = 2
});

test("TF-36 — affiche la liste des utilisateurs avec leur nom et email", async () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ManageUsers />
    </MemoryRouter>
  );

  await waitFor(() => expect(screen.getByText("Alice Admin")).toBeInTheDocument());
  expect(screen.getByText("Bob User")).toBeInTheDocument();
  expect(screen.getByText("alice@test.com")).toBeInTheDocument();
});

test("TF-36 — passe à la liste des projets en cliquant sur l'onglet Projets", async () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ManageUsers />
    </MemoryRouter>
  );

  await waitFor(() => expect(screen.getByText("Alice Admin")).toBeInTheDocument());

  const projectsBtn = screen.getAllByRole("button").find(btn => btn.textContent.includes("Projets") && !btn.textContent.includes("Utilisateurs"));
  await userEvent.click(projectsBtn);

  await waitFor(() => expect(screen.getByText("Projet Alpha")).toBeInTheDocument());
  expect(screen.getByText("Projet Beta")).toBeInTheDocument();
});

test("TF-36 — la recherche filtre les utilisateurs par nom", async () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ManageUsers />
    </MemoryRouter>
  );

  await waitFor(() => expect(screen.getByText("Alice Admin")).toBeInTheDocument());

  const searchInput = screen.getByRole("textbox");
  await userEvent.type(searchInput, "alice");

  expect(screen.getByText("Alice Admin")).toBeInTheDocument();
  expect(screen.queryByText("Bob User")).not.toBeInTheDocument();
});

test("TF-36 — clique sur un utilisateur navigue vers son profil", async () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ManageUsers />
    </MemoryRouter>
  );

  await waitFor(() => expect(screen.getByText("Alice Admin")).toBeInTheDocument());

  await userEvent.click(screen.getByText("Alice Admin").closest("button"));
  expect(mockNavigate).toHaveBeenCalledWith("/users/u1");
});
