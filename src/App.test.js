import { render, screen } from "@testing-library/react";
import App from "./App";

test("renderiza o player", async () => {
  render(<App />);
  const message = await screen.findByText(/REACT_APP_GOOGLE_API_KEY|Carregando louvores do Google Drive/i);
  expect(message).toBeInTheDocument();
});
