import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { TonClient } from "@eversdk/core";
import { libNode } from "@eversdk/lib-node";

import App from "./App";

let client;

beforeAll(() => {
    TonClient.useBinaryLibrary(libNode);
    client = new TonClient();
});

afterAll(() => {
    client.close();
});

test("Check that button generates keys", async () => {
    // Note: The application receives a client instance that
    // has been initialized with the @eversdk/lib-node library.
    render(<App client={client} />);

    const keyPairRegex = /"public": "[0-9a-f]{64}"/;

    expect(screen.queryByText(keyPairRegex)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));

    expect(await screen.findByText(keyPairRegex)).toBeInTheDocument();
});
