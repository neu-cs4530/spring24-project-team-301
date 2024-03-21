import { nanoid } from 'nanoid';
import { mock } from 'jest-mock-extended';
import Player from '../../lib/Player';
import {
  ShogiColor,
  ShogiGameState,
  ShogiMove,
  GameInstanceID,
  GameMove,
  TownEmitter,
} from '../../types/CoveyTownSocket';
import ShogiGame from './ShogiGame';
import ShogiGameArea from './ShogiGameArea';
import * as ShogiGameModule from './ShogiGame';
import Game from './Game';
import { createPlayerForTesting } from '../../TestUtils';
import {
  GAME_ID_MISSMATCH_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  INVALID_COMMAND_MESSAGE,
} from '../../lib/InvalidParametersError';

class TestingGame extends Game<ShogiGameState, ShogiMove> {
  public constructor(priorGame?: ShogiGame) {
    super({
      status: 'WAITING_TO_START',
      sfen: '',
      inhand: '',
      numMoves: 0,
      spectators: [],
    });
  }

  public applyMove(move: GameMove<ShogiMove>): void {}

  public endGame(winner?: string) {
    this.state = {
      ...this.state,
      status: 'OVER',
      winner,
    };
  }

  public startGame(player: Player) {
    if (this.state.black === player.id) this.state.blackReady = true;
    else this.state.whiteReady = true;
  }

  protected _join(player: Player): void {
    if (this.state.black) this.state.white = player.id;
    else this.state.black = player.id;
    this._players.push(player);
  }

