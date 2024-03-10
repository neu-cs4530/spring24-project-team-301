import { timeStamp } from 'console';
import InvalidParametersError, {
  BOARD_POSITION_NOT_VALID_MESSAGE,
  GAME_FULL_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  GAME_NOT_STARTABLE_MESSAGE,
  MOVE_NOT_YOUR_TURN_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import {
  GameMove,
  ShogiColor,
  ShogiGameState,
  ShogiIndex,
  ShogiMove,
} from '../../types/CoveyTownSocket';
import Game from './Game';

/**
 * A ShogiGame is a Game that implements the rules of Shogi.
 */
export default class ShogiGame extends Game<ShogiGameState, ShogiMove> {
  public constructor() {
    super({
      sfen: 'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL',
      inhand: '',
      status: 'WAITING_TO_START',
      numMoves: 0,
    });
  }

  /**
   * Indicates that a player is ready to start the game.
   *
   * Updates the game state to indicate that the player is ready to start the game.
   *
   * If both players are ready, the game will start.
   *
   * The first player (red or yellow) is determined as follows:
   *   - If neither player was in the last game in this area (or there was no prior game), the first player is red.
   *   - If at least one player was in the last game in this area, then the first player will be the other color from last game.
   *   - If a player from the last game *left* the game and then joined this one, they will be treated as a new player (not given the same color by preference).   *
   *
   * @throws InvalidParametersError if the player is not in the game (PLAYER_NOT_IN_GAME_MESSAGE)
   * @throws InvalidParametersError if the game is not in the WAITING_TO_START state (GAME_NOT_STARTABLE_MESSAGE)
   *
   * @param player The player who is ready to start the game
   */
  public startGame(player: Player): void {
    if (this.state.status !== 'WAITING_TO_START') {
      throw new InvalidParametersError(GAME_NOT_STARTABLE_MESSAGE);
    }
    if (this.state.black !== player.id && this.state.white !== player.id) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }
    if (this.state.black === player.id) {
      this.state.blackReady = true;
    }
    if (this.state.white === player.id) {
      this.state.whiteReady = true;
    }
    this.state = {
      ...this.state,
      status: this.state.blackReady && this.state.whiteReady ? 'IN_PROGRESS' : 'WAITING_TO_START',
    };
  }

  /**
   * Translates sfen to a 2D array
   */
  public get _board() {
    const { sfen } = this.state;
    const ranks = sfen.split(' ')[0].split('/');
    const board = new Array(9).fill(' ').map(() => new Array(9).fill(' '));

    for (let i = 0; i < ranks.length; i++) {
      const rank = ranks[i];
      let file = 0;
      for (let j = 0; j < rank.length; j++) {
        const char = rank[j];
        if (Number.isNaN(parseInt(char, 10))) {
          if (char === '+') {
            board[i][file] = char + rank[j + 1];
            j++;
            file++;
          } else {
            board[i][file] = char;
            file++;
          }
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
    if (this.validateMoveOnBoard(move.move, board)) {
      const simulatedBoard = this._simulateMove(board, from, to, piece);
      const isCheck = this._isCheck(
        simulatedBoard,
        move.playerID === this.state.black ? 'white' : 'black',
      );

      // If the player is in check after the move, the move is invalid
      if (isCheck) {
        return false;
      }

      return true;
    }
    return false;
  }

  private _simulateMove(
    board: string[][],
    from: { row: number; col: number },
    to: { row: number; col: number },
    piece: string,
  ): string[][] {
    // Create a copy of the board to simulate the move
    const simulatedBoard = [...board];
    // Simulate the move
    simulatedBoard[from.row][from.col] = ' ';
    simulatedBoard[to.row][to.col] = piece;
    return simulatedBoard;
  }

  protected validateMoveOnBoard(move: ShogiMove, board: string[][]): boolean {
    const { from, to, promotion } = move;
    const piece = board[from.row][from.col];
    if (
      board[to.row][to.col] !== ' ' &&
      ((piece.toLowerCase() === piece &&
        board[to.row][to.col].toLowerCase() === board[to.row][to.col]) ||
        (piece.toUpperCase() === piece &&
          board[to.row][to.col].toUpperCase() === board[to.row][to.col]))
    ) {
      return false;
    }
    if (promotion) {
      if (
        piece === 'K' ||
        piece === 'k' ||
        piece === 'G' ||
        piece === 'g' ||
        (piece.toUpperCase() !== piece && to.row < 6) ||
        (piece.toLowerCase() !== piece && to.row > 2)
      ) {
        return false;
      }
    }
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
    if (piece === 'G' || piece === '+S' || piece === '+N' || piece === '+L' || piece === '+P') {
      if (from.col === to.col && from.row === to.row + 1) {
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
      if (from.col === to.col && from.row === to.row - 1) {
        return true;
      }
      return false;
    }
    if (piece === 'g' || piece === '+s' || piece === '+n' || piece === '+l' || piece === '+p') {
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
    if (piece === 'B' || piece === 'b') {
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
    if (piece === '+B' || piece === '+b') {
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
      if (Math.abs(from.row - to.row) <= 1 && Math.abs(from.col - to.col) <= 1) {
        return true;
      }
      return false;
    }
    if (piece === 'R' || piece === 'r') {
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
    if (piece === '+R' || piece === '+r') {
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
        if (Math.abs(from.row - to.row) <= 1 && Math.abs(from.col - to.col) <= 1) {
          return true;
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

  private _isCheck(board: string[][], color: ShogiColor): boolean {
    // Determine the position of the king
    let kingRow = -1;
    let kingCol = -1;
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] === (color === 'black' ? 'k' : 'K')) {
          kingRow = i;
          kingCol = j;
          break;
        }
      }
    }

    // Check if any opponent piece threatens the king
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        const opponentPiece = board[i][j];
        if (
          opponentPiece !== ' ' &&
          ((opponentPiece.toLowerCase() === opponentPiece && color === 'white') ||
            (opponentPiece.toUpperCase() === opponentPiece && color === 'black')) &&
          this.validateMoveOnBoard(
            { from: { row: i, col: j }, to: { row: kingRow, col: kingCol } } as ShogiMove,
            board,
          )
        ) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Checks if the given color's king is in checkmate.
   * @param color The color of the king to check for checkmate.
   * @returns True if the king is in checkmate, false otherwise.
   */
  private _isKingInCheckmate(color: ShogiColor): boolean {
    const kingPiece = color === 'black' ? 'K' : 'k';
    const board = this._board;
    // Find the position of the king
    let kingRow = -1;
    let kingCol = -1;
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] === kingPiece) {
          kingRow = i;
          kingCol = j;
          break;
        }
      }
    }

    // If the king is not found, return false (not in checkmate)
    if (kingRow === -1 || kingCol === -1) {
      return false;
    }

    // Check if the king can move to any adjacent square
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const newRow = kingRow + dr;
        const newCol = kingCol + dc;
        if (newRow >= 0 && newRow < 9 && newCol >= 0 && newCol < 9) {
          const pId = color === 'black' ? this.state.black : this.state.white;
          const move: ShogiMove = {
            from: { row: kingRow as ShogiIndex, col: kingCol as ShogiIndex },
            to: { row: newRow as ShogiIndex, col: newCol as ShogiIndex },
            promotion: false,
          };
          const simulatedMove: GameMove<ShogiMove> = {
            gameID: this.id,
            move,
            playerID: pId as string,
          };
          if (this.validateMove(simulatedMove)) {
            // The king can move to this square, so it's not in checkmate
            return false;
          }
        }
      }
    }
    // The king cannot move to any adjacent square, so it's in checkmate
    return true;
  }

  /**
   * Applies a move to the game state
   * @param move The move to apply to the game state
   */
  public applyMove(move: GameMove<ShogiMove>): void {
    if (this.state.status !== 'IN_PROGRESS') {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }
    if (move.playerID !== this.state.black && move.playerID !== this.state.white) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }
    if (move.playerID !== (this.state.numMoves % 2 === 0 ? this.state.black : this.state.white)) {
      throw new InvalidParametersError(MOVE_NOT_YOUR_TURN_MESSAGE);
    }
    const {
      move: { from, to, promotion },
    } = move;
    if (this.validateMove(move)) {
      const board = this._board;
      const piece = board[from.row][from.col];
      board[from.row][from.col] = ' ';
      board[to.row][to.col] = promotion ? `+${piece}` : piece;
      this.state = {
        ...this.state,
        sfen: this._boardToSfen(board),
        numMoves: this.state.numMoves + 1,
      };
      if (
        this._isCheck(board, this.state.numMoves % 2 === 0 ? 'white' : 'black') &&
        this._isKingInCheckmate(this.state.numMoves % 2 === 0 ? 'black' : 'white')
      ) {
        this.state = {
          ...this.state,
          status: 'OVER',
          winner: this.state.numMoves % 2 === 0 ? this.state.white : this.state.black,
        };
      }
    } else {
      throw new InvalidParametersError(
        BOARD_POSITION_NOT_VALID_MESSAGE + this._board[from.row][from.col],
      );
    }
  }

  protected _join(player: Player): void {
    if (this.state.black === player.id || this.state.white === player.id) {
      throw new InvalidParametersError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    }
    if (!this.state.black) {
      this.state = {
        ...this.state,
        status: 'WAITING_FOR_PLAYERS',
        black: player.id,
      };
    } else if (!this.state.white) {
      this.state = {
        ...this.state,
        status: 'WAITING_FOR_PLAYERS',
        white: player.id,
      };
    } else {
      throw new InvalidParametersError(GAME_FULL_MESSAGE);
    }
    if (this.state.black && this.state.white) {
      this.state.status = 'WAITING_TO_START';
    }
  }

  protected _leave(player: Player): void {
    if (this.state.status === 'OVER') {
      return;
    }
    const removePlayer = (playerID: string): ShogiColor => {
      if (this.state.black === playerID) {
        this.state = {
          ...this.state,
          black: undefined,
          blackReady: false,
        };
        return 'black';
      }
      if (this.state.white === playerID) {
        this.state = {
          ...this.state,
          white: undefined,
          whiteReady: false,
        };
        return 'white';
      }
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    };
    const color = removePlayer(player.id);
    switch (this.state.status) {
      case 'WAITING_TO_START':
      case 'WAITING_FOR_PLAYERS':
        // no-ops: nothing needs to happen here
        this.state.status = 'WAITING_FOR_PLAYERS';
        break;
      case 'IN_PROGRESS':
        this.state = {
          ...this.state,
          status: 'OVER',
          winner: color === 'black' ? this.state.white : this.state.black,
        };
        break;
      default:
        // This behavior can be undefined :)
        throw new Error(`Unexpected game status: ${this.state.status}`);
    }
  }

  public spectate(player: Player): void {
    this._spectate(player);
    // TODO: implement spectators ... this._spectators.push(player);
  }

  protected _spectate(player: Player): void {
    if (this.state.status !== 'IN_PROGRESS') {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }
    if (this.state.black === player.id || this.state.white === player.id) {
      throw new InvalidParametersError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    }
    // TODO: add player as a spectator in the game. update the state
  }
}
