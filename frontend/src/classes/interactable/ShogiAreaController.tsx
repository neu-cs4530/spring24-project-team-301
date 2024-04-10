import _ from 'lodash';
import {
  ShogiIndex,
  ShogiColor,
  ShogiGameState,
  ShogiMove,
  GameArea,
  GameStatus,
  ShogiPiece,
  EngineDepth,
} from '../../types/CoveyTownSocket';
import PlayerController from '../PlayerController';
import GameAreaController, {
  GameEventTypes,
  NO_GAME_IN_PROGRESS_ERROR,
  NO_GAME_STARTABLE,
  PLAYER_NOT_IN_GAME_ERROR,
} from './GameAreaController';

export type Coord = {
  row: ShogiIndex;
  col: ShogiIndex;
};

export type ShogiCoord = Coord | undefined;
export type ShogiCell = ShogiPiece | ' ' | undefined;
export type ShogiEvents = GameEventTypes & {
  boardChanged: (board: ShogiCell[][]) => void;
  turnChanged: (isOurTurn: boolean) => void;
  inhandChanged: (inhand: string[]) => void;
};
export const SHOGI_ROWS = 9;
export const SHOGI_COLS = 9;
export const COLUMN_FULL_MESSAGE = 'The column is full';

/**
 * This class is responsible for managing the state of the Connect Four game, and for sending commands to the server
 */
export default class ShogiAreaController extends GameAreaController<ShogiGameState, ShogiEvents> {
  protected _board: ShogiCell[][] = this.createBoardFromSfen(
    'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL',
  );

  protected _drops: string[] = [];

  protected _enemyInhand: string[] = [];

  protected _engine = false;

  protected _difficulty: EngineDepth = 0;

  /**
   * Returns the current state of the board.
   *
   * The board is a 6x7 array of ConnectFourCell, which is either 'Red', 'Yellow', or undefined.
   *
   * The 2-dimensional array is indexed by row and then column, so board[0][0] is the top-left cell,
   */
  get board(): ShogiCell[][] {
    return this._board;
  }

  /**
   * Returns the player with the 'White' game piece, if there is one, or undefined otherwise
   */
  get white(): PlayerController | undefined {
    const white = this._model.game?.state.white;
    if (white) {
      return this.occupants.find(eachOccupant => eachOccupant.id === white);
    }
    return undefined;
  }

  get drops(): string[] {
    return this._drops;
  }

  get enemyInhand(): string[] {
    return this._enemyInhand;
  }

  /**
   * Returns the player with the 'Black' game piece, if there is one, or undefined otherwise
   */
  get black(): PlayerController | undefined {
    const black = this._model.game?.state.black;
    if (black) {
      return this.occupants.find(eachOccupant => eachOccupant.id === black);
    }
    return undefined;
  }

  /**
   * Returns the player who won the game, if there is one, or undefined otherwise
   */
  get winner(): PlayerController | undefined {
    const winner = this._model.game?.state.winner;
    if (winner) {
      return this.occupants.find(eachOccupant => eachOccupant.id === winner);
    }
    return undefined;
  }

  /**
   * Returns the number of moves that have been made in the game
   */
  get moveCount(): number {
    return this._model.game?.state.numMoves || 0;
  }

  /**
   * Returns true if it is our turn to make a move, false otherwise
   */
  get isOurTurn(): boolean {
    return this.whoseTurn?.id === this._townController.ourPlayer.id;
  }

  get isBlack(): boolean {
    return this._townController.ourPlayer.id === this.black?.id;
  }

  /**
   * Returns true if the current player is in the game, false otherwise
   */
  get isPlayer(): boolean {
    return this._model.game?.players.includes(this._townController.ourPlayer.id) ?? false;
  }

  /**
   * Returns the color of the current player's game piece
   * @throws an error with message PLAYER_NOT_IN_GAME_ERROR if the current player is not in the game
   */
  get gamePiece(): ShogiColor {
    if (this.white?.id === this._townController.ourPlayer.id) {
      return 'white';
    } else if (this.black?.id === this._townController.ourPlayer.id) {
      return 'black';
    }
    throw new Error(PLAYER_NOT_IN_GAME_ERROR);
  }

  /**
   * Returns the status of the game
   * If there is no game, returns 'WAITING_FOR_PLAYERS'
   */
  get status(): GameStatus {
    const status = this._model.game?.state.status;
    if (!status) {
      return 'WAITING_FOR_PLAYERS';
    }
    return status;
  }

  /**
   * Returns the player whose turn it is, if the game is in progress
   * Returns undefined if the game is not in progress
   *
   * Follows the same logic as the backend, respecting the firstPlayer field of the gameState
   */
  get whoseTurn(): PlayerController | undefined {
    const { white, black } = this;
    if (this._model.game?.state.status !== 'IN_PROGRESS') {
      return undefined;
    }
    if (this.moveCount % 2 === 0) {
      return black;
    }
    return white;
  }

  /**
   * Returns true if the game is empty - no players AND no occupants in the area
   *
   */
  isEmpty(): boolean {
    return !this.black && !this.white && this.occupants.length === 0;
  }

  /**
   * Returns true if the game is not empty and the game is not waiting for players
   */
  public isActive(): boolean {
    return !this.isEmpty() && this.status !== 'WAITING_FOR_PLAYERS';
  }

  public createBoardFromSfen(sfen: string): ShogiCell[][] {
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

    return this.isActive() && this.status !== 'OVER'
      ? this.isBlack
        ? board
        : board.reverse()
      : board;
  }

