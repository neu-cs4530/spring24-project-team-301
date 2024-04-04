import Express from 'express';
import * as http from 'http';
import CORS from 'cors';
import { AddressInfo } from 'net';
import swaggerUi from 'swagger-ui-express';
import { ValidateError } from 'tsoa';
import fs from 'fs/promises';
import { Server as SocketServer } from 'socket.io';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, increment, updateDoc, getDoc } from 'firebase/firestore';
import { RegisterRoutes } from '../generated/routes';
import TownsStore from './lib/TownsStore';
import { ClientToServerEvents, ServerToClientEvents } from './types/CoveyTownSocket';
import { TownsController } from './town/TownsController';
import { logError } from './Utils';
import { auth, firestore } from '../firebase';

// Create the server instances
const app = Express();
app.use(CORS());
const server = http.createServer(app);
const socketServer = new SocketServer<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: { origin: '*' },
});

// Initialize the towns store with a factory that creates a broadcast emitter for a town
TownsStore.initializeTownsStore((townID: string) => socketServer.to(townID));

// Connect the socket server to the TownsController. We use here the same pattern as tsoa
// (the library that we use for REST), which creates a new controller instance for each request
socketServer.on('connection', socket => {
  new TownsController().joinTown(socket);
});

// Set the default content-type to JSON
app.use(Express.json());

// Add a /docs endpoint that will display swagger auto-generated documentation
app.use('/docs', swaggerUi.serve, async (_req: Express.Request, res: Express.Response) => {
  const swaggerSpec = await fs.readFile('../shared/generated/swagger.json', 'utf-8');
  return res.send(swaggerUi.generateHTML(JSON.parse(swaggerSpec)));
});

// sign in a user
app.put('/login', async (_req: Express.Request, res: Express.Response) => {
  if (_req.body.email && _req.body.password) {
    try {
      await signInWithEmailAndPassword(auth, _req.body.email, _req.body.password);
      return res.status(200).send('Login successful');
    } catch (e) {
      return res.status(401).send('Login failed');
    }
  }
  return res.status(400).send('Invalid body');
});

// create a user account, initialize firestore record 0-0-0
app.post('/createAccount', async (_req: Express.Request, res: Express.Response) => {
  if (_req.body.email && _req.body.password) {
    try {
      await createUserWithEmailAndPassword(auth, _req.body.email, _req.body.password);
      const accountRef = doc(firestore, 'ShogiRecords', _req.body.email);
      await setDoc(accountRef, { win: 0, loss: 0, draw: 0 });
      return res.status(200).send('Account created');
    } catch (e) {
      return res.status(401).send('Account creation failed');
    }
  }
  return res.status(400).send('Invalid body');
});

// user win
app.put('/win', async (_req: Express.Request, res: Express.Response) => {
  if (_req.body.email) {
    try {
      const accountRef = doc(firestore, 'ShogiRecords', _req.body.email);
      await updateDoc(accountRef, { win: increment(1) });
      return res.status(200).send('Record updated');
    } catch (e) {
      return res.status(500).send('Record update failed');
    }
  }
  return res.status(400).send('Invalid body');
});
app.get('/wins', async (_req: Express.Request, res: Express.Response) => {
  const userEmail = _req.query.email;

  if (userEmail && typeof userEmail === 'string') {
    try {
      const accountRef = doc(firestore, 'ShogiRecords', userEmail);
      const accountSnapshot = await getDoc(accountRef);

      if (!accountSnapshot.exists()) {
        return res.status(404).send('User not found');
      }

      const winCount = accountSnapshot.data().win;

      return res.status(200).json({ email: userEmail, wins: winCount });
    } catch (e) {
      return res.status(500).send('Failed to retrieve wins');
    }
  }
  return res.status(400).send('Invalid query');
});

// user loss
app.put('/lose', async (_req: Express.Request, res: Express.Response) => {
  if (_req.body.email) {
    try {
      const accountRef = doc(firestore, 'ShogiRecords', _req.body.email);
      await updateDoc(accountRef, { loss: increment(1) });
      return res.status(200).send('Record updated');
    } catch (e) {
      return res.status(500).send('Record update failed');
    }
  }
  return res.status(400).send('Invalid body');
});
app.get('/losses', async (_req: Express.Request, res: Express.Response) => {
  const userEmail = _req.query.email;
  if (userEmail && typeof userEmail === 'string') {
    try {
      const accountRef = doc(firestore, 'ShogiRecords', userEmail);
      const accountSnapshot = await getDoc(accountRef);

      if (!accountSnapshot.exists()) {
        return res.status(404).send('User not found');
      }

      const lossCount = accountSnapshot.data().loss;

      return res.status(200).json({ email: userEmail, losses: lossCount });
    } catch (e) {
      return res.status(500).send('Failed to retrieve losses');
    }
  }
  return res.status(400).send('Invalid query');
});

// user draw
app.put('/draw', async (_req: Express.Request, res: Express.Response) => {
  if (_req.body.email) {
    try {
      const accountRef = doc(firestore, 'ShogiRecords', _req.body.email);
      await updateDoc(accountRef, { draw: increment(1) });
      return res.status(200).send('Record updated');
    } catch (e) {
      return res.status(500).send('Record update failed');
    }
  }
  return res.status(400).send('Invalid body');
});
app.get('/draws', async (_req: Express.Request, res: Express.Response) => {
  const userEmail = _req.query.email;
  if (userEmail && typeof userEmail === 'string') {
    try {
      const accountRef = doc(firestore, 'ShogiRecords', userEmail);
      const accountSnapshot = await getDoc(accountRef);

      if (!accountSnapshot.exists()) {
        return res.status(404).send('User not found');
      }

      const drawCount = accountSnapshot.data().draw;

      return res.status(200).json({ email: userEmail, draws: drawCount });
    } catch (e) {
      return res.status(500).send('Failed to retrieve draws');
    }
  }
  return res.status(400).send('Invalid query');
});

// Register the TownsController routes with the express server
RegisterRoutes(app);

// Add a middleware for Express to handle errors
app.use(
  (
    err: unknown,
    _req: Express.Request,
    res: Express.Response,
    next: Express.NextFunction,
  ): Express.Response | void => {
    if (err instanceof ValidateError) {
      return res.status(422).json({
        message: 'Validation Failed',
        details: err?.fields,
      });
    }
    if (err instanceof Error) {
      logError(err);
      return res.status(500).json({
        message: 'Internal Server Error',
      });
    }

    return next();
  },
);

// Start the configured server, defaulting to port 8081 if $PORT is not set
server.listen(process.env.PORT || 8081, () => {
  const address = server.address() as AddressInfo;
  // eslint-disable-next-line no-console
  console.log(`Listening on ${address.port}`);
  if (process.env.DEMO_TOWN_ID) {
    TownsStore.getInstance().createTown(process.env.DEMO_TOWN_ID, false);
  }
});
