// TF-16/TF-37 — Envoi de messages (groupe et direct)
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import MessagesPage from "../pages/MessagesPage";

// jsdom ne supporte pas scrollIntoView — le mocker pour éviter que le composant plante
beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

const mockApi = jest.fn();
const mockNavigate = jest.fn();

// mockEmit est une variable let capturée par fermeture dans la factory — assignée dans beforeEach
let mockEmit;

jest.mock("../lib/api", () => ({
  api: (...args) => mockApi(...args),
}));

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { _id: "me-1", email: "me@test.com", displayName: "Moi" },
  }),
}));

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// La factory ne référence pas mockEmit directement : elle crée une closure qui y accède
// au moment de l'appel (bien après l'initialisation de la variable).
jest.mock("socket.io-client", () => ({
  io: () => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: (...args) => mockEmit && mockEmit(...args),
    disconnect: jest.fn(),
    join: jest.fn(),
  }),
}));

const fakePartner = {
  _id: "partner-1",
  displayName: "Alice",
  firstName: "Alice",
  lastName: "Martin",
  avatarUrl: "",
};

const fakeGroupConv = {
  conversation: {
    _id: "conv-1",
    name: "Projet Alpha",
    participants: [{ _id: "me-1", displayName: "Moi" }],
  },
  lastMessage: null,
  unread: 0,
};

beforeEach(() => {
  mockEmit = jest.fn();
  mockApi.mockReset();
  mockNavigate.mockReset();

  mockApi.mockImplementation((path) => {
    if (path === "/messages/conversations") return Promise.resolve([]);
    if (path === "/messages/group/mine") return Promise.resolve([fakeGroupConv]);
    if (path === "/messages/group/archived") return Promise.resolve([]);
    if (path === `/user/${fakePartner._id}`) return Promise.resolve(fakePartner);
    if (path === `/messages/${fakePartner._id}`) return Promise.resolve([]);
    if (path === `/messages/${fakePartner._id}/read`) return Promise.resolve({});
    if (path === `/messages/group/${fakeGroupConv.conversation._id}`) return Promise.resolve([]);
    return Promise.resolve([]);
  });
});

function renderWithUrl(search) {
  return render(
    <MemoryRouter initialEntries={[`/messages${search}`]}>
      <Routes>
        <Route path="/messages" element={<MessagesPage />} />
      </Routes>
    </MemoryRouter>
  );
}

test("TF-37 — envoie un message direct via socket", async () => {
  renderWithUrl(`?with=${fakePartner._id}`);

  await waitFor(() =>
    expect(mockApi).toHaveBeenCalledWith(`/user/${fakePartner._id}`)
  );

  const textarea = await screen.findByPlaceholderText(/écrire un message/i);

  await userEvent.type(textarea, "Bonjour Alice");
  await userEvent.click(screen.getByRole("button", { name: /envoyer/i }));

  expect(mockEmit).toHaveBeenCalledWith("send_message", {
    to: fakePartner._id,
    content: "Bonjour Alice",
  });
});

test("TF-37 — la zone de saisie est vidée après envoi", async () => {
  renderWithUrl(`?with=${fakePartner._id}`);

  await waitFor(() =>
    expect(mockApi).toHaveBeenCalledWith(`/user/${fakePartner._id}`)
  );

  const textarea = await screen.findByPlaceholderText(/écrire un message/i);

  await userEvent.type(textarea, "Test message");
  await userEvent.click(screen.getByRole("button", { name: /envoyer/i }));

  expect(textarea.value).toBe("");
});

test("TF-16 — envoie un message de groupe via socket", async () => {
  renderWithUrl(`?group=${fakeGroupConv.conversation._id}`);

  await waitFor(() =>
    expect(mockApi).toHaveBeenCalledWith("/messages/group/mine")
  );

  const textarea = await screen.findByPlaceholderText(/écrire un message/i);

  await userEvent.type(textarea, "Salut le groupe");
  await userEvent.click(screen.getByRole("button", { name: /envoyer/i }));

  expect(mockEmit).toHaveBeenCalledWith("send_group_message", {
    conversationId: fakeGroupConv.conversation._id,
    content: "Salut le groupe",
  });
});

test("TF-16 — le bouton d'envoi est désactivé si le message est vide", async () => {
  renderWithUrl(`?group=${fakeGroupConv.conversation._id}`);

  await waitFor(() =>
    expect(mockApi).toHaveBeenCalledWith("/messages/group/mine")
  );

  await screen.findByPlaceholderText(/écrire un message/i);

  const sendBtn = screen.getByRole("button", { name: /envoyer/i });
  expect(sendBtn).toBeDisabled();
});

test("TF-37 — envoie le message via la touche Entrée", async () => {
  renderWithUrl(`?with=${fakePartner._id}`);

  await waitFor(() =>
    expect(mockApi).toHaveBeenCalledWith(`/user/${fakePartner._id}`)
  );

  const textarea = await screen.findByPlaceholderText(/écrire un message/i);

  await userEvent.type(textarea, "Message clavier{Enter}");

  expect(mockEmit).toHaveBeenCalledWith("send_message", {
    to: fakePartner._id,
    content: "Message clavier",
  });
});
