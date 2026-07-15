// EF-01/EF-02 — Profil utilisateur (affichage + modification)
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ProfileView from "../components/ProfileView";

const mockApi = jest.fn();
const mockNavigate = jest.fn();

jest.mock("../lib/api", () => ({
  api: (...args) => mockApi(...args),
}));

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { email: "jean@test.com" },
    updateUser: jest.fn(),
  }),
}));

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const fakeProfile = {
  email: "jean@test.com",
  firstName: "Jean",
  lastName: "Dupont",
  displayName: "jdupont",
  bio: "Développeur passionné",
  phone: "",
  age: 25,
  avatarUrl: "",
  address: { city: "Genève", country: "Suisse" },
  languages: ["Français", "Anglais"],
  skills: ["React", "Node.js"],
  education: [],
  reputation: { rating: 4.5 },
};

beforeEach(() => {
  mockNavigate.mockReset();
  mockApi.mockImplementation((path) => {
    if (path === "/auth/me") return Promise.resolve({ user: fakeProfile });
    if (path === "/projects/mine") return Promise.resolve([]);
    return Promise.resolve({});
  });
});

test("EF-02 — affiche le nom d'affichage et l'email dans l'en-tête du profil", async () => {
  render(
    <MemoryRouter>
      <ProfileView />
    </MemoryRouter>
  );

  await waitFor(() =>
    expect(screen.getByText("jdupont")).toBeInTheDocument()
  );
  expect(screen.getByText("jean@test.com")).toBeInTheDocument();
});

test("EF-02 — affiche la bio de l'utilisateur dans l'en-tête du profil", async () => {
  render(
    <MemoryRouter>
      <ProfileView />
    </MemoryRouter>
  );

  // La bio apparaît à la fois dans l'en-tête ET dans le textarea du formulaire
  await waitFor(() => {
    const elements = screen.getAllByText("Développeur passionné");
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });
});

test("EF-01/EF-13 — affiche la réputation de l'utilisateur", async () => {
  render(
    <MemoryRouter>
      <ProfileView />
    </MemoryRouter>
  );

  await waitFor(() =>
    expect(screen.getByText(/4\.5/)).toBeInTheDocument()
  );
});

test("EF-02 — le formulaire est pré-rempli avec les données du profil", async () => {
  render(
    <MemoryRouter>
      <ProfileView />
    </MemoryRouter>
  );

  await waitFor(() =>
    expect(screen.getByDisplayValue("Jean")).toBeInTheDocument()
  );
  expect(screen.getByDisplayValue("Dupont")).toBeInTheDocument();
  expect(screen.getByDisplayValue("jdupont")).toBeInTheDocument();
  expect(screen.getByDisplayValue("Genève")).toBeInTheDocument();
  expect(screen.getByDisplayValue("Suisse")).toBeInTheDocument();
});

test("EF-02 — appelle l'API PUT lors de la sauvegarde du profil", async () => {
  mockApi.mockImplementation((path, options) => {
    if (path === "/auth/me") return Promise.resolve({ user: fakeProfile });
    if (path === "/projects/mine") return Promise.resolve([]);
    if (path === "/user/profile") return Promise.resolve({});
    return Promise.resolve({});
  });

  render(
    <MemoryRouter>
      <ProfileView />
    </MemoryRouter>
  );

  await waitFor(() => screen.getByDisplayValue("Jean"));

  await userEvent.click(
    screen.getByRole("button", { name: /enregistrer les modifications/i })
  );

  await waitFor(() =>
    expect(mockApi).toHaveBeenCalledWith(
      "/user/profile",
      expect.objectContaining({ method: "PUT" })
    )
  );
});

test("EF-02 — permet de changer la photo de profil via URL", async () => {
  mockApi.mockImplementation((path, options) => {
    if (path === "/auth/me") return Promise.resolve({ user: fakeProfile });
    if (path === "/user/profile") return Promise.resolve({
      ...fakeProfile,
      avatarUrl: "https://cdn.example.com/avatar.png",
    });
    return Promise.resolve([]);
  });

  render(
    <MemoryRouter>
      <ProfileView />
    </MemoryRouter>
  );

  await waitFor(() => screen.getByLabelText(/ou coller une url d'image/i));
  await userEvent.type(
    screen.getByLabelText(/ou coller une url d'image/i),
    "https://cdn.example.com/avatar.png"
  );
  await userEvent.click(
    screen.getByRole("button", { name: /enregistrer les modifications/i })
  );

  await waitFor(() => {
    const [, options] = mockApi.mock.calls.find(([path]) => path === "/user/profile");
    expect(JSON.parse(options.body)).toEqual(
      expect.objectContaining({
        avatarUrl: "https://cdn.example.com/avatar.png",
      })
    );
  });
});

test("EF-02 — affiche un message de succès après sauvegarde", async () => {
  mockApi.mockImplementation((path) => {
    if (path === "/auth/me") return Promise.resolve({ user: fakeProfile });
    if (path === "/projects/mine") return Promise.resolve([]);
    if (path === "/user/profile") return Promise.resolve({});
    return Promise.resolve({});
  });

  render(
    <MemoryRouter>
      <ProfileView />
    </MemoryRouter>
  );

  await waitFor(() => screen.getByDisplayValue("Jean"));

  await userEvent.click(
    screen.getByRole("button", { name: /enregistrer les modifications/i })
  );

  await waitFor(() =>
    expect(screen.getByText(/profil mis à jour/i)).toBeInTheDocument()
  );
});

test("EF-02 — permet d'ouvrir l'édition d'un projet depuis le profil", async () => {
  mockApi.mockImplementation((path) => {
    if (path === "/auth/me") return Promise.resolve({ user: fakeProfile });
    if (path === "/projects/mine") {
      return Promise.resolve([
        {
          _id: "project-1",
          title: "Projet profil",
          description: "Description",
          status: "open",
          participants: [],
          ownerId: "owner-1",
          maxParticipants: 4,
          projectMeta: { city: "Genève" },
        },
      ]);
    }
    return Promise.resolve({});
  });

  render(
    <MemoryRouter>
      <ProfileView />
    </MemoryRouter>
  );

  await waitFor(() => expect(screen.getByText("Projet profil")).toBeInTheDocument());
  await userEvent.click(screen.getByRole("button", { name: /modifier/i }));

  expect(mockNavigate).toHaveBeenCalledWith("/projects/project-1/edit");
});
