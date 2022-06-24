import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { TonClient } from "@eversdk/core";
import { libWeb } from "@eversdk/lib-web";

const root = ReactDOM.createRoot(document.getElementById("root"));

// eslint-disable-next-line react-hooks/rules-of-hooks
TonClient.useBinaryLibrary(libWeb);

// Note: The application receives a client instance that
// has been initialized with the @eversdk/lib-web library.
root.render(
    <React.StrictMode>
        <App client={new TonClient()} />
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
