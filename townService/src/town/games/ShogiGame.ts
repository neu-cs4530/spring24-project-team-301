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
  protected _spectators: Player[] = [];

  public constructor() {
    super({
      sfen: 'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL',
      inhand: '',
      status: 'WAITING_TO_START',
      numMoves: 0,
      spectators: [],
    });
  }

  /**
   * Indicates that a player is ready to start the game.
   *
   * Updates the game state to indicate that the player is ready to start the game.
   *
   * If both players are ready, the game will start.
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
    const board = this._board;
    if (this.validateMoveOnBoard(move.move, board)) {
      const simulatedBoard = this._simulateMove(move.move, board);
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

  private _simulateMove(move: ShogiMove, board: string[][]): string[][] {
    const { from, to, drop } = move;
    const piece = drop || this._board[from.row][from.col];
    // Create a copy of the board to simulate the move
    const simulatedBoard = [...board];
    // Simulate the move, only need to change from if not a drop move
    if (!drop) {
      simulatedBoard[from.row][from.col] = ' ';
    }
    simulatedBoard[to.row][to.col] = piece;
    return simulatedBoard;
  }

  protected validateMoveOnBoard(move: ShogiMove, board: string[][]): boolean {
    const { from, to, promotion, drop } = move;
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
    if (drop) {
      // needs to be in hand
      if (this.state.inhand.indexOf(drop) === -1 || drop === 'K' || drop === 'k') {
        return false;
      }
      // needs to have valid moves
      if (drop === 'P' || drop === 'L' || drop === 'N') {
        if (drop === 'P' && to.row < 1) {
          return false;
        }
        if (drop === 'L' && to.row < 1) {
          return false;
        }
        if (drop === 'N' && to.row < 2) {
          return false;
        }
      }
      if (drop === 'p' || drop === 'l' || drop === 'n') {
        if (drop === 'p' && to.row > 7) {
          return false;
        }
        if (drop === 'l' && to.row > 7) {
          return false;
        }
        if (drop === 'n' && to.row > 6) {
          return false;
        }
      }
      if (board[to.row][to.col] !== ' ') {
        return false;
      }
      // two pawn rule in drop moves
      if (drop === 'P') {
        for (let i = 0; i < 9; i++) {
          if (board[i][to.col] === 'P') {
            return false;
          }
        }
      }
      if (drop === 'p') {
        for (let i = 0; i < 9; i++) {
          if (board[i][to.col] === 'p') {
            return false;
          }
        }
      }
      return true;
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
   * @throws InvalidParametersError if the game is not in progress (GAME_NOT_IN_PROGRESS_MESSAGE)
   * @throws InvalidParametersError if the player is not in the game (PLAYER_NOT_IN_GAME_MESSAGE)
   * @throws InvalidParametersError if it is not the player's turn (MOVE_NOT_YOUR_TURN_MESSAGE)
   * @throws InvalidParametersError if the move is not valid (BOARD_POSITION_NOT_VALID_MESSAGE)
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
      if (board[to.row][to.col] !== ' ') {
        const inhand = this.state.inhand + board[to.row][to.col];
        this.state = {
          ...this.state,
          inhand,
        };
      }
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
        // drop pawn mate rule
        // a pawn cannot be dropped for checkmate
        if (move.move.drop === 'P' || move.move.drop === 'p') {
          throw new InvalidParametersError(
            BOARD_POSITION_NOT_VALID_MESSAGE + this._board[from.row][from.col],
          );
        }
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
        throw new Error(`Unexpected game status: ${this.state.status}`);
    }
  }

  /**
   * Gets all valid moves for a piece
   * @param row The row of the piece
   * @param col The column of the piece
   * @returns All valid moves for the piece
   */
  public getValidMovesForPiece(row: number, col: number): ShogiMove[] {
    const board = this._board;
    const validMoves: ShogiMove[] = [];
    for (let x = 0; x < board.length; x++) {
      for (let y = 0; y < board[x].length; y++) {
        const move: ShogiMove = {
          from: { row: row as ShogiIndex, col: col as ShogiIndex },
          to: { row: x as ShogiIndex, col: y as ShogiIndex },
          promotion: false,
        };
        if (this.validateMoveOnBoard(move, board)) {
          validMoves.push(move);
        }
      }
    }
    return validMoves;
  }

  /**
   * Gets all valid moves
   * @returns All valid moves for the current player
   */
  public getAllValidMoves(): ShogiMove[] {
    const board = this._board;
    const validMoves: ShogiMove[] = [];
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        const piece = board[i][j];
        if (piece !== ' ') {
          this.getValidMovesForPiece(i, j).forEach(move => validMoves.push(move));
        }
      }
    }
    return validMoves;
  }

  /**
   * Get the move for the engine to make.
   * Uses the Negamax algorithm to determine the best move for the engine to make.
   * https://en.wikipedia.org/wiki/Negamax
   * @returns The move for the engine to make.
   */
  public getEngineMove(): ShogiMove {
    const allMoves = this.getAllValidMoves();
    const bestMove: ShogiMove = allMoves[0];
    let bestValue = -Infinity;
    for (const move of allMoves) {
      const simulatedBoard = this._simulateMove(move, this._board);
      const value = -this._negamax(simulatedBoard, 3);
      if (value > bestValue) {
        bestValue = value;
        bestMove.from = move.from;
        bestMove.to = move.to;
        bestMove.promotion = move.promotion;
      }
    }
    return bestMove;
  }

  private _negamax(board: string[][], depth: number): number {
    if (depth === 0) return this._evaluateBoard(board);
    let bestValue = -Infinity;
    for (let i = 0; i < this._board.length; i++) {
      for (let j = 0; j < this._board[i].length; j++) {
        const piece = board[i][j];
        if (piece !== ' ') {
          const moves = this.getValidMovesForPiece(i, j);
          for (const move of moves) {
            const simulatedBoard = this._simulateMove(move, board);
            const value = -this._negamax(simulatedBoard, depth - 1);
            bestValue = Math.max(bestValue, value);
          }
        }
      }
    }
    return bestValue;
  }

  private _evaluateBoard(board: string[][]): number {
    let score = 0;
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        const piece = board[i][j];
        if (piece !== ' ') {
          const pieceValue = this._pieceValue(piece);
          score += piece === piece.toUpperCase() ? pieceValue : -pieceValue;
        }
      }
    }
    return score;
  }

  private _pieceValue(piece: string): number {
    switch (piece.toLowerCase()) {
      case 'p':
        return 1;
      case '+p':
        return 7;
      case 'l':
        return 3;
      case '+l':
        return 6;
      case 'n':
        return 4;
      case '+n':
        return 6;
      case 's':
        return 5;
      case '+s':
        return 6;
      case 'g':
        return 6;
      case 'b':
        return 8;
      case '+b':
        return 10;
      case 'r':
        return 9;
      case '+r':
        return 11;
      case 'k':
        return 1000;
      default:
        return 0;
    }
  }

  /**
   * Attempt to leave spectating game.
   * @param player The player to leave spectating.
   * @throws InvalidParametersError if the player can not leave spectating
   */
  public leaveSpectate(player: Player): void {
    this._leaveSpectate(player);
    this._spectators = this._spectators.filter(s => s.id !== player.id);
  }

  private _leaveSpectate(player: Player): void {
    if (this.state.status === 'OVER') {
      return;
    }

    const filteredSpectators = this.state.spectators.filter(spectator => spectator !== player.id);
    if (filteredSpectators.length < this.state.spectators.length) {
      this.state = {
        ...this.state,
        spectators: filteredSpectators,
      };
    } else {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }
  }

  /**
   * Attempt to spectate a game.
   * @param player The player to spectate the game.
   * @throws InvalidParametersError if the player can not spectate the game
   */
  public spectate(player: Player): void {
    this._spectate(player);
    this._spectators.push(player);
  }

  private _spectate(player: Player): void {
    if (this.state.status !== 'IN_PROGRESS') {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }
    if (
      this.state.black === player.id ||
      this.state.white === player.id ||
      this.spectators.some(s => s.id === player.id)
    ) {
      throw new InvalidParametersError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    }
    this.state = {
      ...this.state,
      spectators: [...this.state.spectators, player.id],
    };
  }

  public get spectators() {
    return this._spectators;
  }
}
