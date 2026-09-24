import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CreateProject from "../pages/CreateProject";

const mockApi = jest.fn();
const mockNavigate = jest.fn();

jest.mock("../lib/api", () => ({
  api: (...args) => mockApi(...args),
}));

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

jest.mock("../context/ThemeContext", () => ({
  useTheme: () => ({ theme: "light", toggleTheme: jest.fn() }),
}));

jest.mock("react-leaflet", () => ({
  MapContainer: ({ children }) => <div data-testid="mock-map">{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
  useMap: () => ({ setView: jest.fn(), getZoom: () => 6 }),
  useMapEvents: () => null,
}));

beforeEach(() => {
  mockApi.mockReset();
  mockNavigate.mockReset();
  window.localStorage.clear();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => [],
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function fillRequiredProjectFields() {
  await userEvent.type(screen.getByPlaceholderText(/club de foot/i), "Mon super projet");
  await userEvent.type(screen.getByPlaceholderText(/genève/i), "Genève");
  await userEvent.type(screen.getByPlaceholderText(/suisse/i), "Suisse");
  fireEvent.change(screen.getByLabelText(/date de début/i), { target: { value: "2027-04-10" } });
  fireEvent.change(screen.getByLabelText(/date de fin/i), { target: { value: "2027-04-12" } });
}

test("EF-03 — affiche le formulaire de création avec les champs principaux", () => {
  render(
    <MemoryRouter>
      <CreateProject />
    </MemoryRouter>
  );

  expect(
    screen.getByRole("heading", { name: /créer un projet/i })
  ).toBeInTheDocument();
  expect(
    screen.getByPlaceholderText(/club de foot/i)
  ).toBeInTheDocument();
  expect(screen.getByTestId("mock-map")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /créer le projet/i })
  ).toBeInTheDocument();
});

test("EF-03 — charge un projet existant et envoie une mise à jour en mode édition", async () => {
  mockApi.mockImplementation((path, options) => {
    if (path === "/projects/project-1" && !options) {
      return Promise.resolve({
        _id: "project-1",
        title: "Projet existant",
        description: "Description initiale",
        status: "draft",
        maxParticipants: 8,
        minAge: 18,
        maxAge: 30,
        tags: ["React"],
        requiredSkills: ["Node.js"],
        langues: ["Français"],
        location: { coordinates: [6.1432, 46.2044] },
        projectMeta: {
          city: "Genève",
          region: "Suisse",
          startDate: "2026-04-10T00:00:00.000Z",
          endDate: "2026-04-12T00:00:00.000Z",
          budget: 500,
          repoUrl: "https://github.com/test/repo",
        },
      });
    }

    if (path === "/projects/project-1" && options?.method === "PUT") {
      return Promise.resolve({ _id: "project-1" });
    }

    return Promise.resolve({});
  });

  render(
    <MemoryRouter initialEntries={["/projects/project-1/edit"]}>
      <Routes>
        <Route path="/projects/:id/edit" element={<CreateProject />} />
      </Routes>
    </MemoryRouter>
  );

  expect(await screen.findByDisplayValue("Projet existant")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /modifier le projet/i })).toBeInTheDocument();

  await userEvent.clear(screen.getByDisplayValue("Projet existant"));
  await userEvent.type(screen.getByPlaceholderText(/club de foot/i), "Projet mis à jour");
  await userEvent.click(screen.getByRole("button", { name: /enregistrer les modifications/i }));

  await waitFor(() =>
    expect(mockApi).toHaveBeenCalledWith(
      "/projects/project-1",
      expect.objectContaining({ method: "PUT" })
    )
  );

  expect(mockNavigate).toHaveBeenCalledWith("/projects/project-1");
});

test("EF-03 — affiche une erreur si le titre est vide à la soumission", async () => {
  render(
    <MemoryRouter>
      <CreateProject />
    </MemoryRouter>
  );

  await userEvent.click(screen.getByRole("button", { name: /créer le projet/i }));

  expect(screen.getByText(/titre est obligatoire/i)).toBeInTheDocument();
  expect(mockApi).not.toHaveBeenCalled();
});

