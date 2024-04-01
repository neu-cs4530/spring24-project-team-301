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
const StyledShogiBoard = chakra(Container, {
  baseStyle: {
    display: 'flex',
    width: '400px',
    height: '400px',
    padding: '5px',
    flexWrap: 'wrap',
  },
});
const StyledShogiSquare = chakra(Button, {
  baseStyle: {
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    alignItems: 'center',
    flexBasis: 'auto',
    border: '1px solid black',
    fontSize: '50px',
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
                  } catch (e) {
                    toast({
                      title: 'Error making move',
                      description: (e as Error).toString(),
                      status: 'error',
                    });
                  }
                } else if (from.row === rowIndex && from.row === colIndex) {
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
              {board[rowIndex][colIndex] ? (
                <Image src={board[rowIndex][colIndex]?.toUpperCase() as string}></Image>
              ) : null}
            </StyledShogiSquare>
          );
        });
      })}
    </StyledShogiBoard>
  );
}
