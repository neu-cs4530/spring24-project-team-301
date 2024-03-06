import Player from '../../lib/Player';
import { GameMove, ShogiGameState, ShogiMove } from '../../types/CoveyTownSocket';
import Game from './Game';

/**
 * A ConnectFourGame is a Game that implements the rules of Connect Four.
 * @see https://en.wikipedia.org/wiki/Connect_Four
 */
export default class ShogiGame extends Game<ShogiGameState, ShogiMove> {
  public constructor() {
    super({
      sfen: 'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL',
      firstPlayer: 'black',
      status: 'WAITING_TO_START',
    });
  }

  /**
   * Translates sfen to a 2D array
   */
  private get _board() {
    const { sfen } = this.state;
    const ranks = sfen.split(' ')[0].split('/');
    const board = new Array(9).fill(' ').map(() => new Array(9).fill(' '));

    for (let i = 0; i < ranks.length; i++) {
      const rank = ranks[i];
      let file = 0;
      for (let j = 0; j < rank.length; j++) {
        const char = rank[j];
        if (Number.isNaN(parseInt(char, 10))) {
          board[i][file] = char;
          file++;
        } else {
          file += parseInt(char, 10);
        }
      }
    }
    return board;
  }

  /**
   * Translates a 2D array to sfen
   */
  private _boardToSfen(board: string[][]): string {
    let sfen = '';
    for (let i = 0; i < board.length; i++) {
      let rank = '';
      let empty = 0;
      for (let j = 0; j < board[i].length; j++) {
        const char = board[i][j];
        if (char === ' ') {
          empty++;
        } else {
          if (empty > 0) {
            rank += empty;
            empty = 0;
          }
          rank += char;
        }
      }
      if (empty > 0) {
        rank += empty;
      }
      sfen += rank;
      if (i < board.length - 1) {
        sfen += '/';
      }
    }
    return sfen;
  }

