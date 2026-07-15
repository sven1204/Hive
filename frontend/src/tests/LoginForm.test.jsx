import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import LoginForm from "../components/LoginForm";

const mockLogin = jest.fn();

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

beforeEach(() => {
  mockLogin.mockReset();
  localStorage.clear();
});

// TF-02
test("TF-02 — permet à un utilisateur de se connecter", async () => {
  render(
    <BrowserRouter>
      <LoginForm />
    </BrowserRouter>
  );

  await userEvent.type(screen.getByLabelText("Email"), "test@mail.com");
  await userEvent.type(screen.getByLabelText("Mot de passe"), "password123");
  await userEvent.click(screen.getByRole("button", { name: /se connecter/i }));

  await waitFor(() =>
    expect(mockLogin).toHaveBeenCalledWith({
      email: "test@mail.com",
      password: "password123",
      rememberMe: false,
    })
  );
});

// TF-03
test("TF-03 — affiche un message d'erreur si les identifiants sont incorrects", async () => {
  mockLogin.mockRejectedValueOnce(new Error("Email ou mot de passe incorrect."));

  render(
    <BrowserRouter>
      <LoginForm />
    </BrowserRouter>
  );

  await userEvent.type(screen.getByLabelText("Email"), "test@mail.com");
  await userEvent.type(screen.getByLabelText("Mot de passe"), "wrongpassword");
  await userEvent.click(screen.getByRole("button", { name: /se connecter/i }));

  expect(await screen.findByText(/email ou mot de passe incorrect/i)).toBeInTheDocument();
});

// TF-33
test("TF-33 — transmet rememberMe = true quand la case est cochée", async () => {
  render(
    <BrowserRouter>
      <LoginForm />
    </BrowserRouter>
  );

  await userEvent.type(screen.getByLabelText("Email"), "test@mail.com");
  await userEvent.type(screen.getByLabelText("Mot de passe"), "password123");
  await userEvent.click(screen.getByRole("checkbox"));
  await userEvent.click(screen.getByRole("button", { name: /se connecter/i }));

  await waitFor(() =>
    expect(mockLogin).toHaveBeenCalledWith({
      email: "test@mail.com",
      password: "password123",
      rememberMe: true,
    })
  );
});