test("EF-03 — appelle l'API avec les bonnes données et les coordonnées choisies", async () => {
  mockApi.mockResolvedValue({ _id: "proj123" });
  window.localStorage.setItem(
    "hive-create-project-draft",
    JSON.stringify({
      form: { title: "", description: "", status: "open", city: "Genève", country: "Suisse" },
      tags: [],
      skills: [],
      languages: [],
      markerPosition: [46.2044, 6.1432],
    })
  );

  render(
    <MemoryRouter>
      <CreateProject />
    </MemoryRouter>
  );

  await userEvent.clear(screen.getByPlaceholderText(/club de foot/i));
  await userEvent.type(screen.getByPlaceholderText(/club de foot/i), "Mon super projet");
  fireEvent.change(screen.getByLabelText(/date de début/i), { target: { value: "2027-04-10" } });
  fireEvent.change(screen.getByLabelText(/date de fin/i), { target: { value: "2027-04-12" } });
  await userEvent.click(screen.getByRole("button", { name: /créer le projet/i }));

  await waitFor(() =>
    expect(mockApi).toHaveBeenCalledWith(
      "/projects/create",
      expect.objectContaining({ method: "POST" })
    )
  );

  const [, request] = mockApi.mock.calls[0];
  expect(JSON.parse(request.body)).toEqual(
    expect.objectContaining({
      title: "Mon super projet",
      location: {
        type: "Point",
        coordinates: [6.1432, 46.2044],
      },
      projectMeta: expect.objectContaining({
        city: "Genève",
        region: "Suisse",
      }),
    })
  );
});

test("EF-03 — restaure le brouillon du formulaire depuis le stockage local", () => {
  window.localStorage.setItem(
    "hive-create-project-draft",
    JSON.stringify({
      form: {
        title: "Projet relancé",
        description: "Un brouillon",
        status: "draft",
        maxParticipants: "8",
        minAge: "18",
        city: "Genève",
        country: "Suisse",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        budget: "2500",
        repoUrl: "https://github.com/test/repo",
      },
      tags: ["React"],
      skills: ["Node.js"],
      languages: ["Français"],
      markerPosition: [46.2044, 6.1432],
    })
  );

  render(
    <MemoryRouter>
      <CreateProject />
    </MemoryRouter>
  );

  expect(screen.getByDisplayValue("Projet relancé")).toBeInTheDocument();
  expect(screen.getByDisplayValue("Genève")).toBeInTheDocument();
  expect(screen.getByText("React")).toBeInTheDocument();
  expect(screen.getByText(/Lat: 46.20440/i)).toBeInTheDocument();
});

test("EF-03 — propose une ville lorsqu'on commence à écrire", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => [
      {
        place_id: 1,
        lat: "46.2044",
        lon: "6.1432",
        display_name: "Genève, Suisse",
        address: {
          city: "Genève",
          country: "Suisse",
        },
      },
    ],
  });

  render(
    <MemoryRouter>
      <CreateProject />
    </MemoryRouter>
  );

  await userEvent.type(screen.getByPlaceholderText(/genève/i), "Gen");

  expect(await screen.findByRole("button", { name: /genève suisse/i })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /genève suisse/i }));

  expect(screen.getByDisplayValue("Genève")).toBeInTheDocument();
  expect(screen.getByDisplayValue("Suisse")).toBeInTheDocument();
});

