// EF-06 — Affichage d'une carte projet
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ProjectCard from "../components/ProjectCard";

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: null,
  }),
}));

const baseProject = {
  _id: "abc123",
  title: "Mon projet test",
  description: "Une description courte",
  tags: ["React", "Node", "Python", "Docker"],
  participants: [{ _id: "u1" }, { _id: "u2" }],
  maxParticipants: 5,
  minAge: 18,
  projectMeta: { city: "Genève" },
};

test("EF-06 — affiche le titre et la description du projet", () => {
  render(
    <MemoryRouter>
      <ProjectCard project={baseProject} />
    </MemoryRouter>
  );

  expect(screen.getByText("Mon projet test")).toBeInTheDocument();
  expect(screen.getByText("Une description courte")).toBeInTheDocument();
});

test("EF-06 — affiche au maximum 3 tags et un compteur pour les suivants", () => {
  render(
    <MemoryRouter>
      <ProjectCard project={baseProject} />
    </MemoryRouter>
  );

  expect(screen.getByText("React")).toBeInTheDocument();
  expect(screen.getByText("Node")).toBeInTheDocument();
  expect(screen.getByText("Python")).toBeInTheDocument();
  // Le 4e tag est masqué et remplacé par "+1"
  expect(screen.getByText("+1")).toBeInTheDocument();
  expect(screen.queryByText("Docker")).not.toBeInTheDocument();
});

test("EF-06 — affiche la ville si renseignée", () => {
  render(
    <MemoryRouter>
      <ProjectCard project={baseProject} />
    </MemoryRouter>
  );

  expect(screen.getByText("Genève")).toBeInTheDocument();
});

test("EF-06 — n'affiche pas la ville si non renseignée", () => {
  const projectSansVille = {
    ...baseProject,
    projectMeta: {},
  };

  render(
    <MemoryRouter>
      <ProjectCard project={projectSansVille} />
    </MemoryRouter>
  );

  expect(screen.queryByText("Genève")).not.toBeInTheDocument();
});

test("EF-06 — affiche le badge 'Complet' quand toutes les places sont prises", () => {
  const projetComplet = {
    ...baseProject,
    participants: Array.from({ length: 5 }, (_, i) => ({ _id: `u${i}` })),
    maxParticipants: 5,
  };

  render(
    <MemoryRouter>
      <ProjectCard project={projetComplet} />
    </MemoryRouter>
  );

  expect(screen.getByText("Complet")).toBeInTheDocument();
});

test("EF-06 — n'affiche pas le badge 'Complet' s'il reste des places", () => {
  render(
    <MemoryRouter>
      <ProjectCard project={baseProject} />
    </MemoryRouter>
  );

  expect(screen.queryByText("Complet")).not.toBeInTheDocument();
});

test("EF-06 — tronque les descriptions longues à 100 caractères", () => {
  const longDesc = "A".repeat(120);
  const projet = { ...baseProject, description: longDesc };

  render(
    <MemoryRouter>
      <ProjectCard project={projet} />
    </MemoryRouter>
  );

  expect(screen.getByText("A".repeat(100) + "...")).toBeInTheDocument();
});