  protected _leave(player: Player): void {}
}
describe('ShogiGameArea', () => {
  let gameArea: ShogiGameArea;
  let black: Player;
  let white: Player;
  let interactableUpdateSpy: jest.SpyInstance;
  const gameConstructorSpy = jest.spyOn(ShogiGameModule, 'default');
  let game: TestingGame;

  beforeEach(() => {
    gameConstructorSpy.mockClear();
    game = new TestingGame();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore (Testing without using the real game class)
    gameConstructorSpy.mockReturnValue(game);

    black = createPlayerForTesting();
    white = createPlayerForTesting();
    gameArea = new ShogiGameArea(
      nanoid(),
      { x: 0, y: 0, width: 100, height: 100 },
      mock<TownEmitter>(),
    );
    gameArea.add(black);
    game.join(black);
    gameArea.add(white);
    game.join(white);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore (Test requires access to protected method)
    interactableUpdateSpy = jest.spyOn(gameArea, '_emitAreaChanged');
  });
  describe('JoinGame command', () => {
    test('when there is no existing game, it should create a new game and call _emitAreaChanged', () => {
      expect(gameArea.game).toBeUndefined();
      const { gameID } = gameArea.handleCommand({ type: 'JoinGame' }, black);
      expect(gameArea.game).toBeDefined();
      expect(gameID).toEqual(game.id);
      expect(interactableUpdateSpy).toHaveBeenCalled();
    });
    test('when there is a game that just ended, it should create a new game and call _emitAreaChanged', () => {
      expect(gameArea.game).toBeUndefined();

      gameConstructorSpy.mockClear();
      const { gameID } = gameArea.handleCommand({ type: 'JoinGame' }, black);
      expect(gameArea.game).toBeDefined();
      expect(gameID).toEqual(game.id);
      expect(interactableUpdateSpy).toHaveBeenCalled();
      expect(gameConstructorSpy).toHaveBeenCalledTimes(1);
      game.endGame();

      gameConstructorSpy.mockClear();
      const { gameID: newGameID } = gameArea.handleCommand({ type: 'JoinGame' }, black);
      expect(gameArea.game).toBeDefined();
      expect(newGameID).toEqual(game.id);
      expect(interactableUpdateSpy).toHaveBeenCalled();
      expect(gameConstructorSpy).toHaveBeenCalledTimes(1);
    });
    describe('when there is a game in progress', () => {
      it('should call join on the game and call _emitAreaChanged', () => {
        const { gameID } = gameArea.handleCommand({ type: 'JoinGame' }, black);
        if (!game) {
          throw new Error('Game was not created by the first call to join');
        }
        expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);

        const joinSpy = jest.spyOn(game, 'join');
        const gameID2 = gameArea.handleCommand({ type: 'JoinGame' }, white).gameID;
        expect(joinSpy).toHaveBeenCalledWith(white);
        expect(gameID).toEqual(gameID2);
        expect(interactableUpdateSpy).toHaveBeenCalledTimes(2);
      });
      it('should not call _emitAreaChanged if the game throws an error', () => {
        gameArea.handleCommand({ type: 'JoinGame' }, black);
        if (!game) {
          throw new Error('Game was not created by the first call to join');
        }
        interactableUpdateSpy.mockClear();

        const joinSpy = jest.spyOn(game, 'join').mockImplementationOnce(() => {
          throw new Error('Test Error');
        });
        expect(() => gameArea.handleCommand({ type: 'JoinGame' }, white)).toThrowError(
          'Test Error',
        );
        expect(joinSpy).toHaveBeenCalledWith(white);
        expect(interactableUpdateSpy).not.toHaveBeenCalled();
      });
    });
  });
  describe('StartGame command', () => {
    it('when there is no game, it should throw an error and not call _emitAreaChanged', () => {
      expect(() =>
        gameArea.handleCommand({ type: 'StartGame', gameID: nanoid() }, black),
      ).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
    });
    describe('when there is a game in progress', () => {
      it('should call startGame on the game and call _emitAreaChanged', () => {
        const { gameID } = gameArea.handleCommand({ type: 'JoinGame' }, black);
        interactableUpdateSpy.mockClear();
        gameArea.handleCommand({ type: 'StartGame', gameID }, white);
        expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
      });
      it('should not call _emitAreaChanged if the game throws an error', () => {
        gameArea.handleCommand({ type: 'JoinGame' }, black);
        if (!game) {
          throw new Error('Game was not created by the first call to join');
        }
        interactableUpdateSpy.mockClear();

        const startSpy = jest.spyOn(game, 'startGame').mockImplementationOnce(() => {
          throw new Error('Test Error');
        });
        expect(() =>
          gameArea.handleCommand({ type: 'StartGame', gameID: game.id }, white),
        ).toThrowError('Test Error');
        expect(startSpy).toHaveBeenCalledWith(white);
        expect(interactableUpdateSpy).not.toHaveBeenCalled();
      });
      test('when the game ID mismatches, it should throw an error and not call _emitAreaChanged', () => {
        gameArea.handleCommand({ type: 'JoinGame' }, black);
        if (!game) {
          throw new Error('Game was not created by the first call to join');
        }
        expect(() =>
          gameArea.handleCommand({ type: 'StartGame', gameID: nanoid() }, black),
        ).toThrowError(GAME_ID_MISSMATCH_MESSAGE);
      });
    });
  });
  describe('GameMove command', () => {
    it('should throw an error if there is no game in progress and not call _emitAreaChanged', () => {
      interactableUpdateSpy.mockClear();

      expect(() =>
        gameArea.handleCommand(
          {
            type: 'GameMove',
            move: { from: { row: 0, col: 0 }, to: { row: 1, col: 0 } },
            gameID: nanoid(),
          },
          black,
        ),
      ).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
      expect(interactableUpdateSpy).not.toHaveBeenCalled();
    });
    describe('when there is a game in progress', () => {
      let gameID: GameInstanceID;
      beforeEach(() => {
        gameID = gameArea.handleCommand({ type: 'JoinGame' }, black).gameID;
        gameArea.handleCommand({ type: 'JoinGame' }, white);
        interactableUpdateSpy.mockClear();
      });
      it('should throw an error if the gameID does not match the game and not call _emitAreaChanged', () => {
        expect(() =>
          gameArea.handleCommand(
            {
              type: 'GameMove',
              move: { from: { row: 0, col: 0 }, to: { row: 1, col: 0 } },
              gameID: nanoid(),
            },
            black,
          ),
        ).toThrowError(GAME_ID_MISSMATCH_MESSAGE);
      });
      it('should call applyMove on the game and call _emitAreaChanged', () => {
        const move: ShogiMove = { from: { row: 0, col: 0 }, to: { row: 1, col: 0 } };
        const applyMoveSpy = jest.spyOn(game, 'applyMove');
        gameArea.handleCommand({ type: 'GameMove', move, gameID }, black);
        expect(applyMoveSpy).toHaveBeenCalledWith({
          gameID: game.id,
          playerID: black.id,
          move: {
            ...move,
          },
        });
        expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
      });
      it('should not call _emitAreaChanged if the game throws an error', () => {
        const move: ShogiMove = { from: { row: 0, col: 0 }, to: { row: 1, col: 0 } };
        const applyMoveSpy = jest.spyOn(game, 'applyMove');
        applyMoveSpy.mockImplementationOnce(() => {
          throw new Error('Test Error');
        });
        expect(() =>
          gameArea.handleCommand({ type: 'GameMove', move, gameID }, black),
        ).toThrowError('Test Error');
        expect(applyMoveSpy).toHaveBeenCalledWith({
          gameID: game.id,
          playerID: black.id,
          move: {
            ...move,
          },
        });
        expect(interactableUpdateSpy).not.toHaveBeenCalled();
      });
      describe('when the game ends', () => {
        test.each<ShogiColor>(['black', 'white'])(
          'when the game is won by %p',
          (winner: ShogiColor) => {
            const finalMove: ShogiMove = { from: { row: 0, col: 0 }, to: { row: 1, col: 0 } };
            jest.spyOn(game, 'applyMove').mockImplementationOnce(() => {
              game.endGame(winner === 'black' ? black.id : white.id);
            });
            gameArea.handleCommand({ type: 'GameMove', move: finalMove, gameID }, black);
            expect(game.state.status).toEqual('OVER');
            expect(gameArea.history.length).toEqual(1);
            const winningUsername = winner === 'black' ? black.userName : white.userName;
            const losingUsername = winner === 'black' ? white.userName : black.userName;
            expect(gameArea.history[0]).toEqual({
              gameID: game.id,
              scores: {
                [winningUsername]: 1,
                [losingUsername]: 0,
              },
            });
            expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
          },
        );
        test('when the game results in a tie', () => {
          const finalMove: ShogiMove = { from: { row: 0, col: 0 }, to: { row: 1, col: 0 } };
          jest.spyOn(game, 'applyMove').mockImplementationOnce(() => {
            game.endGame();
          });
          gameArea.handleCommand({ type: 'GameMove', move: finalMove, gameID }, black);
          expect(game.state.status).toEqual('OVER');
          expect(gameArea.history.length).toEqual(1);
          expect(gameArea.history[0]).toEqual({
            gameID: game.id,
            scores: {
              [black.userName]: 0,
              [white.userName]: 0,
            },
          });
          expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
        });
      });
    });
  });
  describe('LeaveGame command', () => {
    it('should throw an error if there is no game in progress and not call _emitAreaChanged', () => {
      expect(() =>
        gameArea.handleCommand({ type: 'LeaveGame', gameID: nanoid() }, black),
      ).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
      expect(interactableUpdateSpy).not.toHaveBeenCalled();
    });
    describe('when there is a game in progress', () => {
      it('should throw an error if the gameID does not match the game and not call _emitAreaChanged', () => {
        gameArea.handleCommand({ type: 'JoinGame' }, black);
        interactableUpdateSpy.mockClear();
        expect(() =>
          gameArea.handleCommand({ type: 'LeaveGame', gameID: nanoid() }, black),
        ).toThrowError(GAME_ID_MISSMATCH_MESSAGE);
        expect(interactableUpdateSpy).not.toHaveBeenCalled();
      });
      it('should call leave on the game and call _emitAreaChanged', () => {
        const { gameID } = gameArea.handleCommand({ type: 'JoinGame' }, black);
        if (!game) {
          throw new Error('Game was not created by the first call to join');
        }
        expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
        const leaveSpy = jest.spyOn(game, 'leave');
        gameArea.handleCommand({ type: 'LeaveGame', gameID }, black);
        expect(leaveSpy).toHaveBeenCalledWith(black);
        expect(interactableUpdateSpy).toHaveBeenCalledTimes(2);
      });
      it('should not call _emitAreaChanged if the game throws an error', () => {
        gameArea.handleCommand({ type: 'JoinGame' }, black);
        if (!game) {
          throw new Error('Game was not created by the first call to join');
        }
        interactableUpdateSpy.mockClear();
        const leaveSpy = jest.spyOn(game, 'leave').mockImplementationOnce(() => {
          throw new Error('Test Error');
        });
        expect(() =>
          gameArea.handleCommand({ type: 'LeaveGame', gameID: game.id }, black),
        ).toThrowError('Test Error');
        expect(leaveSpy).toHaveBeenCalledWith(black);
        expect(interactableUpdateSpy).not.toHaveBeenCalled();
      });
      test.each<ShogiColor>(['black', 'white'])(
        'when the game is won by %p, it updates the history',
        (playerThatWins: ShogiColor) => {
          const leavingPlayer = playerThatWins === 'black' ? white : black;
          const winningPlayer = playerThatWins === 'black' ? black : white;

          const { gameID } = gameArea.handleCommand({ type: 'JoinGame' }, black);
          gameArea.handleCommand({ type: 'JoinGame' }, white);

          interactableUpdateSpy.mockClear();

          jest.spyOn(game, 'leave').mockImplementationOnce(() => {
            game.endGame(winningPlayer.id);
          });
          gameArea.handleCommand({ type: 'LeaveGame', gameID }, leavingPlayer);
          expect(game.state.status).toEqual('OVER');
          expect(gameArea.history.length).toEqual(1);
          const winningUsername = winningPlayer.userName;
          const losingUsername = leavingPlayer.userName;

          expect(gameArea.history[0]).toEqual({
            gameID: game.id,
            scores: {
              [winningUsername]: 1,
              [losingUsername]: 0,
            },
          });
          expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
        },
      );
    });
  });
  test('throws error for invalid command', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore (Testing an invalid command, only possible at the boundary of the type system)
    expect(() => gameArea.handleCommand({ type: 'InvalidCommand' }, black)).toThrowError(
      INVALID_COMMAND_MESSAGE,
    );
    expect(interactableUpdateSpy).not.toHaveBeenCalled();
  });
});