test("EF-03 — refuse une date de début avant aujourd'hui", async () => {
  render(
    <MemoryRouter>
      <CreateProject />
    </MemoryRouter>
  );

  await userEvent.type(screen.getByPlaceholderText(/club de foot/i), "Projet date");
  await userEvent.type(screen.getByPlaceholderText(/genève/i), "Genève");
  await userEvent.type(screen.getByPlaceholderText(/suisse/i), "Suisse");
  fireEvent.change(screen.getByLabelText(/date de début/i), { target: { value: "2026-03-01" } });
  fireEvent.change(screen.getByLabelText(/date de fin/i), { target: { value: "2027-04-12" } });
  await userEvent.click(screen.getByRole("button", { name: /créer le projet/i }));

  expect(screen.getByText(/date de début ne peut pas être avant aujourd'hui/i)).toBeInTheDocument();
  expect(mockApi).not.toHaveBeenCalled();
});

test("EF-03 — refuse une date de fin qui n'est pas après la date de début", async () => {
  render(
    <MemoryRouter>
      <CreateProject />
    </MemoryRouter>
  );

  await userEvent.type(screen.getByPlaceholderText(/club de foot/i), "Projet date");
  await userEvent.type(screen.getByPlaceholderText(/genève/i), "Genève");
  await userEvent.type(screen.getByPlaceholderText(/suisse/i), "Suisse");
  fireEvent.change(screen.getByLabelText(/date de début/i), { target: { value: "2027-04-12" } });
  fireEvent.change(screen.getByLabelText(/date de fin/i), { target: { value: "2027-04-12" } });
  await userEvent.click(screen.getByRole("button", { name: /créer le projet/i }));

  expect(screen.getByText(/date de fin doit être strictement après la date de début/i)).toBeInTheDocument();
  expect(mockApi).not.toHaveBeenCalled();
});

test("EF-03 — permet de créer un projet sans date de fin", async () => {
  mockApi.mockResolvedValue({ _id: "proj-open" });

  render(
    <MemoryRouter>
      <CreateProject />
    </MemoryRouter>
  );

  await userEvent.type(screen.getByPlaceholderText(/club de foot/i), "Club de foot");
  await userEvent.type(screen.getByPlaceholderText(/genève/i), "Genève");
  await userEvent.type(screen.getByPlaceholderText(/suisse/i), "Suisse");
  fireEvent.change(screen.getByLabelText(/date de début/i), { target: { value: "2027-04-10" } });
  await userEvent.click(screen.getByRole("button", { name: /créer le projet/i }));

  await waitFor(() =>
    expect(mockApi).toHaveBeenCalledWith(
      "/projects/create",
      expect.objectContaining({ method: "POST" })
    )
  );

  const [, request] = mockApi.mock.calls[0];
  expect(JSON.parse(request.body).projectMeta.endDate).toBeNull();
});

test("EF-03 — refuse un âge maximum plus petit que l'âge minimum", async () => {
  render(
    <MemoryRouter>
      <CreateProject />
    </MemoryRouter>
  );

  await userEvent.type(screen.getByPlaceholderText(/club de foot/i), "Club junior");
  await userEvent.type(screen.getByPlaceholderText(/genève/i), "Genève");
  await userEvent.type(screen.getByPlaceholderText(/suisse/i), "Suisse");
  fireEvent.change(screen.getByLabelText(/date de début/i), { target: { value: "2027-04-10" } });
  await userEvent.type(screen.getByRole("spinbutton", { name: /âge minimum/i }), "15");
  await userEvent.type(screen.getByRole("spinbutton", { name: /âge maximum/i }), "10");
  await userEvent.click(screen.getByRole("button", { name: /créer le projet/i }));

  expect(screen.getByText(/âge maximum doit être supérieur ou égal à l'âge minimum/i)).toBeInTheDocument();
  expect(mockApi).not.toHaveBeenCalled();
});

test("EF-03 — affiche une erreur si l'API échoue", async () => {
  mockApi.mockRejectedValue(new Error("Erreur serveur"));

  render(
    <MemoryRouter>
      <CreateProject />
    </MemoryRouter>
  );

  await fillRequiredProjectFields();
  await userEvent.click(screen.getByRole("button", { name: /créer le projet/i }));

  expect(await screen.findByText(/erreur serveur/i)).toBeInTheDocument();
});

test("EF-03 — permet d'ajouter un tag via le bouton +", async () => {
  render(
    <MemoryRouter>
      <CreateProject />
    </MemoryRouter>
  );

  const tagInput = screen.getByPlaceholderText(/ajouter un tag/i);
  await userEvent.type(tagInput, "React");

  await userEvent.click(screen.getByRole("button", { name: /ajouter \(tags\)/i }));

  expect(screen.getByText("React")).toBeInTheDocument();
});

test("EF-03 — n'ajoute pas un tag en double", async () => {
  render(
    <MemoryRouter>
      <CreateProject />
    </MemoryRouter>
  );

  const tagInput = screen.getByPlaceholderText(/ajouter un tag/i);
  const addTag = screen.getByRole("button", { name: /ajouter \(tags\)/i });

  await userEvent.type(tagInput, "React");
  await userEvent.click(addTag);
  await userEvent.type(tagInput, "React");
  await userEvent.click(addTag);

  expect(screen.getAllByText("React")).toHaveLength(1);
});

test("EF-03 — permet d'ajouter une compétence recherchée", async () => {
  render(
    <MemoryRouter>
      <CreateProject />
    </MemoryRouter>
  );

  const skillInput = screen.getByPlaceholderText(/ajouter une compétence/i);
  await userEvent.type(skillInput, "TypeScript");

  await userEvent.click(screen.getByRole("button", { name: /ajouter \(compétences recherchées\)/i }));

  expect(screen.getByText("TypeScript")).toBeInTheDocument();
});
