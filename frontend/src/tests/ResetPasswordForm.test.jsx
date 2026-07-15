import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ResetPasswordForm from "../components/ResetPasswordForm";

const mockConfirmResetPassword = jest.fn();

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    confirmResetPassword: mockConfirmResetPassword,
  }),
}));

const routeState = {
  pathname: "/reset-password",
  state: { email: "test@test.com", code: "123456" },
};

beforeEach(() => {
  mockConfirmResetPassword.mockReset();
});

test("affiche une erreur si les mots de passe ne correspondent pas", async () => {
  render(
    <MemoryRouter initialEntries={[routeState]}>
      <ResetPasswordForm />
    </MemoryRouter>
  );

  await userEvent.type(screen.getByLabelText("Nouveau mot de passe"), "abc123");
  await userEvent.type(screen.getByLabelText("Confirmer le mot de passe"), "wrong");
  await userEvent.click(screen.getByRole("button", { name: /réinitialiser/i }));

  expect(await screen.findByText(/ne correspondent pas/i)).toBeInTheDocument();
});

// TF-40 — réinitialisation mot de passe réussie
test("TF-40 — appelle confirmResetPassword avec email, code et nouveau mot de passe", async () => {
  mockConfirmResetPassword.mockResolvedValueOnce({});

  render(
    <MemoryRouter initialEntries={[routeState]}>
      <ResetPasswordForm />
    </MemoryRouter>
  );

  await userEvent.type(screen.getByLabelText("Nouveau mot de passe"), "NewPass1!");
  await userEvent.type(screen.getByLabelText("Confirmer le mot de passe"), "NewPass1!");
  await userEvent.click(screen.getByRole("button", { name: /réinitialiser/i }));

  await waitFor(() =>
    expect(mockConfirmResetPassword).toHaveBeenCalledWith(
      "test@test.com",
      "123456",
      "NewPass1!"
    )
  );
});
