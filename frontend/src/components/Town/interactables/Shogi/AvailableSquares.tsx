import { ShogiCell, ShogiCoord, Coord } from '../../../../classes/interactable/ShogiAreaController';
import { ShogiIndex } from '../../../../types/CoveyTownSocket';

function _addPiece(
  piece: ShogiCell,
  row: number,
  col: number,
  board: ShogiCell[][],
  av: ShogiCoord[],
): ShogiCoord[] {
  if (!(row < 0 || row > 8 || col < 0 || col > 8)) {
    const capturable: ShogiCell = board[row][col];
    console.log(capturable);
    console.log(piece);
    if (capturable === ' ' || capturable === undefined) {
      av.push({ row: row as ShogiIndex, col: col as ShogiIndex });
    } // If this square has an enemy piece
    else if (
      (capturable === capturable?.toUpperCase() && piece === piece?.toLowerCase()) ||
      (capturable === capturable?.toLowerCase() && piece === piece?.toUpperCase())
    ) {
      av.push({ row: row as ShogiIndex, col: col as ShogiIndex });
    } // If this square is your piece
  }
  return av;
}

function _canCapture(piece: ShogiCell, row: number, col: number, board: ShogiCell[][]): boolean {
  if (row < 0 || row > 8 || col < 0 || col > 8) {
    return false;
  }
  const capturable: ShogiCell = board[row][col];
  console.log(capturable);
  console.log(piece);
  // If this square is empty
  if (capturable === ' ' || capturable === undefined) {
    return true;
  } // If this square has an enemy piece
  else if (
    (capturable === capturable?.toUpperCase() && piece === piece?.toLowerCase()) ||
    (capturable === capturable?.toLowerCase() && piece === piece?.toUpperCase())
  ) {
    return true;
  } // If this square is your piece
  return false;
}

function _generateLance(
  piece: ShogiCell,
  coord: Coord,
  board: ShogiCell[][],
  av: ShogiCoord[],
): ShogiCoord[] {
  const { row, col } = coord;
  for (let i = 1; i <= row; i++) {
    if (_canCapture(piece, row - i, col, board)) {
      av.push({ row: (row - i) as ShogiIndex, col: col });
      if (board[row - i][col] !== ' ') {
        break;
      }
    } else {
      break;
    }
  }
  return av;
}

function _generateRook(
  piece: ShogiCell,
  coord: Coord,
  board: ShogiCell[][],
  av: ShogiCoord[],
): ShogiCoord[] {
  const { row, col } = coord;
  for (let i = 1; i <= col; i++) {
    if (_canCapture(piece, row, col - i, board)) {
      av.push({ row: row, col: (col - i) as ShogiIndex });
      if (board[row][col - i] !== ' ') {
        break;
      }
    } else {
      break;
    }
  }
  for (let i = 1; i <= 8 - col; i++) {
    if (_canCapture(piece, row, col + i, board)) {
      av.push({ row: row, col: (col + i) as ShogiIndex });
      if (board[row][col + i] !== ' ') {
        break;
      }
    } else {
      break;
    }
  }
  for (let i = 1; i <= 8 - row; i++) {
    if (_canCapture(piece, row + i, col, board)) {
      av.push({ row: (row + i) as ShogiIndex, col: col });
      if (board[row + i][col] !== ' ') {
        break;
      }
    } else {
      break;
    }
  }
  return _generateLance(piece, coord, board, av);
}

