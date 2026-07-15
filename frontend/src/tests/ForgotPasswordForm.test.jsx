// EF-04 — Réinitialisation du mot de passe via email
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ForgotPasswordForm from "../components/ForgotPasswordForm";

const mockResetPassword = jest.fn();
const mockVerifyResetCode = jest.fn();

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    resetPassword: mockResetPassword,
    verifyResetCode: mockVerifyResetCode,
  }),
}));

beforeEach(() => {
  mockResetPassword.mockReset();
  mockVerifyResetCode.mockReset();
});

test("EF-04 — affiche le formulaire d'envoi d'email à l'étape 1", () => {
  render(
    <MemoryRouter>
      <ForgotPasswordForm />
    </MemoryRouter>
  );

  expect(screen.getByLabelText("Adresse email")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /envoyer le code/i })
  ).toBeInTheDocument();
});

test("EF-04 — passe à l'étape 2 et affiche la saisie OTP après envoi", async () => {
  mockResetPassword.mockResolvedValue({});

  render(
    <MemoryRouter>
      <ForgotPasswordForm />
    </MemoryRouter>
  );

  await userEvent.type(
    screen.getByLabelText("Adresse email"),
    "user@test.com"
  );
  await userEvent.click(
    screen.getByRole("button", { name: /envoyer le code/i })
  );

  await waitFor(() =>
    expect(screen.getByText(/code reçu par email/i)).toBeInTheDocument()
  );
  expect(
    screen.getByRole("button", { name: /vérifier le code/i })
  ).toBeInTheDocument();
});

test("EF-04 — affiche une erreur si le code OTP est incomplet à l'étape 2", async () => {
  mockResetPassword.mockResolvedValue({});

  render(
    <MemoryRouter>
      <ForgotPasswordForm />
    </MemoryRouter>
  );

  // Passer à l'étape 2
  await userEvent.type(
    screen.getByLabelText("Adresse email"),
    "user@test.com"
  );
  await userEvent.click(
    screen.getByRole("button", { name: /envoyer le code/i })
  );
  await waitFor(() =>
    screen.getByRole("button", { name: /vérifier le code/i })
  );

  // Soumettre sans saisir de code
  await userEvent.click(
    screen.getByRole("button", { name: /vérifier le code/i })
  );

  await waitFor(() =>
    expect(screen.getByText(/code incomplet/i)).toBeInTheDocument()
  );
});

test("EF-04 — affiche une erreur si l'envoi d'email échoue", async () => {
  mockResetPassword.mockRejectedValue(new Error("Erreur réseau"));

  render(
    <MemoryRouter>
      <ForgotPasswordForm />
    </MemoryRouter>
  );

  await userEvent.type(
    screen.getByLabelText("Adresse email"),
    "user@test.com"
  );
  await userEvent.click(
    screen.getByRole("button", { name: /envoyer le code/i })
  );

  await waitFor(() =>
    expect(screen.getByText(/erreur lors/i)).toBeInTheDocument()
  );
});
