// src/App.test.jsx
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import App from "../App";

// mock MapView
jest.mock("../components/MapView", () => () => <div />);

// mock ProjectDetails (importe react-leaflet qui utilise les ESM)
jest.mock("../pages/ProjectDetails", () => () => <div />);
jest.mock("../pages/CreateProject", () => () => <div />);

// mock AuthContext
jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
  }),
}));

jest.mock("../context/ThemeContext", () => ({
  useTheme: () => ({ theme: "light", toggleTheme: jest.fn() }),
  ThemeProvider: ({ children }) => children,
}));

test("render l'application sans crash", () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
});