function _generateBishop(
  piece: ShogiCell,
  coord: Coord,
  board: ShogiCell[][],
  av: ShogiCoord[],
): ShogiCoord[] {
  const { row, col } = coord;
  for (let i = 1; i <= (col < row ? col : row); i++) {
    if (_canCapture(piece, row - i, col - i, board)) {
      av.push({ row: (row - i) as ShogiIndex, col: (col - i) as ShogiIndex });
      if (board[row - i][col - i] !== ' ') {
        break;
      }
    } else {
      break;
    }
  }
  for (let i = 1; i <= (8 - col < row ? 8 - col : row); i++) {
    if (_canCapture(piece, row - i, col + i, board)) {
      av.push({ row: (row - i) as ShogiIndex, col: (col + i) as ShogiIndex });
      if (board[row - i][col + i] !== ' ') {
        break;
      }
    } else {
      break;
    }
  }
  for (let i = 1; i <= (8 - col < 8 - row ? 8 - col : 8 - row); i++) {
    if (_canCapture(piece, row + i, col + i, board)) {
      av.push({ row: (row + i) as ShogiIndex, col: (col + i) as ShogiIndex });
      if (board[row + i][col + i] !== ' ') {
        break;
      }
    } else {
      break;
    }
  }
  for (let i = 1; i <= (8 - row < col ? 8 - row : col); i++) {
    if (_canCapture(piece, row + i, col - i, board)) {
      av.push({ row: (row + i) as ShogiIndex, col: (col - i) as ShogiIndex });
      if (board[row + i][col - i] !== ' ') {
        break;
      }
    } else {
      break;
    }
  }
  return av;
}

/**
 * Checks to see if the square directly in front of this piece is available
 * @param coord the coordinates of the selected piece
 * @param board the Shogi Board
 * @param av the list of available pieces to capture
 * @returns the list of available pieces to capture
 */
function _oneForward(
  piece: ShogiCell,
  coord: Coord,
  board: ShogiCell[][],
  av: ShogiCoord[],
): ShogiCoord[] {
  const { row, col } = coord;
  return _addPiece(piece, row, col, board, _addPiece(piece, row - 1, col, board, av));
}

/**
 * Checks to see if the three squares in front of this piece are available
 * @param coord the coordinates of the selected piece
 * @param board the Shogi Board
 * @param av the list of available pieces to capture
 * @returns the list of available pieces to capture
 */
function _allForward(
  piece: ShogiCell,
  coord: Coord,
  board: ShogiCell[][],
  av: ShogiCoord[],
): ShogiCoord[] {
  const { row, col } = coord;
  return _oneForward(
    piece,
    coord,
    board,
    _addPiece(piece, row - 1, col - 1, board, _addPiece(piece, row - 1, col + 1, board, av)),
  );
}
/**
 * Checks to see if the three squares to the sides and behind the piece are available
 * @param coord the coordinates of the selected piece
 * @param board the Shogi Board
 * @param av the list of available pieces to capture
 * @returns the list of available pieces to capture
 */
function _sidesAndBehind(
  piece: ShogiCell,
  coord: Coord,
  board: ShogiCell[][],
  av: ShogiCoord[],
): ShogiCoord[] {
  const { row, col } = coord;
  return _addPiece(
    piece,
    row,
    col - 1,
    board,
    _addPiece(piece, row, col + 1, board, _addPiece(piece, row + 1, col, board, av)),
  );
}

/**
 * Checks to see if the two corner squares behind the piece are available
 * @param coord the coordinates of the selected piece
 * @param board the Shogi Board
 * @param av the list of available pieces to capture
 * @returns the list of available pieces to capture
 */
function _cornersBehind(
  piece: ShogiCell,
  coord: Coord,
  board: ShogiCell[][],
  av: ShogiCoord[],
): ShogiCoord[] {
  const { row, col } = coord;
  return _addPiece(piece, row + 1, col - 1, board, _addPiece(piece, row + 1, col + 1, board, av));
}

/**
 * A silver general moves one square diagonally, or one square straight forward, giving it five possible destinations
 * @param coord the coordinates of the selected piece
 * @param board the Shogi Board
 * @param av the list of available pieces to capture
 * @returns the list of available pieces to capture
 */
