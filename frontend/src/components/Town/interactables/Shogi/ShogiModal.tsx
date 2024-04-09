import { Flex } from '@chakra-ui/react';
import React from 'react';
import { GenericGameAreaController } from '../../../../classes/interactable/GameAreaController';
import { useInteractableAreaController } from '../../../../classes/TownController';
import { InteractableID } from '../../../../types/CoveyTownSocket';
import ShogiArea from './ShogiArea';

export const INVALID_GAME_AREA_TYPE_MESSAGE = 'Invalid game area type';

/**
 * A generic component that renders a game area.
 *
 * It uses Chakra-UI components (does not use other GUI widgets)
 *
 * It uses the GameAreaController corresponding to the provided interactableID to get the current state of the game. (@see useInteractableAreaController)
 *
 * It renders the following:
 *  - A leaderboard of the game results
 *  - A list of observers' usernames (in a list with the aria-label 'list of observers in the game')
 *  - The game area component (either ConnectFourArea or TicTacToeArea). If the game area is NOT a ConnectFourArea or TicTacToeArea, then the message INVALID_GAME_AREA_TYPE_MESSAGE appears within the component
 *  - A chat channel for the game area (@see ChatChannel.tsx), with the property interactableID set to the interactableID of the game area
 *
 */
export default function ShogiModal({
  interactableID,
}: {
  interactableID: InteractableID;
}): JSX.Element {
  const gameAreaController =
    useInteractableAreaController<GenericGameAreaController>(interactableID);

  return (
    <>
      <Flex flexDirection={'row'} width={'100%'}>
        <ShogiArea interactableID={gameAreaController.id} />
      </Flex>
    </>
  );
}
