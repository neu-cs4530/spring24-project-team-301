import ShogiGame from './ShogiGame';
import { GameMove, ShogiMove } from '../../types/CoveyTownSocket';
import { createPlayerForTesting } from '../../TestUtils';
import {
  BOARD_POSITION_NOT_VALID_MESSAGE,
  GAME_FULL_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  GAME_NOT_STARTABLE_MESSAGE,
  MOVE_NOT_YOUR_TURN_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../lib/InvalidParametersError';

describe('ShogiGame', () => {
  let game: ShogiGame;

  beforeEach(() => {
    game = new ShogiGame();
  });
  describe('_join', () => {
    it('should throw an error if the player is already in the game', () => {
      const player = createPlayerForTesting();
      game.join(player);
      expect(() => game.join(player)).toThrowError(PLAYER_ALREADY_IN_GAME_MESSAGE);
      const player2 = createPlayerForTesting();
      game.join(player2);
      expect(() => game.join(player2)).toThrowError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    });
    it('should throw an error if the player is not in the game and the game is full', () => {
      const player1 = createPlayerForTesting();
      const player2 = createPlayerForTesting();
      const player3 = createPlayerForTesting();
      game.join(player1);
      game.join(player2);

      expect(() => game.join(player3)).toThrowError(GAME_FULL_MESSAGE);
    });
    // Tests above are provided
    describe('if the player is not in the game and the game is not full', () => {
      it('should add the player as black if black is empty', () => {
        const black = createPlayerForTesting();
        game.join(black);
        expect(game.state.black).toBe(black.id);
        expect(game.state.white).toBeUndefined();
        expect(game.state.blackReady).toBeFalsy();
        expect(game.state.whiteReady).toBeFalsy();
        expect(game.state.status).toBe('WAITING_FOR_PLAYERS');
      });
      it('should add the player as white if black is present', () => {
        const black = createPlayerForTesting();
        const white = createPlayerForTesting();
        game.join(black);
        expect(game.state.status).toBe('WAITING_FOR_PLAYERS');
        game.join(white);
        expect(game.state.black).toBe(black.id);
        expect(game.state.white).toBe(white.id);
        expect(game.state.blackReady).toBeFalsy();
        expect(game.state.whiteReady).toBeFalsy();
        expect(game.state.status).toBe('WAITING_TO_START');
      });
    });
    it('should set the status to WAITING_TO_START if both players are present', () => {
      const black = createPlayerForTesting();
      const white = createPlayerForTesting();
      game.join(black);
      game.join(white);
      expect(game.state.status).toBe('WAITING_TO_START');
      expect(game.state.blackReady).toBeFalsy();
      expect(game.state.whiteReady).toBeFalsy();
    });
  });
  describe('_startGame', () => {
    test('if the status is not WAITING_TO_START, it throws an error', () => {
      const player = createPlayerForTesting();
      game.join(player);
      expect(() => game.startGame(player)).toThrowError(GAME_NOT_STARTABLE_MESSAGE);
    });
    test('if the player is not in the game, it throws an error', () => {
      game.join(createPlayerForTesting());
      game.join(createPlayerForTesting());
      expect(() => game.startGame(createPlayerForTesting())).toThrowError(
        PLAYER_NOT_IN_GAME_MESSAGE,
      );
    });
    describe('if the player is in the game', () => {
      const black = createPlayerForTesting();
      const white = createPlayerForTesting();
      beforeEach(() => {
        game.join(black);
        game.join(white);
      });
      test('if the player is black, it sets blackReady to true', () => {
        game.startGame(black);
        expect(game.state.blackReady).toBe(true);
        expect(game.state.whiteReady).toBeFalsy();
        expect(game.state.status).toBe('WAITING_TO_START');
      });
      test('if the player is white, it sets whiteReady to true', () => {
        game.startGame(white);
        expect(game.state.blackReady).toBeFalsy();
        expect(game.state.whiteReady).toBe(true);
        expect(game.state.status).toBe('WAITING_TO_START');
      });
      test('if both players are ready, it sets the status to IN_PROGRESS', () => {
        game.startGame(black);
        game.startGame(white);
        expect(game.state.blackReady).toBe(true);
        expect(game.state.whiteReady).toBe(true);
        expect(game.state.status).toBe('IN_PROGRESS');
      });
      test('if a player already reported ready, it does not change the status or throw an error', () => {
        game.startGame(black);
        game.startGame(black);
        expect(game.state.blackReady).toBe(true);
        expect(game.state.whiteReady).toBeFalsy();
        expect(game.state.status).toBe('WAITING_TO_START');
      });
    });
  });
  describe('_leave', () => {
    it('should throw an error if the player is not in the game', () => {
      const player = createPlayerForTesting();
      expect(() => game.leave(player)).toThrowError(PLAYER_NOT_IN_GAME_MESSAGE);
      game.join(player);
      expect(() => game.leave(createPlayerForTesting())).toThrowError(PLAYER_NOT_IN_GAME_MESSAGE);
    });
    describe('when the player is in the game', () => {
      describe('when the game is in progress', () => {
        test('if the player is black, it sets the winner to white and status to OVER', () => {
          const black = createPlayerForTesting();
          const white = createPlayerForTesting();
          game.join(black);
          game.join(white);
          game.startGame(black);
          game.startGame(white);
          game.leave(black);
          expect(game.state.winner).toBe(white.id);
          expect(game.state.status).toBe('OVER');
        });
        test('if the player is white, it sets the winner to black and status to OVER', () => {
          const black = createPlayerForTesting();
          const white = createPlayerForTesting();
          game.join(black);
          game.join(white);
          game.startGame(black);
          game.startGame(white);
          game.leave(white);
          expect(game.state.winner).toBe(black.id);
          expect(game.state.status).toBe('OVER');
        });
      });
      test('when the game is already over before the player leaves, it does not update the state', () => {
        const black = createPlayerForTesting();
        const white = createPlayerForTesting();
        game.join(black);
        game.join(white);
        game.startGame(black);
        game.startGame(white);
        expect(game.state.white).toBe(white.id);
        expect(game.state.black).toBe(black.id);
        game.leave(black);
        expect(game.state.status).toBe('OVER');
        const stateBeforeLeaving = { ...game.state };
        game.leave(white);
        expect(game.state).toEqual(stateBeforeLeaving);
      });
      describe('when the game is waiting to start, with status WAITING_TO_START', () => {
        test('if the player is black, it sets black to undefined and status to WAITING_FOR_PLAYERS', () => {
          const black = createPlayerForTesting();
          const white = createPlayerForTesting();
          game.join(black);
          expect(game.state.blackReady).toBeFalsy();
          game.join(white);
          game.startGame(black);
          expect(game.state.blackReady).toBeTruthy();
          game.leave(black);
          expect(game.state.blackReady).toBeFalsy();
          expect(game.state.black).toBeUndefined();
          expect(game.state.status).toBe('WAITING_FOR_PLAYERS');
        });
        test('if the player is white, it sets white to undefined and status to WAITING_FOR_PLAYERS', () => {
          const black = createPlayerForTesting();
          const white = createPlayerForTesting();
          game.join(black);
          game.join(white);
          expect(game.state.whiteReady).toBeFalsy();
          game.startGame(white);
          expect(game.state.whiteReady).toBeTruthy();
          game.leave(white);
          expect(game.state.whiteReady).toBeFalsy();
          expect(game.state.white).toBeUndefined();
          expect(game.state.status).toBe('WAITING_FOR_PLAYERS');
        });
      });
      describe('when the game is waiting for players, in state WAITING_FOR_PLAYERS', () => {
        test('if the player is black, it sets black to undefined, blackReady to false and status remains WAITING_FOR_PLAYERS', () => {
          const black = createPlayerForTesting();
          game.join(black);
          expect(game.state.status).toBe('WAITING_FOR_PLAYERS');
          game.leave(black);
          expect(game.state.black).toBeUndefined();
          expect(game.state.blackReady).toBeFalsy();
          expect(game.state.status).toBe('WAITING_FOR_PLAYERS');
        });
      });
    });
  });

  describe('applyMove', () => {
    const player1 = createPlayerForTesting();
    const player2 = createPlayerForTesting();

    beforeEach(() => {
      game = new ShogiGame();
      game.join(player1);
      game.join(player2);
      game.startGame(player1);
      game.startGame(player2);
    });
    it('should add the move to the game state and not end the game', () => {
      expect(() =>
        game.applyMove({
          gameID: game.id,
          move: {
            from: { row: 6, col: 7 },
            to: { row: 5, col: 7 },
            promotion: false,
          },
          playerID: player1.id,
        }),
      ).not.toThrow();
      expect(game.state.sfen).toEqual(
        'lnsgkgsnl/1r5b1/ppppppppp/9/9/7P1/PPPPPPP1P/1B5R1/LNSGKGSNL',
      );
      expect(game.state.status).toEqual('IN_PROGRESS');
    });
    it('should throw an error when attempting an invalid move', () => {
      expect(() =>
        game.applyMove({
          gameID: game.id,
          move: {
            from: { row: 6, col: 7 },
            to: { row: 5, col: 6 },
            promotion: false,
          },
          playerID: player1.id,
        }),
      ).toThrow(BOARD_POSITION_NOT_VALID_MESSAGE);
    });

    it('when given a move that does not win the game, it does not end it', () => {
      const moves: GameMove<ShogiMove>[] = [
        {
          gameID: game.id,
          move: {
            from: { row: 6, col: 7 },
            to: { row: 5, col: 7 },
            promotion: false,
          },
          playerID: player1.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 0, col: 4 },
            to: { row: 1, col: 5 },
            promotion: false,
          },
          playerID: player2.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 5, col: 7 },
            to: { row: 4, col: 7 },
            promotion: false,
          },
          playerID: player1.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 1, col: 5 },
            to: { row: 1, col: 6 },
            promotion: false,
          },
          playerID: player2.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 4, col: 7 },
            to: { row: 3, col: 7 },
            promotion: false,
          },
          playerID: player1.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 1, col: 1 },
            to: { row: 1, col: 5 },
            promotion: false,
          },
          playerID: player2.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 7, col: 7 },
            to: { row: 7, col: 6 },
            promotion: false,
          },
          playerID: player1.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 2, col: 4 },
            to: { row: 3, col: 4 },
            promotion: false,
          },
          playerID: player2.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 3, col: 7 },
            to: { row: 2, col: 7 },
            promotion: true,
          },
          playerID: player1.id,
        },
      ];
      moves.forEach(m => {
        expect(() => game.applyMove(m)).not.toThrow();
        expect(game.state.status).toEqual('IN_PROGRESS');
      });
      expect(game.state.sfen).toEqual(
        'lnsg1gsnl/5rkb1/pppp1pp+Pp/4p4/9/9/PPPPPPP1P/1B4R2/LNSGKGSNL',
      );
      expect(game.state.status).toEqual('IN_PROGRESS');
      expect(game.state.winner).toBeUndefined();
    });
    it('should result in the game being over with the winner after a checkmate', () => {
      const moves: GameMove<ShogiMove>[] = [
        {
          gameID: game.id,
          move: {
            from: { row: 6, col: 7 },
            to: { row: 5, col: 7 },
            promotion: false,
          },
          playerID: player1.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 0, col: 4 },
            to: { row: 1, col: 5 },
            promotion: false,
          },
          playerID: player2.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 5, col: 7 },
            to: { row: 4, col: 7 },
            promotion: false,
          },
          playerID: player1.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 1, col: 5 },
            to: { row: 1, col: 6 },
            promotion: false,
          },
          playerID: player2.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 4, col: 7 },
            to: { row: 3, col: 7 },
            promotion: false,
          },
          playerID: player1.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 1, col: 1 },
            to: { row: 1, col: 5 },
            promotion: false,
          },
          playerID: player2.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 3, col: 7 },
            to: { row: 2, col: 7 },
            promotion: true,
          },
          playerID: player1.id,
        },
      ];
      moves.forEach(m => {
        expect(game.state.status).toEqual('IN_PROGRESS');
        expect(() => game.applyMove(m)).not.toThrow();
      });
      expect(game.state.status).toEqual('OVER');
      expect(game.state.winner).toEqual(player1.id);
    });
    it('should reflect when a promotion is done', () => {
      const moves: GameMove<ShogiMove>[] = [
        {
          gameID: game.id,
          move: {
            from: { row: 6, col: 7 },
            to: { row: 5, col: 7 },
            promotion: false,
          },
          playerID: player1.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 0, col: 4 },
            to: { row: 1, col: 5 },
            promotion: false,
          },
          playerID: player2.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 5, col: 7 },
            to: { row: 4, col: 7 },
            promotion: false,
          },
          playerID: player1.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 1, col: 5 },
            to: { row: 1, col: 6 },
            promotion: false,
          },
          playerID: player2.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 4, col: 7 },
            to: { row: 3, col: 7 },
            promotion: false,
          },
          playerID: player1.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 1, col: 1 },
            to: { row: 1, col: 5 },
            promotion: false,
          },
          playerID: player2.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 3, col: 7 },
            to: { row: 2, col: 7 },
            promotion: true,
          },
          playerID: player1.id,
        },
      ];
      moves.forEach(m => {
        expect(game.state.status).toEqual('IN_PROGRESS');
        expect(() => game.applyMove(m)).not.toThrow();
      });
      expect(game.state.sfen).toEqual('lnsg1gsnl/5rkb1/ppppppp+Pp/9/9/9/PPPPPPP1P/1B5R1/LNSGKGSNL');
    });
    it('when given an invalid promotion move, it throws an error', () => {
      expect(() =>
        game.applyMove({
          gameID: game.id,
          move: {
            from: { row: 6, col: 7 },
            to: { row: 5, col: 7 },
            promotion: true,
          },
          playerID: player1.id,
        }),
      ).toThrowError(BOARD_POSITION_NOT_VALID_MESSAGE);
    });
    it('when given a move that does not win the game, it does not end it from the other side', () => {
      const moves: GameMove<ShogiMove>[] = [
        {
          gameID: game.id,
          move: {
            from: { row: 6, col: 4 },
            to: { row: 5, col: 4 },
            promotion: false,
          },
          playerID: player1.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 2, col: 1 },
            to: { row: 3, col: 1 },
            promotion: false,
          },
          playerID: player2.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 8, col: 4 },
            to: { row: 7, col: 3 },
            promotion: false,
          },
          playerID: player1.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 3, col: 1 },
            to: { row: 4, col: 1 },
            promotion: false,
          },
          playerID: player2.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 7, col: 3 },
            to: { row: 7, col: 2 },
            promotion: false,
          },
          playerID: player1.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 4, col: 1 },
            to: { row: 5, col: 1 },
            promotion: false,
          },
          playerID: player2.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 7, col: 7 },
            to: { row: 7, col: 3 },
            promotion: false,
          },
          playerID: player1.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 1, col: 1 },
            to: { row: 1, col: 2 },
            promotion: false,
          },
          playerID: player2.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 5, col: 4 },
            to: { row: 4, col: 4 },
            promotion: false,
          },
          playerID: player1.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 5, col: 1 },
            to: { row: 6, col: 1 },
            promotion: true,
          },
          playerID: player2.id,
        },
      ];
      moves.forEach(m => {
        expect(() => game.applyMove(m)).not.toThrow();
        expect(game.state.status).toEqual('IN_PROGRESS');
      });
      expect(game.state.sfen).toEqual(
        'lnsgkgsnl/2r4b1/p1ppppppp/9/4P4/9/P+pPP1PPPP/1BKR5/LNSG1GSNL',
      );
      expect(game.state.status).toEqual('IN_PROGRESS');
      expect(game.state.winner).toBeUndefined();
    });
    it('should result in the game being over with the winner after a checkmate', () => {
      const moves: GameMove<ShogiMove>[] = [
        {
          gameID: game.id,
          move: {
            from: { row: 6, col: 4 },
            to: { row: 5, col: 4 },
            promotion: false,
          },
          playerID: player1.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 2, col: 1 },
            to: { row: 3, col: 1 },
            promotion: false,
          },
          playerID: player2.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 8, col: 4 },
            to: { row: 7, col: 3 },
            promotion: false,
          },
          playerID: player1.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 3, col: 1 },
            to: { row: 4, col: 1 },
            promotion: false,
          },
          playerID: player2.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 7, col: 3 },
            to: { row: 7, col: 2 },
            promotion: false,
          },
          playerID: player1.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 4, col: 1 },
            to: { row: 5, col: 1 },
            promotion: false,
          },
          playerID: player2.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 7, col: 7 },
            to: { row: 7, col: 3 },
            promotion: false,
          },
          playerID: player1.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 5, col: 1 },
            to: { row: 6, col: 1 },
            promotion: true,
          },
          playerID: player2.id,
        },
      ];
      moves.forEach(m => {
        expect(game.state.status).toEqual('IN_PROGRESS');
        expect(() => game.applyMove(m)).not.toThrow();
      });
      expect(game.state.status).toEqual('OVER');
      expect(game.state.winner).toEqual(player2.id);
    });

    it('should allow for a drop move', () => {
      const moves: GameMove<ShogiMove>[] = [
        {
          gameID: game.id,
          move: {
            from: { row: 6, col: 7 },
            to: { row: 5, col: 7 },
            promotion: false,
          },
          playerID: player1.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 2, col: 7 },
            to: { row: 3, col: 7 },
            promotion: false,
          },
          playerID: player2.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 5, col: 7 },
            to: { row: 4, col: 7 },
            promotion: false,
          },
          playerID: player1.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 3, col: 7 },
            to: { row: 4, col: 7 },
            promotion: false,
          },
          playerID: player2.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 7, col: 7 },
            to: { row: 4, col: 7 },
            promotion: false,
          },
          playerID: player1.id,
        },
        {
          gameID: game.id,
          move: {
            from: { row: 0, col: 0 },
            to: { row: 2, col: 7 },
            drop: 'P',
            promotion: false,
          },
          playerID: player2.id,
        },
      ];
      moves.forEach(m => {
        expect(game.state.status).toEqual('IN_PROGRESS');
        expect(() => game.applyMove(m)).not.toThrow();
      });
    });
    it('should not allow for an invalid drop move', () => {
      expect(() =>
        game.applyMove({
          gameID: game.id,
          move: {
            from: { row: 6, col: 7 },
            to: { row: 5, col: 7 },
            promotion: false,
            drop: 'P',
          },
          playerID: player1.id,
        }),
      ).toThrowError(BOARD_POSITION_NOT_VALID_MESSAGE);
    });
    describe('when given an invalid move request', () => {
      it('throws an error if the game is not in progress', () => {
        game = new ShogiGame();
        const player = createPlayerForTesting();
        game.join(player);
        expect(() =>
          game.applyMove({
            gameID: game.id,
            playerID: player.id,
            move: {
              from: { row: 6, col: 4 },
              to: { row: 5, col: 4 },
              promotion: false,
            },
          }),
        ).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
      });
      describe('when the game is in progress', () => {
        const black = createPlayerForTesting();
        const white = createPlayerForTesting();
        beforeEach(() => {
          game = new ShogiGame();
          game.join(black);
          game.join(white);
          game.startGame(black);
          game.startGame(white);
        });
        it('should throw an error if the player is not in the game', () => {
          const otherPlayer = createPlayerForTesting();
          expect(() =>
            game.applyMove({
              gameID: game.id,
              playerID: otherPlayer.id,
              move: {
                from: { row: 6, col: 4 },
                to: { row: 5, col: 4 },
                promotion: false,
              },
            }),
          ).toThrowError(PLAYER_NOT_IN_GAME_MESSAGE);
        });
        describe('when the player is in the game', () => {
          it('should throw an error if the player is not the active player', () => {
            // Test with Black as first player
            expect(() =>
              game.applyMove({
                gameID: game.id,
                playerID: white.id,
                move: {
                  from: { row: 6, col: 4 },
                  to: { row: 5, col: 4 },
                  promotion: false,
                },
              }),
            ).toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);
          });
          it('should not change the game state', () => {
            expect(game.state.numMoves).toBe(0);
            expect(game.state.sfen).toEqual(
              'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL',
            );
            expect(() =>
              game.applyMove({
                gameID: game.id,
                playerID: black.id,
                move: {
                  from: { row: 7, col: 4 },
                  to: { row: 5, col: 4 },
                  promotion: false,
                },
              }),
            ).toThrowError(BOARD_POSITION_NOT_VALID_MESSAGE);
            expect(game.state.numMoves).toBe(0);
            expect(game.state.sfen).toEqual(
              'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL',
            );
            game.applyMove({
              gameID: game.id,
              playerID: black.id,
              move: {
                from: { row: 6, col: 4 },
                to: { row: 5, col: 4 },
                promotion: false,
              },
            });
            expect(game.state.numMoves).toBe(1);
            expect(game.state.sfen).toEqual(
              'lnsgkgsnl/1r5b1/ppppppppp/9/9/4P4/PPPP1PPPP/1B5R1/LNSGKGSNL',
            );
          });
        });
      });
    });
  });
});
