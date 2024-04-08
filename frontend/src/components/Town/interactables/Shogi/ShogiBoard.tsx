import ShogiAreaController, {
  ShogiCell,
  ShogiCoord,
} from '../../../../classes/interactable/ShogiAreaController';
import { Button, chakra, Container, useToast } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { ShogiIndex } from '../../../../types/CoveyTownSocket';
import Image from 'next/image';

export type ShogiGameProps = {
  gameAreaController: ShogiAreaController;
};

type ShogiPieces = {
  K: string;
  R: string;
  pR: string;
  B: string;
  pB: string;
  G: string;
  S: string;
  pS: string;
  N: string;
  pN: string;
  L: string;
  pL: string;
  P: string;
  pP: string;
};

const shogiPiecePhotos: ShogiPieces = {
  K: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Shogi_osho%28svg%29.svg/70px-Shogi_osho%28svg%29.svg.png',
  R: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Shogi_hisha%28svg%29.svg/70px-Shogi_hisha%28svg%29.svg.png',
  pR: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Shogi_ryuo%28svg%29.svg/70px-Shogi_ryuo%28svg%29.svg.png',
  B: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Shogi_kakugyo%28svg%29.svg/70px-Shogi_kakugyo%28svg%29.svg.png',
  pB: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Shogi_ryuma%28svg%29.svg/70px-Shogi_ryuma%28svg%29.svg.png',
  G: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Shogi_kinsho%28svg%29.svg/70px-Shogi_kinsho%28svg%29.svg.png',
  S: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Shogi_ginsho%28svg%29.svg/70px-Shogi_ginsho%28svg%29.svg.png',
  pS: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Shogi_narigin%28svg%29.svg/70px-Shogi_narigin%28svg%29.svg.png',
  N: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Shogi_keima.svg/70px-Shogi_keima.svg.png',
  pN: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Shogi_narikei%28svg%29.svg/70px-Shogi_narikei%28svg%29.svg.png',
  L: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Shogi_kyosha%28svg%29.svg/70px-Shogi_kyosha%28svg%29.svg.png',
  pL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Shogi_narikyo%28svg%29.svg/70px-Shogi_narikyo%28svg%29.svg.png',
  P: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Shogi_fuhyo%28svg%29.svg/70px-Shogi_fuhyo%28svg%29.svg.png',
  pP: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Shogi_tokin%28svg%29.svg/70px-Shogi_tokin%28svg%29.svg.png',
};
const StyledShogiBoard = chakra(Container, {
  baseStyle: {
    display: 'flex',
    alignContent: 'flex-start',
    width: '100%',
    padding: '4px',
    flexWrap: 'wrap',
  },
});
const StyledShogiSquare = chakra(Button, {
  baseStyle: {
    borderRadius: '0px',
    justifyContent: 'center',
    width: '60px',
    height: '60px',
    alignItems: 'center',
    flexBasis: 'auto',
    border: '1px solid black',
    _disabled: {
      opacity: '100%',
    },
  },
});
/**
 * A component that renders the ConnectFour board
 *
 * Renders the ConnectFour board as a "StyledConnectFourBoard", which consists of "StyledConnectFourSquare"s
 * (one for each cell in the board, starting from the top left and going left to right, top to bottom).
 *
 * Each StyledConnectFourSquare has an aria-label property that describes the cell's position in the board,
 * formatted as `Cell ${rowIndex},${colIndex} (Red|Yellow|Empty)`.
 *
 * The background color of each StyledConnectFourSquare is determined by the value of the cell in the board, either
 * 'red', 'yellow', or '' (an empty for an empty square).
 *
 * The board is re-rendered whenever the board changes, and each cell is re-rendered whenever the value
 * of that cell changes.
 *
 * If the current player is in the game, then each StyledConnectFourSquare is clickable, and clicking
 * on it will make a move in that column. If there is an error making the move, then a toast will be
 * displayed with the error message as the description of the toast. If it is not the current player's
 * turn, then the StyledConnectFourSquare will be disabled.
 *
 * @param gameAreaController the controller for the ConnectFour game
 */
