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

// --- NEW: Progress Bar Component ---
const AllocationProgressBar = ({ currentValue, goal }: { currentValue: number; goal: number }) => {
  // Calculate the percentage, ensuring it doesn't exceed 100%
  const percentage = Math.min((currentValue / goal) * 100, 100);

  return (
    <div className="mt-1 px-2">
      <div className="flex justify-between items-center text-xs text-gray-300 mb-1.5">
        <span className="font-semibold">Allocation Progress</span>
        <span className="font-mono">
          {currentValue.toLocaleString(undefined, {maximumFractionDigits: 0})} / {goal.toLocaleString()} TEMP
        </span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden border border-white/20 shadow-inner">
        <div
          className="bg-white h-full rounded-full transition-all duration-1000 ease-out animate-pulse-glow"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

// --- NEW: Component to display wallet address in a stylized way ---
const ObfuscatedAddress = ({ address }: { address: string }) => {
  // Return the full address if it's too short to be obfuscated
  if (!address || address.length < 9) {
    return <span className="font-mono text-gray-300">{address}</span>;
  }

  const start = address.substring(0, 5);
  const end = address.substring(address.length - 5);
  
  return (
    <div className="inline-flex items-center font-mono text-sm text-gray-300">
      <span>{start}</span>
      <span className="mx-1 blur-[1.5px] select-none text-gray-500">••••••••••••••••••••••••••••</span>
      <span>{end}</span>
    </div>
  );
};


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
  
  // --- NEW: State for total allocation and the goal ---
  const [totalAllocation, setTotalAllocation] = useState(0);
  const ALLOCATION_GOAL = 100000000;

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

    // --- NEW: Calculate total allocated tokens from all participations ---
    const total = data.reduce((acc, item) => acc + Number(item.temp_tokens_assigned || 0), 0);
    setTotalAllocation(total);
    // ---

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
  
  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    setCountdown(60);

    const { error } = await supabase.functions.invoke('scan-presale-participation');

    if (error) {
      console.error("Error invoking scan function:", error);
      setIsRefreshing(false);
      setCountdown(0);
      if(timerRef.current) clearInterval(timerRef.current);
      return;
    }
    
    await fetchLeaderboard();

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
    fetchLeaderboard();
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
    <>
      {/* --- NEW: CSS for the glow animation --- */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 3px rgba(255, 255, 255, 0.6), 0 0 5px rgba(255, 255, 255, 0.4);
          }
          50% {
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.9), 0 0 15px rgba(255, 255, 255, 0.6);
          }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2.5s infinite ease-in-out;
        }

        /* Responsive scaling for leaderboard */
@media (max-width: 1440px) and (min-width: 1024px) {
  .leaderboard-container {
    font-size: 0.9em;
  }
  .leaderboard-container .text-lg {
    font-size: 1rem;
  }
  .leaderboard-container .text-base {
    font-size: 0.8rem;
  }
  .leaderboard-container .text-sm {
    font-size: 0.75rem;
  }
  .leaderboard-container .text-xs {
    font-size: 0.65rem;
  }
}

@media (max-width: 1200px) and (min-width: 1024px) {
  .leaderboard-container {
    font-size: 0.85em;
  }
  .leaderboard-container .text-lg {
    font-size: 0.95rem;
  }
  .leaderboard-container .text-base {
    font-size: 0.75rem;
  }
  .leaderboard-container .text-sm {
    font-size: 0.7rem;
  }
  .leaderboard-container .text-xs {
    font-size: 0.6rem;
  }
}

@media (max-width: 1100px) and (min-width: 1024px) {
  .leaderboard-container {
    font-size: 0.8em;
  }
  .leaderboard-container .text-lg {
    font-size: 0.9rem;
  }
  .leaderboard-container .text-base {
    font-size: 0.7rem;
  }
  .leaderboard-container .text-sm {
    font-size: 0.65rem;
  }
  .leaderboard-container .text-xs {
    font-size: 0.55rem;
  }
}
      `}</style>
      <div className="leaderboard-container w-full h-full flex flex-col gap-2">
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
                  <TableHead className="w-[60px] xl:w-[80px] text-white font-semibold pr-2">Rank</TableHead>
                  <TableHead className="text-white font-semibold">Participant</TableHead>
                  <TableHead className="text-right text-white font-semibold">$TEMP Assigned</TableHead>
                  <TableHead className="text-right text-white font-semibold">USDT Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboardData.map((entry, index) => (
                  <TableRow key={entry.participant_address} className="border-white/10 hover:bg-white/5">
                    <TableCell className="font-medium text-base md:text-lg pr-2">
                    <div className="flex items-center gap-1 xl:gap-2">
                        {index === 0 && <Crown className="h-4 w-4 md:h-5 md:w-5 text-yellow-400" />}
                        {index === 1 && <Crown className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />}
                        {index === 2 && <Crown className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />}
                        <span className="w-6 text-center">{index + 1}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <ObfuscatedAddress address={entry.participant_address} />
                    </TableCell>
                    <TableCell className="text-right font-semibold text-base md:text-lg text-cyan-400">
                      {(entry.total_temp_tokens_assigned || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-white">
                      <div className="flex items-center justify-end gap-1 xl:gap-2">
                          <CircleDollarSign className="h-4 w-4 text-green-400" />
                          <span className="text-sm md:text-base">{(entry.total_usdt_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        {/* --- Render the progress bar at the bottom --- */}
        <div className="mt-auto pt-2 xl:pt-3 border-t border-white/10">
            <AllocationProgressBar currentValue={totalAllocation} goal={ALLOCATION_GOAL} />
        </div>
      </div>
    </>
  );
};

export default Leaderboard;