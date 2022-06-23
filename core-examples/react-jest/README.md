# Testing React App with Jest

This sample app based on [Create React App](https://github.com/facebook/create-react-app).\
It runs the "@eversdk/lib-web" library in the browser to work with the everscale blockchain.

For testing with Jest, this app uses the "@eversdk/lib-node" library.\
This is the preferred way to test React Apps, because "lib-node" and "lib-web" libraries are essentially identical.

## Run test

In the project directory, run:

```
npm i
npm test
```

Launches the test runner in the interactive watch mode.\
**Pay attention to the specifics** in the [config-overrides.js](./config-overrides.js).

See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

## Runs the app in the development mode

```
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.
