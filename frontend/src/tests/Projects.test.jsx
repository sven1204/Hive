// EF-06/EF-17/EF-18 — Liste des projets, recherche et filtres
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Projects from "../pages/Projects";

const mockApi = jest.fn();
const mockUseAuth = jest.fn();

jest.mock("../lib/api", () => ({
  api: (...args) => mockApi(...args),
}));

jest.mock("../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

const fakeProjects = [
  {
    _id: "1",
    title: "Projet Alpha",
    description: "Application React pour les créateurs",
    status: "open",
    tags: ["React", "Node"],
    participants: [],
    maxParticipants: 5,
    minAge: 18,
    projectMeta: { city: "Genève", region: "Romandie" },
  },
  {
    _id: "2",
    title: "Projet Beta",
    description: "API Python pour la data science",
    status: "open",
    tags: ["Python"],
    participants: [],
    maxParticipants: 3,
    minAge: 16,
    projectMeta: { city: "Lausanne", region: "Vaud" },
  },
];

beforeEach(() => {
  mockUseAuth.mockReturnValue({ user: null });
  mockApi.mockImplementation((path) => {
    if (path === "/projects") return Promise.resolve(fakeProjects);
    if (path === "/projects/tags") return Promise.resolve(["React", "Node", "Python"]);
    if (path === "/projects/regions") return Promise.resolve(["Romandie", "Vaud"]);
    return Promise.resolve([]);
  });
});

test("EF-06 — affiche la liste complète des projets après chargement", async () => {
  render(
    <MemoryRouter>
      <Projects />
    </MemoryRouter>
  );

  await waitFor(() =>
    expect(screen.getByText("Projet Alpha")).toBeInTheDocument()
  );
  expect(screen.getByText("Projet Beta")).toBeInTheDocument();
});

test("EF-06 — affiche le nombre de projets trouvés", async () => {
  render(
    <MemoryRouter>
      <Projects />
    </MemoryRouter>
  );

  await waitFor(() => expect(screen.getByText(/2 projets/i)).toBeInTheDocument());
});

test("EF-17 — filtre les projets par recherche mot-clé sur le titre", async () => {
  render(
    <MemoryRouter>
      <Projects />
    </MemoryRouter>
  );

  await waitFor(() => screen.getByText("Projet Alpha"));

  await userEvent.type(screen.getByPlaceholderText(/rechercher/i), "Alpha");

  expect(screen.getByText("Projet Alpha")).toBeInTheDocument();
  expect(screen.queryByText("Projet Beta")).not.toBeInTheDocument();
  expect(screen.getByText(/1 projet/i)).toBeInTheDocument();
});

test("EF-17 — filtre les projets par recherche sur la description", async () => {
  render(
    <MemoryRouter>
      <Projects />
    </MemoryRouter>
  );

  await waitFor(() => screen.getByText("Projet Beta"));

  await userEvent.type(screen.getByPlaceholderText(/rechercher/i), "data science");

  expect(screen.getByText("Projet Beta")).toBeInTheDocument();
  expect(screen.queryByText("Projet Alpha")).not.toBeInTheDocument();
});

test("EF-18 — filtre les projets par tag de compétence", async () => {
  render(
    <MemoryRouter>
      <Projects />
    </MemoryRouter>
  );

  await waitFor(() => screen.getByText("Projet Alpha"));

  // Cliquer sur le filtre "Python" (bouton dans la section filtres)
  await userEvent.click(screen.getByRole("button", { name: "Python" }));

  expect(screen.queryByText("Projet Alpha")).not.toBeInTheDocument();
  expect(screen.getByText("Projet Beta")).toBeInTheDocument();
});

test("EF-18 — efface tous les filtres avec le bouton de réinitialisation", async () => {
  render(
    <MemoryRouter>
      <Projects />
    </MemoryRouter>
  );

  await waitFor(() => screen.getByText("Projet Alpha"));

  await userEvent.type(screen.getByPlaceholderText(/rechercher/i), "Alpha");
  expect(screen.queryByText("Projet Beta")).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: /réinitialiser les filtres/i }));

  expect(screen.getByText("Projet Alpha")).toBeInTheDocument();
  expect(screen.getByText("Projet Beta")).toBeInTheDocument();
});

test("EF-06 — affiche le bouton 'Créer un projet' uniquement si connecté", async () => {
  mockUseAuth.mockReturnValue({ user: { email: "user@test.com" } });

  render(
    <MemoryRouter>
      <Projects />
    </MemoryRouter>
  );

  await waitFor(() => screen.getByText("Projet Alpha"));

  expect(
    screen.getByRole("button", { name: /créer un projet/i })
  ).toBeInTheDocument();
});

test("EF-06 — n'affiche pas le bouton 'Créer un projet' si non connecté", async () => {
  render(
    <MemoryRouter>
      <Projects />
    </MemoryRouter>
  );

  await waitFor(() => screen.getByText("Projet Alpha"));

  expect(
    screen.queryByRole("button", { name: /créer un projet/i })
  ).not.toBeInTheDocument();
});