  protected validateMove(move: GameMove<ShogiMove>): boolean {
    const {
      move: { from, to },
    } = move;
    const board = this._board;
    const piece = board[from.row][from.col];
    if (piece === ' ') {
      return false;
    }
    if (piece === 'P') {
      if (from.row - 1 === to.row && from.col === to.col) {
        return true;
      }
      return false;
    }
    if (piece === 'p') {
      if (from.row + 1 === to.row && from.col === to.col) {
        return true;
      }
      return false;
    }
    if (piece === 'L') {
      if (from.col === to.col && from.row < to.row) {
        for (let i = from.row - 1; i > to.row; i--) {
          if (board[i][from.col] !== ' ') {
            return false;
          }
        }
        return true;
      }
      return false;
    }
    if (piece === 'l') {
      if (from.col === to.col && from.row > to.row) {
        for (let i = from.row + 1; i < to.row; i++) {
          if (board[i][from.col] !== ' ') {
            return false;
          }
        }
        return true;
      }
      return false;
    }
    if (piece === 'N') {
      if (from.col + 1 === to.col && from.row === to.row - 2) {
        return true;
      }
      if (from.col - 1 === to.col && from.row === to.row - 2) {
        return true;
      }
      return false;
    }
    if (piece === 'n') {
      if (from.col + 1 === to.col && from.row === to.row + 2) {
        return true;
      }
      if (from.col - 1 === to.col && from.row === to.row + 2) {
        return true;
      }
      return false;
    }
    if (piece === 'S') {
      if (from.col === to.col && from.row === to.row - 1) {
        return true;
      }
      if (from.col === to.col + 1 && from.row === to.row - 1) {
        return true;
      }
      if (from.col === to.col - 1 && from.row === to.row - 1) {
        return true;
      }
      if (from.col === to.col + 1 && from.row === to.row + 1) {
        return true;
      }
      if (from.col === to.col - 1 && from.row === to.row + 1) {
        return true;
      }
      return false;
    }
    if (piece === 's') {
      if (from.col === to.col && from.row === to.row + 1) {
        return true;
      }
      if (from.col === to.col + 1 && from.row === to.row - 1) {
        return true;
      }
      if (from.col === to.col - 1 && from.row === to.row - 1) {
        return true;
      }
      if (from.col === to.col + 1 && from.row === to.row + 1) {
        return true;
      }
      if (from.col === to.col - 1 && from.row === to.row + 1) {
        return true;
      }
      return false;
    }
    if (piece === 'G') {
      if (from.col === to.col && from.row === to.row - 1) {
        return true;
      }
      if (from.col === to.col + 1 && from.row === to.row - 1) {
        return true;
      }
      if (from.col === to.col - 1 && from.row === to.row - 1) {
        return true;
      }
      if (from.col === to.col + 1 && from.row === to.row) {
        return true;
      }
      if (from.col === to.col - 1 && from.row === to.row) {
        return true;
      }
      if (from.col === to.col && from.row === to.row + 1) {
        return true;
      }
      return false;
    }
    if (piece === 'g') {
      if (from.col === to.col && from.row === to.row - 1) {
        return true;
      }
      if (from.col === to.col + 1 && from.row === to.row + 1) {
        return true;
      }
      if (from.col === to.col - 1 && from.row === to.row + 1) {
        return true;
      }
      if (from.col === to.col + 1 && from.row === to.row) {
        return true;
      }
      if (from.col === to.col - 1 && from.row === to.row) {
        return true;
      }
      if (from.col === to.col && from.row === to.row + 1) {
        return true;
      }
      return false;
    }
    if (piece === 'B') {
      if (Math.abs(from.row - to.row) === Math.abs(from.col - to.col)) {
        const rowDirection = from.row < to.row ? 1 : -1;
        const colDirection = from.col < to.col ? 1 : -1;
        for (let i = 1; i < Math.abs(from.row - to.row); i++) {
          if (board[from.row + i * rowDirection][from.col + i * colDirection] !== ' ') {
            return false;
          }
        }
        return true;
      }
      return false;
    }
    if (piece === 'b') {
      if (Math.abs(from.row - to.row) === Math.abs(from.col - to.col)) {
        const rowDirection = from.row < to.row ? 1 : -1;
        const colDirection = from.col < to.col ? 1 : -1;
        for (let i = 1; i < Math.abs(from.row - to.row); i++) {
          if (board[from.row + i * rowDirection][from.col + i * colDirection] !== ' ') {
            return false;
          }
        }
        return true;
      }
      return false;
    }
    if (piece === 'R') {
      if (from.row === to.row) {
        const direction = from.col < to.col ? 1 : -1;
        for (let i = from.col + direction; i !== to.col; i += direction) {
          if (board[from.row][i] !== ' ') {
            return false;
          }
        }
        return true;
      }
      if (from.col === to.col) {
        const direction = from.row < to.row ? 1 : -1;
        for (let i = from.row + direction; i !== to.row; i += direction) {
          if (board[i][from.col] !== ' ') {
            return false;
          }
        }
        return true;
      }
      return false;
    }
    if (piece === 'r') {
      if (from.row === to.row) {
        const direction = from.col < to.col ? 1 : -1;
        for (let i = from.col + direction; i !== to.col; i += direction) {
          if (board[from.row][i] !== ' ') {
            return false;
          }
        }
        return true;
      }
      if (from.col === to.col) {
        const direction = from.row < to.row ? 1 : -1;
        for (let i = from.row + direction; i !== to.row; i += direction) {
          if (board[i][from.col] !== ' ') {
            return false;
          }
        }
        return true;
      }
      return false;
    }
    if (piece === 'K') {
      if (Math.abs(from.row - to.row) <= 1 && Math.abs(from.col - to.col) <= 1) {
        return true;
      }
      return false;
    }
    if (piece === 'k') {
      if (Math.abs(from.row - to.row) <= 1 && Math.abs(from.col - to.col) <= 1) {
        return true;
      }
      return false;
    }
    return true;
  }

  /**
   * Applies a move to the game state
   * @param move The move to apply to the game state
   */
  public applyMove(move: GameMove<ShogiMove>): void {
    const {
      move: { from, to },
    } = move;
    const board = this._board;
    const piece = board[from.row][from.col];
    board[from.row][from.col] = ' ';
    board[to.row][to.col] = piece;
    this.state = {
      ...this.state,
      sfen: this._boardToSfen(board),
      status: 'IN_PROGRESS',
    };
  }

  protected _join(player: Player): void {}

  protected _leave(player: Player): void {
    throw new Error('Method not implemented.');
  }
}
