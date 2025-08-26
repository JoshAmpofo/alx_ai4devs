'use client'

import { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import { Poll } from "@/types/Poll";
import { Button } from '@/components/ui/button';

async function getPoll(id: string): Promise<Poll | null> {
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching poll:", error);
    return null;
  }

  return data as Poll;
}

export default function PollPage({ params }: { params: { id: string } }) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    getPoll(params.id).then(setPoll);
  }, [params.id]);

  const handleVote = async () => {
    if (!selectedOption) {
      alert("Please select an option to vote.");
      return;
    }

    setIsVoting(true);
    const { data, error } = await supabase.rpc('vote', { 
      poll_id: poll?.id, 
      option_text: selectedOption 
    });

    if (error) {
      console.error('Error voting:', error);
      alert("Error submitting your vote. Please try again.");
    } else {
      // Refresh poll data to show new vote
      getPoll(params.id).then(setPoll);
    }
    setIsVoting(false);
  };

  if (!poll) {
    return <div className="container mx-auto py-8 text-center">Loading poll...</div>;
  }

  const totalVotes = poll.options.reduce((acc, option) => acc + option.votes, 0);

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">{poll.question}</h1>
          <p className="mt-3 text-lg text-gray-500">Created at {new Date(poll.created_at).toLocaleString()}</p>
        </div>

        <div className="space-y-4">
          {poll.options.map((option, index) => (
            <div 
              key={index} 
              className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedOption === option.text ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}
              onClick={() => setSelectedOption(option.text)}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">{option.text}</span>
                {totalVotes > 0 && (
                  <span className="text-lg font-semibold">
                    {option.votes} ({((option.votes / totalVotes) * 100).toFixed(1)}%)
                  </span>
                )}
              </div>
              {totalVotes > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${(option.votes / totalVotes) * 100}%` }}
                  ></div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4">
          <Button 
            onClick={handleVote} 
            disabled={!selectedOption || isVoting}
            className="w-full md:w-auto"
            size="lg"
          >
            {isVoting ? 'Voting...' : 'Vote'}
          </Button>
        </div>
      </div>
    </div>
  );
}
