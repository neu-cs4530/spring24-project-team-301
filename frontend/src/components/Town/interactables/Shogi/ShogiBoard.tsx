import ShogiAreaController, {
  ShogiCell,
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
    width: '400px',
    height: '400px',
    padding: '4px',
    flexWrap: 'wrap',
  },
});
const StyledShogiSquare = chakra(Button, {
  baseStyle: {
    backgroundColor: '#deb887',
    borderRadius: '0px',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
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
  const [from, setFrom] = useState({ row: -1, col: -1 });
  const toast = useToast();

  function getLine(piece: string): string {
    const key: keyof ShogiPieces = (piece[0] === '+'
      ? 'p'.concat(piece[1].toUpperCase())
      : piece.toUpperCase()) as unknown as keyof ShogiPieces;
    return shogiPiecePhotos[key];
  }

  // function isOurPiece(row: number, col: number): boolean {
  //   const piece =
  //     board[row][col]?.charAt(0) === '+' ? board[row][col]?.charAt(1) : board[row][col]?.charAt(0);
  //   console.log(piece);
  //   if (gameAreaController.isBlack) {
  //     if (piece?.toLowerCase() !== piece) {
  //       return true;
  //     } else {
  //       return false;
  //     }
  //   } else {
  //     if (piece?.toUpperCase() !== piece) {
  //       return true;
  //     } else {
  //       return false;
  //     }
  //   }
  // }

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
              key={`${rowIndex}.${colIndex}`}
              onClick={async () => {
                if (from.row !== -1 && !(from.row === rowIndex && from.col === colIndex)) {
                  try {
                    await gameAreaController.makeMove(
                      from.row as ShogiIndex,
                      from.col as ShogiIndex,
                      rowIndex as ShogiIndex,
                      colIndex as ShogiIndex,
                    );
                    setFrom({
                      row: -1,
                      col: -1,
                    });
                  } catch (e) {
                    toast({
                      title: 'Error making move',
                      description: (e as Error).toString(),
                      status: 'error',
                    });
                    setFrom({
                      row: -1,
                      col: -1,
                    });
                  }
                } else if (
                  (from.row === rowIndex && from.row === colIndex) ||
                  (board[rowIndex][colIndex] === ' ' && board[rowIndex][colIndex] === undefined)
                ) {
                  setFrom({
                    row: -1,
                    col: -1,
                  });
                } else {
                  setFrom({
                    row: rowIndex,
                    col: colIndex,
                  });
                }
              }}
              disabled={!isOurTurn}
              backgroundColor={cell}
              aria-label={`Cell ${rowIndex},${colIndex} (${cell || 'Empty'})`}>
              {board[rowIndex][colIndex] !== ' ' && board[rowIndex][colIndex] !== undefined ? (
                <Image
                  layout='fill'
                  unoptimized
                  quality={10}
                  src={getLine(board[rowIndex][colIndex] as string)}></Image>
              ) : null}
            </StyledShogiSquare>
          );
        });
      })}
    </StyledShogiBoard>
  );
}
