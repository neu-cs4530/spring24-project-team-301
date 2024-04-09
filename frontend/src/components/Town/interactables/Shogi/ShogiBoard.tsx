import ShogiAreaController, {
  ShogiCell,
  ShogiCoord,
} from '../../../../classes/interactable/ShogiAreaController';
import {
  Button,
  chakra,
  Container,
  Flex,
  Box,
  useToast,
  Heading,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { ShogiIndex, ShogiPiece } from '../../../../types/CoveyTownSocket';
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
  const [drops, setDrops] = useState<string[]>(gameAreaController.drops);
  const [isOurTurn, setIsOurTurn] = useState(gameAreaController.isOurTurn);
  const [from, setFrom] = useState<ShogiCoord>(undefined);
  const [to, setTo] = useState<ShogiCoord>({ row: 0, col: 0 });
  const [available, setAvailable] = useState<ShogiCoord[]>([]);
  const [dropPiece, setDropPiece] = useState<ShogiPiece>(' ');
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

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

  function _generateKing(
    p: ShogiCell,
    row: ShogiIndex,
    col: ShogiIndex,
    av: ShogiCoord[],
  ): ShogiCoord[] {
    if (_canCapture(p, row - 1, col)) {
      av.push({ row: (row - 1) as ShogiIndex, col: col });
    }
    if (_canCapture(p, row - 1, col - 1)) {
      av.push({ row: (row - 1) as ShogiIndex, col: (col - 1) as ShogiIndex });
    }
    if (_canCapture(p, row - 1, col + 1)) {
      av.push({ row: (row - 1) as ShogiIndex, col: (col + 1) as ShogiIndex });
    }
    if (_canCapture(p, row + 1, col - 1)) {
      av.push({ row: (row + 1) as ShogiIndex, col: (col - 1) as ShogiIndex });
    }
    if (_canCapture(p, row + 1, col + 1)) {
      av.push({ row: (row + 1) as ShogiIndex, col: (col + 1) as ShogiIndex });
    }
    if (_canCapture(p, row, col - 1)) {
      av.push({ row: row, col: (col - 1) as ShogiIndex });
    }
    if (_canCapture(p, row, col + 1)) {
      av.push({ row: row, col: (col + 1) as ShogiIndex });
    }
    if (_canCapture(p, row, col + 1)) {
      av.push({ row: row, col: (col + 1) as ShogiIndex });
    }
    if (_canCapture(p, row + 1, col + 1)) {
      av.push({ row: row, col: (col + 1) as ShogiIndex });
    }
    if (_canCapture(p, row + 1, col + 1)) {
      av.push({ row: row, col: (col + 1) as ShogiIndex });
    }
    if (_canCapture(p, row + 1, col - 1)) {
      av.push({ row: row, col: (col + 1) as ShogiIndex });
    }
    return av;
  }

  function _generateRook(
    p: ShogiCell,
    row: ShogiIndex,
    col: ShogiIndex,
    av: ShogiCoord[],
  ): ShogiCoord[] {
    for (let i = 1; i <= col; i++) {
      if (_canCapture(p, row, col - i)) {
        av.push({ row: row, col: (col - i) as ShogiIndex });
        if (board[row][col - i] !== ' ') {
          break;
        }
      } else {
        break;
      }
    }
    for (let i = 1; i <= 8 - col; i++) {
      if (_canCapture(p, row, col + i)) {
        av.push({ row: row, col: (col + i) as ShogiIndex });
        if (board[row][col + i] !== ' ') {
          break;
        }
      } else {
        break;
      }
    }
    for (let i = 1; i <= row; i++) {
      if (_canCapture(p, row - i, col)) {
        av.push({ row: (row - i) as ShogiIndex, col: col });
        if (board[row - i][col] !== ' ') {
          break;
        }
      } else {
        break;
      }
    }
    for (let i = 1; i <= 8 - row; i++) {
      if (_canCapture(p, row + i, col)) {
        av.push({ row: (row + i) as ShogiIndex, col: col });
        if (board[row + i][col] !== ' ') {
          break;
        }
      } else {
        break;
      }
    }
    return av;
  }

  function _generateBishop(
    p: ShogiCell,
    row: ShogiIndex,
    col: ShogiIndex,
    av: ShogiCoord[],
  ): ShogiCoord[] {
    for (let i = 1; i <= (col < row ? col : row); i++) {
      if (_canCapture(p, row - i, col - i)) {
        av.push({ row: (row - i) as ShogiIndex, col: (col - i) as ShogiIndex });
        if (board[row - i][col - i] !== ' ') {
          break;
        }
      } else {
        break;
      }
    }
    for (let i = 1; i <= (8 - col < row ? 8 - col : row); i++) {
      if (_canCapture(p, row - i, col + i)) {
        av.push({ row: (row - i) as ShogiIndex, col: (col + i) as ShogiIndex });
        if (board[row - i][col + i] !== ' ') {
          break;
        }
      } else {
        break;
      }
    }
    for (let i = 1; i <= (8 - col < 8 - row ? 8 - col : 8 - row); i++) {
      if (_canCapture(p, row + i, col + i)) {
        av.push({ row: (row + i) as ShogiIndex, col: (col + i) as ShogiIndex });
        if (board[row + i][col + i] !== ' ') {
          break;
        }
      } else {
        break;
      }
    }
    for (let i = 1; i <= (8 - row < col ? 8 - row : col); i++) {
      if (_canCapture(p, row + i, col - i)) {
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

  function _generateGold(
    p: ShogiCell,
    row: ShogiIndex,
    col: ShogiIndex,
    av: ShogiCoord[],
  ): ShogiCoord[] {
    if (_canCapture(p, row - 1, col)) {
      av.push({ row: (row - 1) as ShogiIndex, col: col });
    }
    if (col >= 1 && _canCapture(p, row - 1, col - 1)) {
      av.push({ row: (row - 1) as ShogiIndex, col: (col - 1) as ShogiIndex });
    }
    if (col <= 7 && _canCapture(p, row - 1, col + 1)) {
      av.push({ row: (row - 1) as ShogiIndex, col: (col + 1) as ShogiIndex });
    }
    if (col >= 1 && _canCapture(p, row + 1, col - 1)) {
      av.push({ row: (row + 1) as ShogiIndex, col: (col - 1) as ShogiIndex });
    }
    if (col <= 7 && _canCapture(p, row + 1, col + 1)) {
      av.push({ row: (row + 1) as ShogiIndex, col: (col + 1) as ShogiIndex });
    }
    if (_canCapture(p, row, col - 1)) {
      av.push({ row: row, col: (col - 1) as ShogiIndex });
    }
    if (_canCapture(p, row, col + 1)) {
      av.push({ row: row, col: (col + 1) as ShogiIndex });
    }
    return av;
  }

  function _generateAvailable(row: ShogiIndex, col: ShogiIndex): void {
    const av: ShogiCoord[] = [];
    const p = board[row][col];
    const pU = p?.toUpperCase();
    // Pawn. Moves forward one space
    if (pU === 'P') {
      if (_canCapture(p, row - 1, col)) {
        av.push({ row: (row - 1) as ShogiIndex, col: col });
      }
    } // Lance. Moves forward two spaces
    else if (pU === 'L') {
      for (let i = 1; i <= row; i++) {
        if (_canCapture(p, row - i, col)) {
          av.push({ row: (row - i) as ShogiIndex, col: col });
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
        av.push({ row: (row - 2) as ShogiIndex, col: (col - 1) as ShogiIndex });
      }
      if (_canCapture(p, row - 2, row + 1)) {
        av.push({ row: (row - 2) as ShogiIndex, col: (col + 1) as ShogiIndex });
      }
    } // Silver General. Moves one square diagonally or straight forward.
    else if (pU === 'S') {
      if (_canCapture(p, row - 1, col)) {
        av.push({ row: (row - 1) as ShogiIndex, col: col });
      }
      if (_canCapture(p, row - 1, col - 1)) {
        av.push({ row: (row - 1) as ShogiIndex, col: (col - 1) as ShogiIndex });
      }
      if (_canCapture(p, row - 1, col + 1)) {
        av.push({ row: (row - 1) as ShogiIndex, col: (col + 1) as ShogiIndex });
      }
      if (_canCapture(p, (row + 1) as ShogiIndex, (col - 1) as ShogiIndex)) {
        av.push({ row: (row + 1) as ShogiIndex, col: (col - 1) as ShogiIndex });
      }
      if (_canCapture(p, row + 1, col + 1)) {
        av.push({ row: (row + 1) as ShogiIndex, col: (col + 1) as ShogiIndex });
      }
    } // Gold General. Moves like the Silver General, but can also move sideways
    else if (pU === 'G' || pU === '+S' || pU === '+P' || pU === '+N' || pU === '+L') {
      _generateGold(p, row, col, av);
    } // Bishop. Travels any number of squares diagonally.
    else if (pU === 'B') {
      _generateBishop(p, row, col, av);
    } // Rook. It moves like a chess rook.
    else if (pU === 'R') {
      _generateRook(p, row, col, av);
    } // King. It moves like a chess king.
    else if (pU === 'K') {
      _generateKing(p, row, col, av);
    } // Dragon (Promoted Rook). Moves like a rook and a king.
    else if (pU === '+R') {
      _generateKing(p, row, col, _generateRook(p, row, col, av));
    } // Horse (Promoted Bishop). Moves like a bishop and a king.
    else if (pU === '+B') {
      _generateKing(p, row, col, _generateBishop(p, row, col, av));
    }
    setAvailable(av);
  }

  function selectPiece(row: ShogiIndex, col: ShogiIndex): void {
    setFrom({ row, col });
    _generateAvailable(row, col);
  }

  function getLine(piece: string): string {
    const key: keyof ShogiPieces = (piece[0] === '+' && piece.length > 1
      ? 'p'.concat(piece[1].toUpperCase())
      : piece.toUpperCase()) as unknown as keyof ShogiPieces;
    return shogiPiecePhotos[key];
  }

  function containsObject(row: number, col: number) {
    let i;
    for (i = 0; i < available.length; i++) {
      if (available[i]?.row === row && available[i]?.col === col) {
        return true;
      }
    }
    return false;
  }

  function getAllOpenSquares() {
    const av: ShogiCoord[] = [];
    board.forEach((row, rowIndex) =>
      row.forEach((col, colIndex) => {
        if (board[rowIndex][colIndex] === ' ') {
          av.push({ row: rowIndex as ShogiIndex, col: colIndex as ShogiIndex });
        }
      }),
    );
    setAvailable(av);
  }

  async function makeMove(
    rowIndex: ShogiIndex,
    colIndex: ShogiIndex,
    promotion = false,
  ): Promise<void> {
    if (!from) return;
    if (!to) return;
    const toRow = promotion ? to.row : rowIndex;
    const toCol = promotion ? to.col : colIndex;
    try {
      await gameAreaController.makeMove(
        (gameAreaController.isBlack ? from.row : 8 - from.row) as ShogiIndex,
        from.col as ShogiIndex,
        (gameAreaController.isBlack ? toRow : 8 - toRow) as ShogiIndex,
        toCol as ShogiIndex,
        dropPiece,
        promotion,
      );
    } catch (e) {
      toast({
        title: 'Error making move',
        description: (e as Error).toString(),
        status: 'error',
      });
    }
    setAvailable([]);
    setFrom(undefined);
    setDropPiece(' ');
  }

  function promptPromotionModal(row: ShogiIndex, col: ShogiIndex, piece: ShogiCell) {
    if (!piece) {
      return false;
    }
    // Piece was not dropped this turn
    if (dropPiece === ' ') {
      // The piece is within the promotion zone
      if ((from && from.row <= 2) || row <= 2) {
        if (piece.toUpperCase() === 'P' || piece.toUpperCase() === 'L') {
          // Pawns and Lances can only move forward, so it's forced to promote
          if (row === 0) {
            makeMove(row, col, true);
            return false;
          } else {
            setTo({ row: row, col: col });
            return true;
          }
        } else if (piece.toUpperCase() === 'N') {
          // Knights can only move forward as well, so it's forced to promote
          if (row <= 1) {
            makeMove(row, col, true);
            return false;
          } else {
            setTo({ row: row, col: col });
            return true;
          }
        }
        setTo({ row: row, col: col });
        return true;
      } // Piece is outside of the promotion zone
      else {
        makeMove(row, col);
        return false;
      }
    } // Piece was not dropped this turn
    else {
      makeMove(row, col);
      return false;
    }
  }

  useEffect(() => {
    gameAreaController.addListener('turnChanged', setIsOurTurn);
    gameAreaController.addListener('boardChanged', setBoard);
    gameAreaController.addListener('inhandChanged', setDrops);
    return () => {
      gameAreaController.removeListener('boardChanged', setBoard);
      gameAreaController.removeListener('turnChanged', setIsOurTurn);
      gameAreaController.removeListener('inhandChanged', setDrops);
    };
  }, [gameAreaController]);
  return (
    <>
      <StyledShogiBoard aria-label='Shogi Board'>
        {board.map((row, rowIndex) => {
          return row.map((cell, colIndex) => {
            return (
              <>
                <StyledShogiSquare
                  style={
                    containsObject(rowIndex, colIndex)
                      ? { backgroundColor: '#00FF00' }
                      : { backgroundColor: '#deb887' }
                  }
                  _focus={{ outline: 0 }}
                  key={`${rowIndex}.${colIndex}`}
                  onClick={async () => {
                    if (from !== undefined) {
                      if (isOurPiece(rowIndex, colIndex)) {
                        setFrom(undefined);
                        setAvailable([]);
                        setDropPiece(' ');
                      } else {
                        console.log('hello');
                        if (
                          promptPromotionModal(rowIndex as ShogiIndex, colIndex as ShogiIndex, cell)
                        ) {
                          onOpen();
                        }
                      }
                    } else {
                      selectPiece(rowIndex as ShogiIndex, colIndex as ShogiIndex);
                    }
                  }}
                  disabled={
                    !isOurTurn ||
                    (isOurTurn && from === undefined && !isOurPiece(rowIndex, colIndex))
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
                        gameAreaController.isActive()
                          ? !isOurPiece(rowIndex, colIndex)
                            ? { transform: 'rotate(180deg)' }
                            : {}
                          : board[rowIndex][colIndex]?.toUpperCase() !== board[rowIndex][colIndex]
                          ? { transform: 'rotate(180deg)' }
                          : {}
                      }></Image>
                  ) : null}
                </StyledShogiSquare>
                <Modal isOpen={isOpen} onClose={onClose} motionPreset='none'>
                  <ModalOverlay />
                  <ModalContent>
                    <ModalHeader>Do you want to promote this piece?</ModalHeader>
                    <ModalBody>Once you promote your piece, you cannot change it back.</ModalBody>
                    <ModalFooter>
                      <Button
                        colorScheme='blue'
                        mr={3}
                        onClick={() => {
                          makeMove(rowIndex as ShogiIndex, colIndex as ShogiIndex, true);
                          onClose();
                        }}>
                        Yes
                      </Button>
                      <Button
                        colorScheme='red'
                        onClick={() => {
                          makeMove(rowIndex as ShogiIndex, colIndex as ShogiIndex);
                          onClose();
                        }}>
                        No
                      </Button>
                    </ModalFooter>
                  </ModalContent>
                </Modal>
              </>
            );
          });
        })}
      </StyledShogiBoard>
      <Box w='20%' h='600px' bg='gray.200' color='gray.800' textAlign='center'>
        <Heading as='h3'>Pieces in hand</Heading>
        <Flex w='88%' h='300px' bg='gray.200' alignContent='flex-start' flexWrap='wrap'>
          {drops.map(function (piece, index) {
            return (
              <StyledShogiSquare
                key={`${index}`}
                border='none'
                onClick={() => {
                  setFrom({ row: 0, col: 0 });
                  setDropPiece(piece as ShogiPiece);
                  getAllOpenSquares();
                }}>
                <Image layout='fill' unoptimized quality={25} src={getLine(piece)}></Image>
              </StyledShogiSquare>
            );
          })}
        </Flex>
        <Heading>Info</Heading>
      </Box>
    </>
  );
}
