import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  Heading,
  List,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useToast,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import { GenericGameAreaController } from '../../../classes/interactable/GameAreaController';
import PlayerController from '../../../classes/PlayerController';
import { useInteractable, useInteractableAreaController } from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';
import { GameResult, InteractableID } from '../../../types/CoveyTownSocket';
import ChatChannel from './ChatChannel';
import ConnectFourArea from './ConnectFour/ConnectFourArea';
import GameAreaInteractable from './GameArea';
import Leaderboard from './Leaderboard';
import TicTacToeArea from './TicTacToe/TicTacToeArea';
import axios from 'axios';
import ShogiModal from './Shogi/ShogiModal';

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
function GameArea({ interactableID }: { interactableID: InteractableID }): JSX.Element {
  const gameAreaController =
    useInteractableAreaController<GenericGameAreaController>(interactableID);
  const townController = useTownController();
  const [history, setHistory] = useState<GameResult[]>(gameAreaController.history);
  const [observers, setObservers] = useState<PlayerController[]>(gameAreaController.observers);

  useEffect(() => {
    const updateGameState = () => {
      setHistory(gameAreaController.history);
      setObservers(gameAreaController.observers);
    };
    gameAreaController.addListener('gameUpdated', updateGameState);
    return () => {
      gameAreaController.removeListener('gameUpdated', updateGameState);
    };
  }, [townController, gameAreaController]);

  function Acc(): JSX.Element {
    return (
      <Accordion allowToggle>
        <AccordionItem>
          <Heading as='h3'>
            <AccordionButton>
              <Box flex='1' textAlign='left'>
                Leaderboard
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <Leaderboard results={history} />
            </AccordionPanel>
          </Heading>
        </AccordionItem>
        <AccordionItem>
          <Heading as='h3'>
            <AccordionButton>
              <Box as='span' flex='1' textAlign='left'>
                Current Observers
                <AccordionIcon />
              </Box>
            </AccordionButton>
          </Heading>
          <AccordionPanel>
            <List aria-label='list of observers in the game'>
              {observers.map(player => {
                return <ListItem key={player.id}>{player.userName}</ListItem>;
              })}
            </List>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    );
  }

  return (
    <>
      {gameAreaController.toInteractableAreaModel().type === 'ShogiArea' ? (
        <ShogiModal interactableID={gameAreaController.id} />
      ) : (
        <div>
          <Acc />
          <Flex>
            <Box>
              {gameAreaController.toInteractableAreaModel().type === 'ConnectFourArea' ? (
                <ConnectFourArea interactableID={interactableID} />
              ) : gameAreaController.toInteractableAreaModel().type === 'TicTacToeArea' ? (
                <TicTacToeArea interactableID={interactableID} />
              ) : (
                <>{INVALID_GAME_AREA_TYPE_MESSAGE}</>
              )}
            </Box>
            <Box
              style={{
                height: '400px',
                overflowY: 'scroll',
              }}>
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                <ChatChannel interactableID={gameAreaController.id} />
              </div>
            </Box>
          </Flex>
        </div>
      )}
    </>
  );
}
/**
 * A wrapper component for the ConnectFourArea and TicTacToeArea components.
 * Determines if the player is currently in a game area on the map, and if so,
 * renders the selected game area component in a modal.
 *
 */
export default function GameAreaWrapper(): JSX.Element {
  const toast = useToast();
  const gameArea = useInteractable<GameAreaInteractable>('gameArea');
  const townController = useTownController();
  const closeModal = useCallback(async () => {
    if (gameArea) {
      townController.interactEnd(gameArea);
      const controller = townController.getGameAreaController(gameArea);
      controller.leaveGame();
      if (
        controller.toInteractableAreaModel().type === 'ShogiArea' &&
        controller.toInteractableAreaModel().game?.state.status === 'IN_PROGRESS' &&
        controller.toInteractableAreaModel().game?.players.includes(townController.ourPlayer?.id)
      ) {
        // update record + display loss modal
        toast({
          title: 'Game over (you left)',
          description: `You lost :(`,
          status: 'error',
        });
        console.log('You leave = you lose');
        const body = {
          email: townController.ourPlayer?.userName,
        };
        const res = await axios.put(`${process.env.NEXT_PUBLIC_TOWNS_SERVICE_URL}/lose`, body);
        console.log(res);
        if (res.status !== 200) {
          throw new Error('Failed to register loss');
        }
        console.log('Record updates successful');
      }
    }
  }, [gameArea, townController, toast]);
  if (gameArea) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const gameAreaController = useInteractableAreaController<GenericGameAreaController>(
      gameArea?.id as string,
    );
    return (
      <Modal
        isOpen={true}
        onClose={closeModal}
        closeOnOverlayClick={false}
        size={gameAreaController.toInteractableAreaModel().type === 'ShogiArea' ? 'full' : 'xl'}>
        <ModalOverlay />
        <ModalContent bg='gray.900' color='whiteAlpha.900'>
          <ModalHeader>
            <Heading>{gameArea.name}</Heading>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <GameArea interactableID={gameArea.id} />
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }
  return <></>;
}
