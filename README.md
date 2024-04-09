# Covey.Town

Covey.Town provides a virtual meeting space where different groups of people can have simultaneous video calls, allowing participants to drift between different conversations, just like in real life.
Covey.Town was built for Northeastern's [Spring 2021 software engineering course](https://neu-se.github.io/CS4530-CS5500-Spring-2021/), and is designed to be reused across semesters.
You can view our reference deployment of the app at [app.covey.town](https://app.covey.town/), and our project showcase ([Fall 2022](https://neu-se.github.io/CS4530-Fall-2022/assignments/project-showcase), [Spring 2022](https://neu-se.github.io/CS4530-Spring-2022/assignments/project-showcase), [Spring 2021](https://neu-se.github.io/CS4530-CS5500-Spring-2021/project-showcase)) highlight select student projects.

![Covey.Town Architecture](docs/covey-town-architecture.png)

The figure above depicts the high-level architecture of Covey.Town.
The frontend client (in the `frontend` directory of this repository) uses the [PhaserJS Game Library](https://phaser.io) to create a 2D game interface, using tilemaps and sprites.
The frontend implements video chat using the [Twilio Programmable Video](https://www.twilio.com/docs/video) API, and that aspect of the interface relies heavily on [Twilio's React Starter App](https://github.com/twilio/twilio-video-app-react). Twilio's React Starter App is packaged and reused under the Apache License, 2.0.

A backend service (in the `townService` directory) implements the application logic: tracking which "towns" are available to be joined, and the state of each of those towns.

## Running this app locally

Running the application locally entails running both the backend service and a frontend.

### Setting up the backend

To run the backend, you will need a Twilio account. Twilio provides new accounts with $15 of credit, which is more than enough to get started.
To create an account and configure your local environment:

1. Go to [Twilio](https://www.twilio.com/) and create an account. You do not need to provide a credit card to create a trial account.
2. Create an API key and secret (select "API Keys" on the left under "Settings")
3. Create a `.env` file in the `townService` directory, setting the values as follows:

| Config Value            | Description                               |
| ----------------------- | ----------------------------------------- |
| `TWILIO_ACCOUNT_SID`    | Visible on your twilio account dashboard. |
| `TWILIO_API_KEY_SID`    | The SID of the new API key you created.   |
| `TWILIO_API_KEY_SECRET` | The secret for the API key you created.   |
| `TWILIO_API_AUTH_TOKEN` | Visible on your twilio account dashboard. |

You will also need to set up Firebase in the backend. Follow these steps:

1. Sign in to the Firebase console > + Add Project > Enter project name > Disable Analytics to simplify setup > Create project > Add a web app (</> icon) > Name app > Register app
2. This will generate a configuration file with your secrets. Store these in the `townService/.env` file. Here are the variable assignments:

| `.env` variable name          | provided Firebase config variable |
| ----------------------------- | --------------------------------- |
| `FIREBASE_API_KEY`            | apiKey                            |
| `FIREBASE_AUTH_DOMAIN`        | authDomain                        |
| `FIREBASE_PROJECT_ID`         | projectId                         |
| `FIREBASE_STORAGE_BUCKET`     | storageBucket                     |
| `FIREBASE_MESSAGING_SENDER_ID`| messagingSenderId                 |
| `FIREBASE_APP_ID`             | appId                             |
| `FIREBASE_MEASUREMENT_ID`     | measurementId                     |
| `FIREBASE_STORAGE_BUCKET`     | storageBucket                     |

   - Continue to console for your project
   - In the left sidebar, select Build > Authentication > Get started > select Email/Password sign in > Save
   - In the left sidebar, select Build > Firestore Database > Create database > Next > Start in test mode > Create

3. In the project frontend and townService directories, run npm install and npm start
   - Note: npm install is only needed on the first run

4. The local deployment should now be live at http://localhost:3000/
   - To join a local town, you must first create an account in the welcome UI. This will register you to the authenticated users in Firebase, and initialize a 0-0-0 record for you in the database
   - For future uses, you may sign in using these same credentials

### Starting the backend

Once your backend is configured, you can start it by running `npm start` in the `townService` directory (the first time you run it, you will also need to run `npm install`).
The backend will automatically restart if you change any of the files in the `townService/src` directory.

### Configuring the frontend

Create a `.env` file in the `frontend` directory, with the line: `NEXT_PUBLIC_TOWNS_SERVICE_URL=http://localhost:8081` (if you deploy the towns service to another location, put that location here instead)

### Running the frontend

In the `frontend` directory, run `npm start` (again, you'll need to run `npm install` the very first time). After several moments (or minutes, depending on the speed of your machine), a browser will open with the frontend running locally.
The frontend will automatically re-compile and reload in your browser if you change any files in the `frontend/src` directory.