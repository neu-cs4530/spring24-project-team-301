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
  const townPlayers = usePlayers().map(player => player.userName);
  const [records, setRecords] = React.useState<ShogiRecordWithRank[]>([]);

  useEffect(() => {
    const getRecords = async (players: string[]) => {
      const allStatsPromises = players.map(async email => {
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
      const newRecords: ShogiRecord[] = await Promise.all(allStatsPromises);

      newRecords.sort((a, b) => {
        // more wins better
        if (a.wins !== b.wins) return b.wins - a.wins;
        // fewer losses better
        if (a.losses !== b.losses) return a.losses - b.losses;
        return 0;
      });

      let currentRank = 1; // Start ranking at 1
      let prevWins = newRecords[0].wins;
      let prevLosses = newRecords[0].losses; // Initialize with the first record
      const recordsWithRank: ShogiRecordWithRank[] = newRecords.map((record, index) => {
        if (index !== 0) {
          // Skip the first record as it's already correctly initialized
          if (record.wins === prevWins && record.losses === prevLosses) {
            // If wins and losses match the previous record, the rank stays the same
          } else {
            currentRank = index + 1; // Update rank based on the current position
            prevWins = record.wins; // Update tracking variables
            prevLosses = record.losses;
          }
        }
        return { ...record, rank: currentRank };
      });

      setRecords(recordsWithRank);
    };
    getRecords(townPlayers);
  }, [townPlayers]);

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