  /**
   * Updates the internal state of this ConnectFourAreaController based on the new model.
   *
   * Calls super._updateFrom, which updates the occupants of this game area and other
   * common properties (including this._model)
   *
   * If the board has changed, emits a boardChanged event with the new board.
   * If the board has not changed, does not emit a boardChanged event.
   *
   * If the turn has changed, emits a turnChanged event with the new turn (true if our turn, false otherwise)
   * If the turn has not changed, does not emit a turnChanged event.
   */
  public _updateFrom(newModel: GameArea<ShogiGameState>): void {
    const wasOurTurn = this.isOurTurn;
    super._updateFrom(newModel);
    const newGame = newModel.game;
    if (newGame) {
      const newBoard = this.createBoardFromSfen(newGame.state.sfen);
      const [newInhand, enemyInhand] = _.partition(newGame.state.inhand.split(''), piece => {
        if (this.isBlack && piece.toUpperCase() === piece) {
          return true;
        } else if (!this.isBlack && piece.toLowerCase() === piece) {
          return true;
        }
        return false;
      });
      if (!_.isEqual(newBoard, this._board)) {
        this._board = newBoard;
        this.emit('boardChanged', this._board);
        if (newInhand.length > this.drops.length) {
          this.emit('pieceCaptured');
        } else if (enemyInhand.length > this._enemyInhand.length) {
          this.emit('pieceCaptured');
        } else {
          this.emit('pieceMoved');
        }
      }
      if (newInhand !== this._drops) {
        this._drops = newInhand;
        this.emit('inhandChanged', this._drops);
      }
      if (enemyInhand !== this._enemyInhand) {
        this._enemyInhand = enemyInhand;
      }
    }
    const isOurTurn = this.isOurTurn;
    if (wasOurTurn !== isOurTurn) this.emit('turnChanged', isOurTurn);
  }

  /**
   * Sends a request to the server to start the game.
   *
   * If the game is not in the WAITING_TO_START state, throws an error.
   *
   * @throws an error with message NO_GAME_STARTABLE if there is no game waiting to start
   */
  public async startGame(): Promise<void> {
    const instanceID = this._instanceID;
    if (this._model.game?.state.status === 'WAITING_FOR_PLAYERS') {
      this._engine = true;
    }
    if (!instanceID) {
      throw new Error(NO_GAME_STARTABLE);
    }
    await this._townController.sendInteractableCommand(this.id, {
      gameID: instanceID,
      type: 'StartGame',
    });
  }

  /**
   * Sends a request to the server to place the current player's game piece in the given column.
   * Calculates the row to place the game piece in based on the current state of the board.
   * Does not check if the move is valid.
   *
   * @throws an error with message NO_GAME_IN_PROGRESS_ERROR if there is no game in progress
   * @throws an error with message COLUMN_FULL_MESSAGE if the column is full
   *
   * @param col Column to place the game piece in
   */
  public async makeMove(
    fRow: ShogiIndex,
    fCol: ShogiIndex,
    tRow: ShogiIndex,
    tCol: ShogiIndex,
    drop: ShogiPiece,
    promotion: boolean,
  ): Promise<void> {
    const instanceID = this._instanceID;
    if (!instanceID || this._model.game?.state.status !== 'IN_PROGRESS') {
      throw new Error(NO_GAME_IN_PROGRESS_ERROR);
    }
    let move: ShogiMove = {
      from: {
        row: fRow,
        col: fCol,
      },
      to: {
        row: tRow,
        col: tCol,
      },
      drop: undefined,
      promotion: promotion,
    };
    if (drop !== ' ') {
      move = { ...move, drop };
    }
    console.log(JSON.stringify(move));
    await this._townController.sendInteractableCommand(this.id, {
      type: 'GameMove',
      gameID: instanceID,
      move,
    });
    if (this._engine) {
      this.getEngineMove(this._difficulty);
    }
  }

  /**
   * Sends a request to the server to get the engine move.
   * Does not check if the move is valid.
   * @throws an error with message NO_GAME_IN_PROGRESS_ERROR if there is no game in progress
   */
  public async getEngineMove(depth: EngineDepth): Promise<void> {
    const instanceID = this._instanceID;
    if (!instanceID || this._model.game?.state.status !== 'IN_PROGRESS') {
      throw new Error(NO_GAME_IN_PROGRESS_ERROR);
    }
    await this._townController.sendInteractableCommand(this.id, {
      type: 'EngineMove',
      gameID: instanceID,
      depth,
    });
  }

  /**
   * Updates the difficulty value for the engine
   * @param difficulty new difficulty value
   * @returns void
   */
  public async setDifficulty(difficulty: EngineDepth): Promise<void> {
    console.log(difficulty);
    this._difficulty = difficulty;
  }

  /**
   * Sends a request to the server to get the valid moves
   * @param row row of the piece
   * @param col col of the piece
   * @returns array of valid moves
   */
  public async getValidMoves(row: ShogiIndex, col: ShogiIndex): Promise<ShogiMove[]> {
    const instanceID = this._instanceID;
    if (!instanceID || this._model.game?.state.status !== 'IN_PROGRESS') {
      throw new Error(NO_GAME_IN_PROGRESS_ERROR);
    }
    const response = await this._townController.sendInteractableCommand(this.id, {
      type: 'ValidMoves',
      gameID: instanceID,
      row,
      col,
    });
    return response.moves;
  }
}