export default function ShogiBoard({ gameAreaController }: ShogiGameProps): JSX.Element {
  const [board, setBoard] = useState<ShogiCell[][]>(gameAreaController.board);
  const [isOurTurn, setIsOurTurn] = useState(gameAreaController.isOurTurn);
  const [from, setFrom] = useState<ShogiCoord>(undefined);
  const [available, setAvailable] = useState<ShogiCoord[]>([]);
  const toast = useToast();

  function isOurPiece(row: number, col: number): boolean {
    if (board[row][col] === ' ') return false;
    const piece =
      board[row][col]?.charAt(0) === '+' ? board[row][col]?.charAt(1) : board[row][col]?.charAt(0);
    if (gameAreaController.isBlack) {
      if (piece?.toLowerCase() !== piece) {
        return true;
      } else {
        return false;
      }
    } else {
      if (piece?.toUpperCase() !== piece) {
        return true;
      } else {
        return false;
      }
    }
  }

  function _canCapture(piece: ShogiCell, row: number, col: number): boolean {
    if (row < 0 || row > 8 || col < 0 || col > 8) {
      return false;
    }
    const capturable: ShogiCell = board[row][col];
    console.log(capturable);
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

  function _generateKing(p: ShogiCell, row: ShogiIndex, col: ShogiIndex): void {
    if (_canCapture(p, row - 1, col)) {
      console.log('first');
      setAvailable(prev => [...prev, { row: (row - 1) as ShogiIndex, col: col }]);
    }
    if (_canCapture(p, row - 1, col - 1)) {
      console.log('second');
      setAvailable(prev => [
        ...prev,
        { row: (row - 1) as ShogiIndex, col: (col - 1) as ShogiIndex },
      ]);
    }
    if (_canCapture(p, row - 1, col + 1)) {
      console.log('third');
      setAvailable(prev => [
        ...prev,
        { row: (row - 1) as ShogiIndex, col: (col + 1) as ShogiIndex },
      ]);
    }
    if (_canCapture(p, row + 1, col - 1)) {
      console.log('fourth');
      setAvailable(prev => [
        ...prev,
        { row: (row + 1) as ShogiIndex, col: (col - 1) as ShogiIndex },
      ]);
    }
    if (_canCapture(p, row + 1, col + 1)) {
      setAvailable(prev => [
        ...prev,
        { row: (row + 1) as ShogiIndex, col: (col + 1) as ShogiIndex },
      ]);
    }
    if (_canCapture(p, row, col - 1)) {
      setAvailable(prev => [...prev, { row: row, col: (col - 1) as ShogiIndex }]);
    }
    if (_canCapture(p, row, col + 1)) {
      setAvailable(prev => [...prev, { row: row, col: (col + 1) as ShogiIndex }]);
    }
    if (_canCapture(p, row, col + 1)) {
      setAvailable(prev => [...prev, { row: row, col: (col + 1) as ShogiIndex }]);
    }
    if (_canCapture(p, row + 1, col + 1)) {
      setAvailable(prev => [...prev, { row: row, col: (col + 1) as ShogiIndex }]);
    }
    if (_canCapture(p, row + 1, col + 1)) {
      setAvailable(prev => [...prev, { row: row, col: (col + 1) as ShogiIndex }]);
    }
    if (_canCapture(p, row + 1, col - 1)) {
      setAvailable(prev => [...prev, { row: row, col: (col + 1) as ShogiIndex }]);
    }
  }

  function _generateRook(p: ShogiCell, row: ShogiIndex, col: ShogiIndex): void {
    for (let i = 1; i <= col; i++) {
      if (_canCapture(p, row, col - i)) {
        setAvailable(prev => [...prev, { row: row, col: (col - i) as ShogiIndex }]);
        if (board[row][col - i] !== ' ') {
          break;
        }
      } else {
        break;
      }
    }
    for (let i = 1; i <= 8 - col; i++) {
      if (_canCapture(p, row, col + i)) {
        setAvailable(prev => [...prev, { row: row, col: (col + i) as ShogiIndex }]);
        if (board[row][col + i] !== ' ') {
          break;
        }
      } else {
        break;
      }
    }
    for (let i = 1; i <= row; i++) {
      if (_canCapture(p, row - i, col)) {
        setAvailable(prev => [...prev, { row: (row - i) as ShogiIndex, col: col }]);
        if (board[row - i][col] !== ' ') {
          break;
        }
      } else {
        break;
      }
    }
    for (let i = 1; i <= 8 - row; i++) {
      if (_canCapture(p, row + i, col)) {
        setAvailable(prev => [...prev, { row: (row + i) as ShogiIndex, col: col }]);
        if (board[row + i][col] !== ' ') {
          break;
        }
      } else {
        break;
      }
    }
  }

  function _generateBishop(p: ShogiCell, row: ShogiIndex, col: ShogiIndex): void {
    for (let i = 1; i <= (col < row ? col : row); i++) {
      if (_canCapture(p, row - i, col - i)) {
        setAvailable(prev => [
          ...prev,
          { row: (row - i) as ShogiIndex, col: (col - i) as ShogiIndex },
        ]);
        if (board[row - i][col - i] !== ' ') {
          break;
        }
      } else {
        break;
      }
    }
    for (let i = 1; i <= (8 - col < row ? 8 - col : row); i++) {
      if (_canCapture(p, row - i, col + i)) {
        setAvailable(prev => [
          ...prev,
          { row: (row - i) as ShogiIndex, col: (col + i) as ShogiIndex },
        ]);
        if (board[row - i][col + i] !== ' ') {
          break;
        }
      } else {
        break;
      }
    }
    for (let i = 1; i <= (8 - col < 8 - row ? 8 - col : 8 - row); i++) {
      if (_canCapture(p, row + i, col + i)) {
        setAvailable(prev => [
          ...prev,
          { row: (row + i) as ShogiIndex, col: (col + i) as ShogiIndex },
        ]);
        if (board[row + i][col + i] !== ' ') {
          break;
        }
      } else {
        break;
      }
    }
    for (let i = 1; i <= (8 - row < col ? 8 - row : col); i++) {
      if (_canCapture(p, row + i, col - i)) {
        setAvailable(prev => [
          ...prev,
          { row: (row + i) as ShogiIndex, col: (col - i) as ShogiIndex },
        ]);
        if (board[row + i][col - i] !== ' ') {
          break;
        }
      } else {
        break;
      }
    }
  }

  function _generateGold(p: ShogiCell, row: ShogiIndex, col: ShogiIndex) {
    if (_canCapture(p, row - 1, col)) {
      setAvailable(prev => [...prev, { row: (row - 1) as ShogiIndex, col: col }]);
    }
    if (col >= 1 && _canCapture(p, row - 1, col - 1)) {
      setAvailable(prev => [
        ...prev,
        { row: (row - 1) as ShogiIndex, col: (col - 1) as ShogiIndex },
      ]);
    }
    if (col <= 7 && _canCapture(p, row - 1, col + 1)) {
      setAvailable(prev => [
        ...prev,
        { row: (row - 1) as ShogiIndex, col: (col + 1) as ShogiIndex },
      ]);
    }
    if (col >= 1 && _canCapture(p, row + 1, col - 1)) {
      setAvailable(prev => [
        ...prev,
        { row: (row + 1) as ShogiIndex, col: (col - 1) as ShogiIndex },
      ]);
    }
    if (col <= 7 && _canCapture(p, row + 1, col + 1)) {
      setAvailable(prev => [
        ...prev,
        { row: (row + 1) as ShogiIndex, col: (col + 1) as ShogiIndex },
      ]);
    }
    if (_canCapture(p, row, col - 1)) {
      setAvailable(prev => [...prev, { row: row, col: (col - 1) as ShogiIndex }]);
    }
    if (_canCapture(p, row, col + 1)) {
      setAvailable(prev => [...prev, { row: row, col: (col + 1) as ShogiIndex }]);
    }
  }

  function _generateAvailable(row: ShogiIndex, col: ShogiIndex): void {
    setAvailable([]);
    const p = board[row][col];
    const pU = p?.toUpperCase();
    // Pawn. Moves forward one space
    if (pU === 'P') {
      if (_canCapture(p, row - 1, col)) {
        setAvailable(prev => [...prev, { row: (row - 1) as ShogiIndex, col: col }]);
      }
    } // Lance. Moves forward two spaces
    else if (pU === 'L') {
      for (let i = 1; i <= row; i++) {
        if (_canCapture(p, row - i, col)) {
          setAvailable(prev => [...prev, { row: (row - i) as ShogiIndex, col: col }]);
          if (board[row - i][col] !== ' ') {
            break;
          }
        } else {
          break;
        }
      }
    } // Knight. Moves forward two, left/right one, and jumps over other pieces.
    else if (pU === 'N') {
      if (_canCapture(p, row - 2, col - 1)) {
        setAvailable([
          ...available,
          { row: (row - 2) as ShogiIndex, col: (col - 1) as ShogiIndex },
        ]);
      }
      if (_canCapture(p, row - 2, row + 1)) {
        setAvailable([
          ...available,
          { row: (row - 2) as ShogiIndex, col: (col + 1) as ShogiIndex },
        ]);
      }
    } // Silver General. Moves one square diagonally or straight forward.
    else if (pU === 'S') {
      if (_canCapture(p, row - 1, col)) {
        setAvailable(prev => [...prev, { row: (row - 1) as ShogiIndex, col: col }]);
      }
      if (_canCapture(p, row - 1, col - 1)) {
        setAvailable(prev => [
          ...prev,
          { row: (row - 1) as ShogiIndex, col: (col - 1) as ShogiIndex },
        ]);
      }
      if (_canCapture(p, row - 1, col + 1)) {
        setAvailable(prev => [
          ...prev,
          { row: (row - 1) as ShogiIndex, col: (col + 1) as ShogiIndex },
        ]);
      }
      if (_canCapture(p, (row + 1) as ShogiIndex, (col - 1) as ShogiIndex)) {
        setAvailable(prev => [
          ...prev,
          { row: (row + 1) as ShogiIndex, col: (col - 1) as ShogiIndex },
        ]);
      }
      if (_canCapture(p, row + 1, col + 1)) {
        setAvailable(prev => [
          ...prev,
          { row: (row + 1) as ShogiIndex, col: (col + 1) as ShogiIndex },
        ]);
      }
    } // Gold General. Moves like the Silver General, but can also move sideways
    else if (pU === 'G' || pU === '+S' || pU === '+P' || pU === '+N' || pU === '+L') {
      _generateGold(p, row, col);
    } // Bishop. Travels any number of squares diagonally.
    else if (pU === 'B') {
      _generateBishop(p, row, col);
    } // Rook. It moves like a chess rook.
    else if (pU === 'R') {
      _generateRook(p, row, col);
    } // King. It moves like a chess king.
    else if (pU === 'K') {
      _generateKing(p, row, col);
    } // Dragon (Promoted Rook). Moves like a rook and a king.
    else if (pU === '+R') {
      _generateRook(p, row, col);
      _generateKing(p, row, col);
    } // Horse (Promoted Bishop). Moves like a bishop and a king.
    else if (pU === '+B') {
      _generateBishop(p, row, col);
      _generateKing(p, row, col);
    }
  }

  function selectPiece(row: ShogiIndex, col: ShogiIndex): void {
    setFrom({ row, col });
    _generateAvailable(row, col);
  }

  function getLine(piece: string): string {
    const key: keyof ShogiPieces = (piece[0] === '+'
      ? 'p'.concat(piece[1].toUpperCase())
      : piece.toUpperCase()) as unknown as keyof ShogiPieces;
    return shogiPiecePhotos[key];
  }

  function containsObject(row: number, col: number) {
    let i;
    for (i = 0; i < available.length; i++) {
      if (available[i]?.row === row && available[i]?.col === col) {
        console.log('true');
        return true;
      }
    }
    return false;
  }

  useEffect(() => {
    gameAreaController.addListener('turnChanged', setIsOurTurn);
    gameAreaController.addListener('boardChanged', setBoard);
    return () => {
      gameAreaController.removeListener('boardChanged', setBoard);
      gameAreaController.removeListener('turnChanged', setIsOurTurn);
    };
  }, [gameAreaController]);
  return (
    <StyledShogiBoard aria-label='Shogi Board'>
      {board.map((row, rowIndex) => {
        return row.map((cell, colIndex) => {
          return (
            <StyledShogiSquare
              style={
                containsObject(rowIndex, colIndex)
                  ? { backgroundColor: '#00FF00' }
                  : { backgroundColor: '#deb887' }
              }
              key={`${rowIndex}.${colIndex}`}
              onClick={async () => {
                if (from !== undefined) {
                  if (isOurPiece(rowIndex, colIndex)) {
                    setFrom(undefined);
                    setAvailable([]);
                  } else {
                    try {
                      await gameAreaController.makeMove(
                        (gameAreaController.isBlack ? from.row : 8 - from.row) as ShogiIndex,
                        from.col as ShogiIndex,
                        (gameAreaController.isBlack ? rowIndex : 8 - rowIndex) as ShogiIndex,
                        colIndex as ShogiIndex,
                      );
                    } catch (e) {
                      toast({
                        title: 'Error making move',
                        description: (e as Error).toString(),
                        status: 'error',
                      });
                    }
                    setFrom(undefined);
                    setAvailable([]);
                  }
                } else {
                  selectPiece(rowIndex as ShogiIndex, colIndex as ShogiIndex);
                }
              }}
              disabled={
                !isOurTurn || (isOurTurn && from === undefined && !isOurPiece(rowIndex, colIndex))
              }
              backgroundColor={cell}
              aria-label={`Cell ${rowIndex},${colIndex} (${cell || 'Empty'})`}>
              {board[rowIndex][colIndex] !== ' ' && board[rowIndex][colIndex] !== undefined ? (
                <Image
                  layout='fill'
                  unoptimized
                  quality={25}
                  src={getLine(board[rowIndex][colIndex] as string)}
                  style={
                    !isOurPiece(rowIndex, colIndex) ? { transform: 'rotate(180deg)' } : {}
                  }></Image>
              ) : null}
            </StyledShogiSquare>
          );
        });
      })}
    </StyledShogiBoard>
  );
}
