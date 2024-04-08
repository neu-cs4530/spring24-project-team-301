import { Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import React, { useEffect } from 'react';
import axios from 'axios';
import { usePlayers } from '../../../classes/TownController';

type ShogiRecord = {
  email: string;
  wins: number;
  losses: number;
  draws: number;
};
type ShogiRecordWithRank = ShogiRecord & { rank: number };

export default function ShogiLeaderboard(): JSX.Element {
  const players = usePlayers();
  const [records, setRecords] = React.useState<ShogiRecordWithRank[]>([]);

  // update when players join/leave the town
  useEffect(() => {
    const updateRecords = async () => {
      const townPlayers = players.map(player => player.userName);
      const newPlayers = townPlayers.filter(
        player => !records.some(record => record.email === player),
      );
      const playersToRemove = records.filter(record => !townPlayers.includes(record.email));

      let updatedRecords: ShogiRecord[] = [];
      // get records for new players
      if (newPlayers.length > 0) {
        const newStatsPromises = newPlayers.map(async email => {
          const [resWins, resLosses, resDraws] = await Promise.all([
            axios.get(`${process.env.NEXT_PUBLIC_TOWNS_SERVICE_URL}/wins?email=${email}`),
            axios.get(`${process.env.NEXT_PUBLIC_TOWNS_SERVICE_URL}/losses?email=${email}`),
            axios.get(`${process.env.NEXT_PUBLIC_TOWNS_SERVICE_URL}/draws?email=${email}`),
          ]);
          return {
            email,
            wins: resWins.data.wins,
            losses: resLosses.data.losses,
            draws: resDraws.data.draws,
          };
        });
        const newRecords: ShogiRecord[] = await Promise.all(newStatsPromises);

        updatedRecords = [
          ...records.filter(
            record =>
              !playersToRemove.some(playerToRemove => playerToRemove.email === record.email),
          ),
          ...newRecords,
        ];
      } else if (playersToRemove.length > 0) {
        // remove players who left
        updatedRecords = records.filter(
          record => !playersToRemove.some(playerToRemove => playerToRemove.email === record.email),
        );
      }

      // ...re-rank the changed list
      // LEADERBOARD RANKING LOGIC: sort by wins descending, settle ties by losses ascending (draws do not matter). If two players have the same wins and losses, they receive the same rank
      updatedRecords.sort((a, b) => {
        // more wins better
        if (a.wins !== b.wins) return b.wins - a.wins;
        // fewer losses better
        if (a.losses !== b.losses) return a.losses - b.losses;
        return 0;
      });

      if (updatedRecords.length > 0) {
        let currentRank = 1;
        let prevWins = updatedRecords[0].wins;
        let prevLosses = updatedRecords[0].losses;
        const recordsWithRank: ShogiRecordWithRank[] = updatedRecords.map((record, index) => {
          if (index !== 0) {
            // compare current record with previous and assign a rank
            if (record.wins === prevWins && record.losses === prevLosses) {
              // same as previous rank
            } else {
              // lower rank
              currentRank = index + 1;
              prevWins = record.wins;
              prevLosses = record.losses;
            }
          }
          return { ...record, rank: currentRank };
        });
        setRecords(recordsWithRank);
      }
    };

    updateRecords();
  }, [records, players]);

  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Rank</Th>
          <Th>Player</Th>
          <Th>Record</Th>
        </Tr>
      </Thead>
      <Tbody>
        {records.map(record => {
          return (
            <Tr key={record.email}>
              <Td fontSize='md' fontWeight='normal'>
                {record.rank}
              </Td>
              <Td fontSize='md' fontWeight='normal'>
                {record.email}
              </Td>
              <Td fontSize='md' fontWeight='normal'>
                ({record.wins}-{record.losses}-{record.draws})
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
}
