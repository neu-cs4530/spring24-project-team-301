import ShogiAreaController, {
  Coord,
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
  Switch,
  Heading,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Text,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { ShogiIndex, ShogiPiece } from '../../../../types/CoveyTownSocket';
import Image from 'next/image';
import {
  Dict,
  ShogiPieces,
  traditionalPieces,
  westernPieces,
  names,
  descriptions,
} from './ShogiTypes';
import generateAvailable from './AvailableSquares';
import { NONE } from 'phaser';

export type ShogiGameProps = {
  gameAreaController: ShogiAreaController;
};
const StyledShogiBoard = chakra(Container, {
  baseStyle: {
    display: 'flex',
    alignContent: 'flex-start',
    width: '600px',
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
  const [western, setWestern] = useState<boolean>(false);
  const [hover, setHover] = useState<ShogiCell>(' ');
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

  function selectPiece(coord: Coord): void {
    setFrom(coord);
    setAvailable(generateAvailable(coord, board));
  }

  function reset(): void {
    setAvailable([]);
    setFrom(undefined);
    setDropPiece(' ');
  }

  function getLine(piece: string, type: Dict): string {
    const key: keyof ShogiPieces = (piece[0] === '+' && piece.length > 1
      ? 'p'.concat(piece[1].toUpperCase())
      : piece.toUpperCase()) as unknown as keyof ShogiPieces;
    return type === 0
      ? names[key]
      : type === 1
      ? descriptions[key]
      : type === 2
      ? traditionalPieces[key]
      : westernPieces[key];
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
    reset();
  }

  function promptPromotionModal(row: ShogiIndex, col: ShogiIndex, piece: ShogiCell) {
    if (!piece) {
      return false;
    }
    console.log(piece);
    // Piece was not dropped this turn and piece is not already promoted
    if (dropPiece === ' ' && piece[0] !== '+') {
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

  function getInfoHeading(): string {
    if (!hover || hover === ' ') {
      return 'Info';
    } else {
      return getLine(hover, 0);
    }
  }
  function getText(): string {
    if (!hover || hover === ' ') {
      return 'Hover over one of your pieces to see information';
    } else {
      return getLine(hover, 1);
    }
  }
  function GetImage(): JSX.Element {
    if (hover && hover !== ' ') {
      return (
        <Image
          width={50}
          height={50}
          unoptimized
          quality={100}
          src={getLine(hover, western ? 3 : 2)}></Image>
      );
    } else {
      return <></>;
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
                        reset();
                      } else {
                        if (
                          promptPromotionModal(
                            rowIndex as ShogiIndex,
                            colIndex as ShogiIndex,
                            board[from.row][from.col],
                          )
                        ) {
                          onOpen();
                        }
                      }
                    } else {
                      selectPiece({ row: rowIndex as ShogiIndex, col: colIndex as ShogiIndex });
                    }
                  }}
                  onMouseEnter={() => setHover(cell)}
                  onMouseLeave={() => setHover(' ')}
                  disabled={
                    !isOurTurn ||
                    (isOurTurn && from === undefined && !isOurPiece(rowIndex, colIndex))
                  }
                  aria-label={`Cell ${rowIndex},${colIndex} (${cell || 'Empty'})`}>
                  {board[rowIndex][colIndex] !== ' ' && board[rowIndex][colIndex] !== undefined ? (
                    <Image
                      layout='fill'
                      unoptimized
                      quality={100}
                      src={getLine(board[rowIndex][colIndex] as string, western ? 3 : 2)}
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
                  <ModalOverlay opacity={0.01} border='none' bg='black' blur={0.15} />
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
        <Flex alignItems='center'>
          <Text mb='0' mr='10px'>
            {western ? 'Western Pieces' : 'Traditional Pieces'}
          </Text>
          <Switch
            checked={western}
            onChange={() => {
              setWestern(prev => !prev);
            }}
          />
        </Flex>
      </StyledShogiBoard>
      <Box w='20%' h='600px' bg='gray.200' color='gray.800' textAlign='center'>
        <Heading as='h3'>Pieces in hand</Heading>
        <Flex w='88%' h='300px' bg='gray.200' alignContent='flex-start' flexWrap='wrap'>
          {drops.map(function (piece, index) {
            return (
              <StyledShogiSquare
                key={`${index}`}
                border='none'
                bg='grey.200'
                onClick={() => {
                  setFrom({ row: 0, col: 0 });
                  setDropPiece(piece as ShogiPiece);
                  getAllOpenSquares();
                }}>
                <Image
                  layout='fill'
                  unoptimized
                  quality={100}
                  src={getLine(piece, western ? 3 : 2)}></Image>
              </StyledShogiSquare>
            );
          })}
        </Flex>
        <Box h='200px'>
          <Heading>{getInfoHeading()}</Heading>
          <Text fontSize='sm'>{getText()}</Text>
        </Box>
        <GetImage />
      </Box>
    </>
  );
}
