import {
  Box,
  Button,
  Flex,
  Heading,
  List,
  ListItem,
  Popover,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  useToast,
} from '@chakra-ui/react';
import React, { useEffect, useMemo, useState } from 'react';
import ShogiAreaController from '../../../../classes/interactable/ShogiAreaController';
import PlayerController from '../../../../classes/PlayerController';
import { useInteractableAreaController } from '../../../../classes/TownController';
import useTownController from '../../../../hooks/useTownController';
import { EngineDepth, GameStatus, InteractableID } from '../../../../types/CoveyTownSocket';
import ShogiBoard from './ShogiBoard';
import axios from 'axios';
import ShogiLeaderboard from './ShogiLeaderboard';
import ChatChannel from '../ChatChannel';

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
  const [joinedGame, setJoinedGame] = useState(false);

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

  const [blackRecord, setBlackRecord] = useState({ wins: 0, losses: 0, draws: 0 });
  const [whiteRecord, setWhiteRecord] = useState({ wins: 0, losses: 0, draws: 0 });
  const [isLoadingBlackRecord, setIsLoadingBlackRecord] = useState(false);
  const [isLoadingWhiteRecord, setIsLoadingWhiteRecord] = useState(false);
  const [observers, setObservers] = useState<PlayerController[]>(gameAreaController.observers);

  useEffect(() => {
    const updateGameState = () => {
      setObservers(gameAreaController.observers);
    };
    gameAreaController.addListener('gameUpdated', updateGameState);
    return () => {
      gameAreaController.removeListener('gameUpdated', updateGameState);
    };
  }, [townController, gameAreaController]);

  const fetchRecords = async (email: string) => {
    try {
      const [resWins, resLosses, resDraws] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_TOWNS_SERVICE_URL}/wins?email=${email}`),
        axios.get(`${process.env.NEXT_PUBLIC_TOWNS_SERVICE_URL}/losses?email=${email}`),
        axios.get(`${process.env.NEXT_PUBLIC_TOWNS_SERVICE_URL}/draws?email=${email}`),
      ]);
      return {
        wins: resWins.data.wins,
        losses: resLosses.data.losses,
        draws: resDraws.data.draws,
      };
    } catch (error) {
      console.error('Error fetching records:', error);
      return { wins: 0, losses: 0, draws: 0 };
    }
  };
  const pop = useMemo(() => {
    return (
      <>
        <Popover placement='right-start' closeOnBlur={false}>
          <PopoverTrigger>
            <Box
              tabIndex={0}
              role='button'
              w='100%'
              h='50px'
              bg='gray.200'
              textAlign='center'
              border='solid'
              color='gray.800'
              borderBottom='none'>
              <Heading as='h5' verticalAlign='middle' lineHeight='normal'>
                Leaderboard
              </Heading>
            </Box>
          </PopoverTrigger>
          <PopoverContent
            w='600px'
            color='white'
            bg='blue.800'
            borderColor='blue.700'
            _focus={{ outline: 0 }}>
            <PopoverHeader pt={4} fontWeight='bold' border='0'>
              Leaderboard
            </PopoverHeader>
            <PopoverCloseButton />
            <PopoverBody>
              <ShogiLeaderboard />
            </PopoverBody>
          </PopoverContent>
        </Popover>
        <Popover placement='right-start' closeOnBlur={false}>
          <PopoverTrigger>
            <Box
              tabIndex={0}
              role='button'
              w='100%'
              h='50px'
              bg='gray.200'
              textAlign='center'
              border='solid'
              borderBottom='none'
              color='gray.800'>
              <Heading as='h5' verticalAlign='middle' lineHeight='normal'>
                Observers
              </Heading>
            </Box>
          </PopoverTrigger>
          <PopoverContent
            w='600px'
            color='white'
            bg='blue.500'
            borderColor='blue.500'
            _focus={{ outline: 0 }}>
            <PopoverHeader pt={4} fontWeight='bold' border='0'>
              Observers
            </PopoverHeader>
            <PopoverCloseButton />
            <PopoverBody>
              <List aria-label='list of observers in the game'>
                {observers.map(player => {
                  return <ListItem key={player.id}>{player.userName.split('@')[0]}</ListItem>;
                })}
              </List>
            </PopoverBody>
          </PopoverContent>
        </Popover>
        <Popover placement='right-start' closeOnBlur={false}>
          <PopoverTrigger>
            <Box
              tabIndex={0}
              role='button'
              w='100%'
              h='50px'
              bg='gray.200'
              textAlign='center'
              border='solid'
              color='gray.800'
              marginBottom='50px'>
              <Heading as='h5' verticalAlign='middle' lineHeight='normal'>
                Chat
              </Heading>
            </Box>
          </PopoverTrigger>
          <PopoverContent
            w='600px'
            color='white'
            bg='blue.300'
            borderColor='blue.300'
            _focus={{ outline: 0 }}>
            <PopoverHeader pt={4} fontWeight='bold' border='0'>
              Chat
            </PopoverHeader>
            <PopoverCloseButton />
            <PopoverBody color='gray.800'>
              <ChatChannel interactableID={gameAreaController.id} />
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </>
    );
  }, [observers, gameAreaController.id]);

  // black record updates
  useEffect(() => {
    const fetchAndUpdateBlackRecords = async () => {
      if (black) {
        setIsLoadingBlackRecord(true);
        const newBlackRecord = await fetchRecords(black.userName);
        setBlackRecord(newBlackRecord);
        setIsLoadingBlackRecord(false);
      }
    };

    fetchAndUpdateBlackRecords();
  }, [black]);

  // white record updates
  useEffect(() => {
    const fetchAndUpdateWhiteRecords = async () => {
      if (white) {
        setIsLoadingWhiteRecord(true);
        const newWhiteRecord = await fetchRecords(white.userName);
        setWhiteRecord(newWhiteRecord);
        setIsLoadingWhiteRecord(false);
      }
    };

    fetchAndUpdateWhiteRecords();
  }, [white]);

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
      const fetchAndUpdateRecords = async () => {
        if (black && white) {
          setIsLoadingBlackRecord(true);
          setIsLoadingWhiteRecord(true);
          const [newBlackRecord, newWhiteRecord] = await Promise.all([
            fetchRecords(black.userName),
            fetchRecords(white.userName),
          ]);
          setBlackRecord(newBlackRecord);
          setWhiteRecord(newWhiteRecord);

          setIsLoadingBlackRecord(false);
          setIsLoadingWhiteRecord(false);
        } else if (black) {
          setIsLoadingBlackRecord(true);
          const newBlackRecord = await fetchRecords(black.userName);
          setBlackRecord(newBlackRecord);
          setIsLoadingBlackRecord(false);
        } else if (white) {
          setIsLoadingWhiteRecord(true);
          const newWhiteRecord = await fetchRecords(white.userName);
          setWhiteRecord(newWhiteRecord);
          setIsLoadingWhiteRecord(false);
        }
      };
      if (townController.ourPlayer === black || townController.ourPlayer === white) {
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
          await fetchAndUpdateRecords();
        } else if (winner === townController.ourPlayer) {
          const title = black && white ? 'Game over' : 'Game over (opponent left)';
          toast({
            title,
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
          await fetchAndUpdateRecords();
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
          const res = await axios.put(`${process.env.NEXT_PUBLIC_TOWNS_SERVICE_URL}/lose`, body);
          console.log(res);
          if (res.status !== 200) {
            throw new Error('Failed to register loss');
          }
          console.log('Record updates successful');
          await fetchAndUpdateRecords();
        }
      } else {
        toast({
          title: 'Game over',
          description: winner ? `${winner.userName.split('@')[0]} won!` : 'Game ended in a draw',
          status: 'info',
        });
        await fetchAndUpdateRecords();
      }
    };
    gameAreaController.addListener('gameEnd', onGameEnd);
    return () => {
      gameAreaController.removeListener('gameUpdated', updateGameState);
      gameAreaController.removeListener('gameEnd', onGameEnd);
    };
  }, [townController, gameAreaController, toast, gameStatus, black, white]);
  let gameStatusText = <></>;
  if (gameStatus === 'IN_PROGRESS') {
    gameStatusText = (
      <>
        Game in progress, {moveCount} moves in, currently{' '}
        {gameAreaController.whoseTurn === townController.ourPlayer
          ? 'your'
          : gameAreaController.whoseTurn?.userName.split('@')[0] || 'CPU' + "'s"}{' '}
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
        color='gray.800'
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
          setJoinedGame(true);
        }}
        isLoading={joiningGame}
        disabled={joiningGame}>
        Join New Game
      </Button>
    );
    const startComputerGameButton = (
      <div>
        <Button
          color='gray.800'
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
          Start CPU Game
        </Button>
        <select
          onChange={event =>
            gameAreaController.setDifficulty(Number(event.target.value) as EngineDepth)
          }>
          <option value='0'>Beginner</option>
          <option value='1'>Moderate</option>
          <option value='2'>Advanced</option>
        </select>
      </div>
    );
    let gameStatusStr;
    if (gameStatus === 'OVER') gameStatusStr = 'over';
    else if (gameStatus === 'WAITING_FOR_PLAYERS') gameStatusStr = 'waiting for players to join';
    if (joinedGame) {
      gameStatusText = (
        <b>
          Game {gameStatusStr}. {startComputerGameButton}
        </b>
      );
    } else {
      gameStatusText = (
        <b>
          Game {gameStatusStr}. {joinGameButton}
        </b>
      );
    }
  }
  let blackTimer = '';
  let blackRecordText = '';
  let whiteTimer = '';
  let whiteRecordText = '';
  if (black) {
    blackRecordText =
      isLoadingBlackRecord && gameStatus !== 'OVER'
        ? '...'
        : `(${blackRecord.wins}-${blackRecord.losses}-${blackRecord.draws})`;
  }
  if (white) {
    whiteRecordText =
      isLoadingWhiteRecord && gameStatus !== 'OVER'
        ? '...'
        : `(${whiteRecord.wins}-${whiteRecord.losses}-${whiteRecord.draws})`;
  }
  if (gameStatus === 'WAITING_TO_START' || gameStatus === 'IN_PROGRESS') {
    blackTimer = formatTime(blackTime);
    whiteTimer = formatTime(whiteTime);
  }
  return (
    <>
      <Flex flexDirection='column' w='20%'>
        {pop}
        {gameStatusText}
        <List aria-label='list of players in the game'>
          <ListItem style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              Black:{' '}
              {black?.userName.split('@')[0] ||
                (gameAreaController.status === 'IN_PROGRESS' ? 'CPU' : '(waiting for player)')}
            </div>
            <div>{blackRecordText}</div>
            <div style={{ paddingRight: '35px' }}>{blackTimer}</div>
          </ListItem>
          <ListItem style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              White:{' '}
              {white?.userName.split('@')[0] ||
                (gameAreaController.status === 'IN_PROGRESS' ? 'CPU' : '(waiting for player)')}
            </div>
            <div>{whiteRecordText}</div>
            <div style={{ paddingRight: '35px' }}>{whiteTimer}</div>
          </ListItem>
        </List>
      </Flex>
      <ShogiBoard gameAreaController={gameAreaController} />
    </>
  );
}
