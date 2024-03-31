import { Button, List, ListItem, useToast } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import ShogiAreaController from '../../../../classes/interactable/ShogiAreaController';
import PlayerController from '../../../../classes/PlayerController';
import { useInteractableAreaController } from '../../../../classes/TownController';
import useTownController from '../../../../hooks/useTownController';
import { GameStatus, InteractableID } from '../../../../types/CoveyTownSocket';
import ShogiBoard from './ShogiBoard';
import axios from 'axios';

/**
 * The ShogiArea component renders the Shogi game area.
 * It renders the current state of the area, optionally allowing the player to join the game.
 *
 * It uses Chakra-UI components (does not use other GUI widgets)
 *
 * It uses the ShogiAreaController to get the current state of the game.
 * It listens for the 'gameUpdated' and 'gameEnd' events on the controller, and re-renders accordingly.
 * It subscribes to these events when the component mounts, and unsubscribes when the component unmounts. It also unsubscribes when the gameAreaController changes.
 *
 */
export default function ShogiArea({
  interactableID,
}: {
  interactableID: InteractableID;
}): JSX.Element {
  const gameAreaController = useInteractableAreaController<ShogiAreaController>(interactableID);
  const townController = useTownController();

  const [black, setBlack] = useState<PlayerController | undefined>(gameAreaController.black);
  const [white, setWhite] = useState<PlayerController | undefined>(gameAreaController.white);
  const [joiningGame, setJoiningGame] = useState(false);

  const [gameStatus, setGameStatus] = useState<GameStatus>(gameAreaController.status);
  const [moveCount, setMoveCount] = useState<number>(gameAreaController.moveCount);

  const startingTimer = 10 * 60;
  const [whiteTime, setWhiteTime] = useState(startingTimer);
  const [blackTime, setBlackTime] = useState(startingTimer);

  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const toast = useToast();

  // maintain player timers
  useEffect(() => {
    const timer = setInterval(() => {
      if (gameStatus === 'IN_PROGRESS') {
        if (gameAreaController.whoseTurn?.id === gameAreaController.white?.id) {
          if (whiteTime === 0) {
            const model = gameAreaController.toInteractableAreaModel();
            let newModel = model;
            if (model.game) {
              newModel = {
                ...model,
                game: {
                  ...model.game,
                  state: {
                    ...model.game.state,
                    status: 'OVER',
                    winner: gameAreaController.black?.id,
                  },
                },
              };
            }
            gameAreaController._updateFrom(newModel);
          } else {
            setWhiteTime(whiteTime - 1);
          }
        } else {
          if (blackTime === 0) {
            const model = gameAreaController.toInteractableAreaModel();
            let newModel = model;
            if (model.game) {
              newModel = {
                ...model,
                game: {
                  ...model.game,
                  state: {
                    ...model.game.state,
                    status: 'OVER',
                    winner: gameAreaController.white?.id,
                  },
                },
              };
            }
            gameAreaController._updateFrom(newModel);
          } else {
            setBlackTime(blackTime - 1);
          }
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [blackTime, gameAreaController, gameStatus, whiteTime]);

  useEffect(() => {
    const updateGameState = () => {
      setBlack(gameAreaController.black);
      setWhite(gameAreaController.white);
      setGameStatus(gameAreaController.status || 'WAITING_TO_START');
      setMoveCount(gameAreaController.moveCount || 0);
    };
    gameAreaController.addListener('gameUpdated', updateGameState);
    const onGameEnd = async () => {
      const winner = gameAreaController.winner;
      if (!winner) {
        toast({
          title: 'Game over',
          description: 'Game ended in a tie',
          status: 'info',
        });
        console.log('Game ended in a tie');
        const body = {
          email: townController.ourPlayer?.userName,
        };
        const res = await axios.put(`${process.env.NEXT_PUBLIC_TOWNS_SERVICE_URL}/draw`, body);
        console.log(res);
        if (res.status !== 200) {
          throw new Error('Failed to register draw');
        }
        console.log('Record updates successful');
      } else if (winner === townController.ourPlayer) {
        toast({
          title: 'Game over',
          description: 'You won!',
          status: 'success',
        });
        console.log('You won!');
        const body = {
          email: townController.ourPlayer?.userName,
        };
        const res = await axios.put(`${process.env.NEXT_PUBLIC_TOWNS_SERVICE_URL}/win`, body);
        console.log(res);
        if (res.status !== 200) {
          throw new Error('Failed to register win');
        }
        console.log('Record updates successful');
      } else {
        toast({
          title: 'Game over',
          description: `You lost :(`,
          status: 'error',
        });
        console.log('You lost :(');
        const body = {
          email: townController.ourPlayer?.userName,
        };
        const res = await axios.put(`${process.env.NEXT_PUBLIC_TOWNS_SERVICE_URL}/loss`, body);
        console.log(res);
        if (res.status !== 200) {
          throw new Error('Failed to register loss');
        }
        console.log('Record updates successful');
      }
    };
    gameAreaController.addListener('gameEnd', onGameEnd);
    return () => {
      gameAreaController.removeListener('gameUpdated', updateGameState);
      gameAreaController.removeListener('gameEnd', onGameEnd);
    };
  }, [townController, gameAreaController, toast, gameStatus]);
  let gameStatusText = <></>;
  if (gameStatus === 'IN_PROGRESS') {
    gameStatusText = (
      <>
        Game in progress, {moveCount} moves in, currently{' '}
        {gameAreaController.whoseTurn === townController.ourPlayer
          ? 'your'
          : gameAreaController.whoseTurn?.userName + "'s"}{' '}
        turn{' '}
        {townController.ourPlayer === gameAreaController.black
          ? "(You're black)"
          : "(You're white)"}
      </>
    );
  } else if (gameStatus == 'WAITING_TO_START') {
    const startGameButton = (
      <Button
        onClick={async () => {
          setJoiningGame(true);
          try {
            await gameAreaController.startGame();
          } catch (err) {
            toast({
              title: 'Error starting game',
              description: (err as Error).toString(),
              status: 'error',
            });
          }
          setJoiningGame(false);
        }}
        isLoading={joiningGame}
        disabled={joiningGame}>
        Start Game
      </Button>
    );
    gameStatusText = <b>Waiting for players to press start. {startGameButton}</b>;
  } else {
    const joinGameButton = (
      <Button
        onClick={async () => {
          setJoiningGame(true);
          try {
            await gameAreaController.joinGame();
          } catch (err) {
            toast({
              title: 'Error joining game',
              description: (err as Error).toString(),
              status: 'error',
            });
          }
          setJoiningGame(false);
        }}
        isLoading={joiningGame}
        disabled={joiningGame}>
        Join New Game
      </Button>
    );
    let gameStatusStr;
    if (gameStatus === 'OVER') gameStatusStr = 'over';
    else if (gameStatus === 'WAITING_FOR_PLAYERS') gameStatusStr = 'waiting for players to join';
    gameStatusText = (
      <b>
        Game {gameStatusStr}. {joinGameButton}
      </b>
    );
  }
  return (
    <>
      {gameStatusText}
      <List aria-label='list of players in the game'>
        <ListItem style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>Black: {black?.userName || '(No player yet!)'}</div>
          <div style={{ paddingRight: '35px' }}>{formatTime(blackTime)}</div>
        </ListItem>
        <ListItem style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>White: {white?.userName || '(No player yet!)'}</div>
          <div style={{ paddingRight: '35px' }}>{formatTime(whiteTime)}</div>
        </ListItem>
      </List>
      <ShogiBoard gameAreaController={gameAreaController} />
    </>
  );
}
