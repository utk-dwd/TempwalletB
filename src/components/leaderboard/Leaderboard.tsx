import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Crown, RefreshCw, CircleDollarSign } from 'lucide-react';
import { CardTitle } from '@/components/ui/card';

// Define the structure of our leaderboard data
interface LeaderboardEntry {
  participant_address: string;
  total_usdt_amount: number;
  total_temp_tokens_assigned: number;
}

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // This function fetches and processes the data from Supabase
  const fetchLeaderboard = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('presale_participations')
      .select('participant_address, usdt_amount, temp_tokens_assigned');

    if (error) {
      console.error('Error fetching leaderboard data:', error);
      setLoading(false);
      return;
    }

    const participants = new Map<string, { usdt: number; temp: number }>();
    data.forEach(item => {
      const current = participants.get(item.participant_address) || { usdt: 0, temp: 0 };
      participants.set(item.participant_address, {
        usdt: current.usdt + Number(item.usdt_amount || 0),
        temp: current.temp + (Number(item.temp_tokens_assigned) || 0)
      });
    });

    const sortedData = Array.from(participants, ([participant_address, totals]) => ({
      participant_address,
      total_usdt_amount: totals.usdt,
      total_temp_tokens_assigned: totals.temp,
    })).sort((a, b) => b.total_usdt_amount - a.total_usdt_amount);

    setLeaderboardData(sortedData);
    setLoading(false);
  };
  
  // This function handles the refresh button click
  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    setCountdown(60);

    // Invoke the backend function to scan for new transactions
    const { error } = await supabase.functions.invoke('scan-presale-participation');

    if (error) {
      console.error("Error invoking scan function:", error);
      setIsRefreshing(false);
      setCountdown(0);
      if(timerRef.current) clearInterval(timerRef.current);
      return;
    }
    
    // After the function is invoked, fetch the updated leaderboard data
    await fetchLeaderboard();

    // Start the countdown timer
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsRefreshing(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    // Fetch initial data on component mount
    fetchLeaderboard();

    // Cleanup timer on component unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  };

  return (
    <div className="w-full h-full flex flex-col gap-2">
      <div className="flex justify-between items-center mb-2">
          <CardTitle className="text-white text-lg">Presale Participants</CardTitle>
          <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="ghost"
              className="text-white hover:text-gray-300 hover:bg-white/10 transition-all duration-200 group disabled:opacity-50"
          >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? `Next refresh in ${formatTime(countdown)}` : 'Refresh'}
          </Button>
      </div>
  
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {loading && leaderboardData.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Loading Top Participants...</p>
        ) : leaderboardData.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No participants yet. Be the first!</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/20 hover:bg-transparent">
                <TableHead className="w-[100px] text-white font-semibold">Rank</TableHead>
                <TableHead className="text-white font-semibold">Participant</TableHead>
                <TableHead className="text-right text-white font-semibold">$TEMP Tokens</TableHead>
                <TableHead className="text-right text-white font-semibold">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboardData.map((entry, index) => (
                <TableRow key={entry.participant_address} className="border-white/10 hover:bg-white/5">
                  <TableCell className="font-medium text-lg">
                    <div className="flex items-center gap-2">
                      {index === 0 && <Crown className="h-5 w-5 text-yellow-400" />}
                      {index === 1 && <Crown className="h-5 w-5 text-gray-400" />}
                      {index === 2 && <Crown className="h-5 w-5 text-yellow-600" />}
                      <span>{index + 1}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-gray-300">{entry.participant_address}</TableCell>
                  <TableCell className="text-right font-semibold text-lg text-cyan-400">
                    {(entry.total_temp_tokens_assigned || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-white">
                    <div className="flex items-center justify-end gap-2">
                        <CircleDollarSign className="h-4 w-4 text-green-400" />
                        <span>{(entry.total_usdt_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
