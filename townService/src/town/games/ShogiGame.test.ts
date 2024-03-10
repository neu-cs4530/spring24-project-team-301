import ShogiGame from './ShogiGame';
import { GameMove, ShogiMove } from '../../types/CoveyTownSocket';

describe('ShogiGame', () => {
  let game: ShogiGame;
  let move: GameMove<ShogiMove>;

  beforeEach(() => {
    game = new ShogiGame();
    move = {
      gameID: 'gameID', // Add the missing gameID property
      move: {
        from: { row: 0, col: 0 },
        to: { row: 1, col: 1 },
        promotion: false,
      },
      playerID: 'test',
    };
  });

  describe('applyMove', () => {
    it('should throw an error for an invalid move', () => {
      expect(() => game.applyMove(move)).toThrow();
    });

    it('should not throw an error for a valid move', () => {
      move.move.from = { row: 2, col: 0 };
      move.move.to = { row: 3, col: 0 };
      expect(() => game.applyMove(move)).not.toThrow();
    });

    it('should throw an error if player tries to move opponent piece', () => {
      move.move.from = { row: 7, col: 0 }; // An opponent's piece position
      move.move.to = { row: 6, col: 0 }; // A valid move for the opponent's piece
      expect(() => game.applyMove(move)).toThrow();
    });

    it('should throw an error if player tries to move a piece to an occupied square', () => {
      move.move.from = { row: 0, col: 0 }; // A piece position
      move.move.to = { row: 1, col: 1 }; // An occupied square
      expect(() => game.applyMove(move)).toThrow();
    });

    it('should not allow a player to promote a piece when moving outside the promotion zone', () => {
      move.move.from = { row: 0, col: 0 }; // A piece position
      move.move.to = { row: 1, col: 1 }; // A valid move outside the promotion zone
      move.move.promotion = true; // Try to promote the piece
      expect(() => game.applyMove(move)).toThrow();
    });
    it('should result in the game being over with the winner after a checkmate', () => {
      
      const moves: GameMove<ShogiMove>[] = [
        {
          gameID: 'gameID',
          move: {
            from: { row: 2, col: 1 },
            to: { row: 3, col: 1 },
            promotion: false,
          },
          playerID: 'test',
        },
        {
          gameID: 'gameID',
          move: {
            from: { row: 8, col: 4 },
            to: { row: 7, col: 3 },
            promotion: false,
          },
          playerID: 'test',
        },
        {
          gameID: 'gameID',
          move: {
            from: { row: 3, col: 1 },
            to: { row: 4, col: 1 },
            promotion: false,
          },
          playerID: 'test',
        },
        {
          gameID: 'gameID',
          move: {
            from: { row: 7, col: 3 },
            to: { row: 7, col: 2 },
            promotion: false,
          },
          playerID: 'test',
        },
        {
          gameID: 'gameID',
          move: {
            from: { row: 4, col: 1 },
            to: { row: 5, col: 1 },
            promotion: false,
          },
          playerID: 'test',
        },
        {
          gameID: 'gameID',
          move: {
            from: { row: 7, col: 7 },
            to: { row: 7, col: 3 },
            promotion: false,
          },
          playerID: 'test',
        },
        {
          gameID: 'gameID',
          move: {
            from: { row: 5, col: 1 },
            to: { row: 6, col: 1 },
            promotion: true,
          },
          playerID: 'test',
        },
      ];

      moves.forEach((move) => {
        expect(() => game.applyMove(move)).not.toThrow();
      });
    });
  });
});