function _generateSilver(
  piece: ShogiCell,
  coord: Coord,
  board: ShogiCell[][],
  av: ShogiCoord[],
): ShogiCoord[] {
  return _allForward(piece, coord, board, _cornersBehind(piece, coord, board, av));
}

/**
 * A gold general moves one square orthogonally, or one square diagonally forward, giving it six possible destinations.
 * @param coord the coordinates of the selected piece
 * @param board the Shogi Board
 * @param av the list of available pieces to capture
 * @returns the list of available pieces to capture
 */
function _generateGold(
  piece: ShogiCell,
  coord: Coord,
  board: ShogiCell[][],
  av: ShogiCoord[],
): ShogiCoord[] {
  return _allForward(piece, coord, board, _sidesAndBehind(piece, coord, board, av));
}

/**
 * A king moves one square orthoganally or diagonally, for a total of eight possible destinations
 * @param coord the coordinates of the selected piece
 * @param board the Shogi Board
 * @param av the list of available pieces to capture
 * @returns the list of available pieces to capture
 */
function _generateKing(
  piece: ShogiCell,
  coord: Coord,
  board: ShogiCell[][],
  av: ShogiCoord[],
): ShogiCoord[] {
  return _allForward(
    piece,
    coord,
    board,
    _sidesAndBehind(piece, coord, board, _cornersBehind(piece, coord, board, av)),
  );
}

/**
 * A knight moves two squares forward and one square to the side. It is the only piece that can jump over others,
 * @param coord the coordinates of the selected piece
 * @param board the Shogi Board
 * @param av the list of available pieces to capture
 * @returns the list of available pieces to capture
 */
function _generateKnight(
  piece: ShogiCell,
  coord: Coord,
  board: ShogiCell[][],
  av: ShogiCoord[],
): ShogiCoord[] {
  const { row, col } = coord;
  return _addPiece(piece, row - 2, col - 1, board, _addPiece(piece, row - 2, col + 1, board, av));
}

/** Given a piece's coordinates and a Shogi Board, the function will find all available squares that the piece can move to
 *
 * @param coord the coordinates of a piece
 * @param board the Shogi Board with your and your enemy pieces
 * @returns the list of available squares.
 */
export default function generateAvailable(coord: ShogiCoord, board: ShogiCell[][]): ShogiCoord[] {
  const av: ShogiCoord[] = [];
  if (!coord) return av;
  const { row, col } = coord;
  const p = board[row][col];
  const pU = p?.toUpperCase();

  // Pawn. Moves forward one space
  if (pU === 'P') {
    return _oneForward(p, coord, board, av);
  } // Lance. Moves forward two spaces
  else if (pU === 'L') {
    return _generateLance(p, coord, board, av);
  } // Knight. Moves forward two, left/right one, and jumps over other pieces.
  else if (pU === 'N') {
    return _generateKnight(p, coord, board, av);
  } // Silver General. Moves one square diagonally or straight forward.
  else if (pU === 'S') {
    return _generateSilver(p, coord, board, av);
  } // Gold General. Moves like the Silver General, but can also move sideways
  else if (pU === 'G' || pU === '+S' || pU === '+P' || pU === '+N' || pU === '+L') {
    return _generateGold(p, coord, board, av);
  } // Bishop. Travels any number of squares diagonally.
  else if (pU === 'B') {
    return _generateBishop(p, coord, board, av);
  } // Rook. It moves like a chess rook.
  else if (pU === 'R') {
    return _generateRook(p, coord, board, av);
  } // King. It moves like a chess king.
  else if (pU === 'K') {
    return _generateKing(p, coord, board, av);
  } // Dragon (Promoted Rook). Moves like a rook and a king.
  else if (pU === '+R') {
    return _generateKing(p, coord, board, _generateRook(p, coord, board, av));
  } // Horse (Promoted Bishop). Moves like a bishop and a king.
  else if (pU === '+B') {
    return _generateKing(p, coord, board, _generateBishop(p, coord, board, av));
  }
  return av;
}
