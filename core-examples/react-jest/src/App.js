import logo from "./logo.svg";
import "./App.css";
import React from "react";

function App({ client }) {
    const [keys, setKeys] = React.useState();
    const handleClick = () => {
        client.crypto
            .generate_random_sign_keys()
            .then(keys => {
                setKeys(JSON.stringify(keys, null, 2));
            })
            .catch(err => {
                console.error(err);
                setKeys(err.message);
            });
    };

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <div>
                    <button type="button" onClick={handleClick}>
                        Press to generate a new key pair
                    </button>
                </div>
                <pre>{keys}</pre>
            </header>
        </div>
    );
}

export default App;
