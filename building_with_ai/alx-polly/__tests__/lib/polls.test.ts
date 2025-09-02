import {
  createPoll,
  getPollWithOptions,
  getUserPolls,
  castVote,
  hasUserVoted,
  deletePoll,
  updatePoll,
  updatePollOptions,
  updatePollComplete,
} from '@/lib/polls';
import { supabase } from '@/lib/supabase/client';

// Mock the supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('lib/polls', () => {
  const from = supabase.from as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPoll', () => {
    it('should create a poll and its options', async () => {
      const pollData = {
        question: 'What is your favorite color?',
        options: ['Red', 'Green', 'Blue'],
      };
      const userId = 'user-123';

      const pollInsertMock = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'poll-1' }, error: null }),
      };
      const optionsInsertMock = {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };

      from.mockImplementation((tableName) => {
        if (tableName === 'polls') return pollInsertMock;
        if (tableName === 'poll_options') return optionsInsertMock;
      });

      const pollId = await createPoll(pollData, userId);

      expect(pollId).toBe('poll-1');
      expect(from).toHaveBeenCalledWith('polls');
      expect(pollInsertMock.insert).toHaveBeenCalledWith({
        question: 'What is your favorite color?',
        description: null,
        expires_at: undefined,
        created_by: userId,
      });
      expect(from).toHaveBeenCalledWith('poll_options');
      expect(optionsInsertMock.insert).toHaveBeenCalledWith([
        { poll_id: 'poll-1', label: 'Red' },
        { poll_id: 'poll-1', label: 'Green' },
        { poll_id: 'poll-1', label: 'Blue' },
      ]);
    });

    it('should throw an error if less than 2 options are provided', async () => {
      const pollData = { question: 'Is this a poll?', options: ['Yes'] };
      await expect(createPoll(pollData, 'user-123')).rejects.toThrow('At least 2 options are required');
    });
  });

  describe('getPollWithOptions', () => {
    it('should return a poll with options and vote counts', async () => {
      const pollId = 'poll-1';
      const pollsMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: pollId, question: 'Test Poll', description: null, created_by: 'user-123', created_at: '2023-01-01', expires_at: null },
          error: null,
        }),
      };
      const voteCountsMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ option_id: 'opt-1', vote_count: 5 }, { option_id: 'opt-2', vote_count: 10 }],
          error: null,
        }),
      };
      const optionsMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [{ id: 'opt-1', label: 'Option 1' }, { id: 'opt-2', label: 'Option 2' }],
          error: null,
        }),
      };

      from.mockImplementation((tableName) => {
        if (tableName === 'polls') return pollsMock;
        if (tableName === 'poll_option_vote_counts') return voteCountsMock;
        if (tableName === 'poll_options') return optionsMock;
      });

      const poll = await getPollWithOptions(pollId);

      expect(poll).not.toBeNull();
      expect(poll?.id).toBe(pollId);
      expect(poll?.options[0]).toEqual({ id: 'opt-1', label: 'Option 1', voteCount: 5 });
      expect(poll?.options[1]).toEqual({ id: 'opt-2', label: 'Option 2', voteCount: 10 });
    });

    it('should return null if poll not found', async () => {
      const pollsMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      };
      from.mockReturnValue(pollsMock);
      const poll = await getPollWithOptions('non-existent');
      expect(poll).toBeNull();
    });
  });

  describe('getUserPolls', () => {
    it('should return polls for a user', async () => {
      const userId = 'user-123';
      const pollsMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [{ id: 'poll-1', question: 'Test Poll', created_by: userId }],
          error: null,
        }),
      };
      const optionsMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [{ id: 'opt-1', label: 'Option 1' }],
          error: null,
        }),
      };
      const voteCountsMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ option_id: 'opt-1', vote_count: 5 }],
          error: null,
        }),
      };

      from.mockImplementation((tableName) => {
        if (tableName === 'polls') return pollsMock;
        if (tableName === 'poll_options') return optionsMock;
        if (tableName === 'poll_option_vote_counts') return voteCountsMock;
      });

      const polls = await getUserPolls(userId);
      expect(polls).toHaveLength(1);
      expect(polls[0].question).toBe('Test Poll');
      expect(polls[0].options).toHaveLength(1);
      expect(polls[0].options[0].voteCount).toBe(5);
    });
  });

  describe('castVote', () => {
    it('should insert a vote', async () => {
      const votesMock = {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };
      from.mockReturnValue(votesMock);
      await castVote('poll-1', 'opt-1', 'voter-1');
      expect(votesMock.insert).toHaveBeenCalledWith({
        poll_id: 'poll-1',
        option_id: 'opt-1',
        voter_id: 'voter-1',
      });
    });
  });

  describe('hasUserVoted', () => {
    it('should return true if user has voted', async () => {
      const votesMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'vote-1' }, error: null }),
      };
      from.mockReturnValue(votesMock);
      const result = await hasUserVoted('poll-1', 'voter-1');
      expect(result).toBe(true);
    });

    it('should return false if user has not voted', async () => {
      const votesMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };
      from.mockReturnValue(votesMock);
      const result = await hasUserVoted('poll-1', 'voter-1');
      expect(result).toBe(false);
    });
  });

  describe('deletePoll', () => {
    const userId = 'user-123';
    const pollId = 'poll-1';

    it('should delete a poll if user is the owner', async () => {
      const selectMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { created_by: userId }, error: null }),
      };
      const deleteMock = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      
      from.mockReturnValueOnce(selectMock)
          .mockReturnValueOnce(deleteMock);

      await deletePoll(pollId, userId);

      expect(from).toHaveBeenCalledWith('polls');
      expect(selectMock.single).toHaveBeenCalled();

      expect(from).toHaveBeenCalledWith('polls');
      expect(deleteMock.delete).toHaveBeenCalled();
      expect(deleteMock.eq).toHaveBeenCalledWith('id', pollId);
    });

    it('should throw an error if user is not the owner', async () => {
      const selectMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { created_by: 'another-user' }, error: null }),
      };
      from.mockReturnValue(selectMock);
      await expect(deletePoll(pollId, userId)).rejects.toThrow('You can only delete your own polls');
    });
  });

  describe('updatePoll', () => {
    const userId = 'user-123';
    const pollId = 'poll-1';
    const pollUpdate = { question: 'Updated Question' };

    it('should update a poll if user is the owner', async () => {
      const selectMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { created_by: userId }, error: null }),
      };
      const updateMock = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      
      from.mockReturnValueOnce(selectMock)
          .mockReturnValueOnce(updateMock);

      await updatePoll(pollId, userId, pollUpdate);
      
      expect(from).toHaveBeenCalledWith('polls');
      expect(selectMock.single).toHaveBeenCalled();
      
      expect(from).toHaveBeenCalledWith('polls');
      expect(updateMock.update).toHaveBeenCalledWith({
        question: 'Updated Question',
        description: null,
        expires_at: undefined,
      });
      expect(updateMock.eq).toHaveBeenCalledWith('id', pollId);
    });

    it('should throw an error if user is not the owner', async () => {
      const selectMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { created_by: 'another-user' }, error: null }),
      };
      from.mockReturnValue(selectMock);
      await expect(updatePoll(pollId, userId, pollUpdate)).rejects.toThrow('You can only edit your own polls');
    });
  });

  describe('updatePollOptions', () => {
    const userId = 'user-123';
    const pollId = 'poll-1';
    const newOptions = ['New Option 1', 'New Option 2'];

    it('should update poll options if user is the owner', async () => {
        const selectMock = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { created_by: userId }, error: null }),
        };
        const deleteMock = {
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ error: null }),
        };
        const insertMock = {
            insert: jest.fn().mockResolvedValue({ error: null }),
        };
        
        from.mockReturnValueOnce(selectMock)
           .mockReturnValueOnce(deleteMock)
           .mockReturnValueOnce(insertMock);

        await updatePollOptions(pollId, userId, newOptions);

        expect(from).toHaveBeenCalledWith('polls');
        expect(selectMock.single).toHaveBeenCalled();

        expect(from).toHaveBeenCalledWith('poll_options');
        expect(deleteMock.delete).toHaveBeenCalled();
        expect(deleteMock.eq).toHaveBeenCalledWith('poll_id', pollId);

        expect(from).toHaveBeenCalledWith('poll_options');
        expect(insertMock.insert).toHaveBeenCalledWith([
            { poll_id: pollId, label: 'New Option 1', position: 0 },
            { poll_id: pollId, label: 'New Option 2', position: 1 },
        ]);
    });

    it('should throw an error for less than 2 options', async () => {
        const selectMock = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { created_by: userId }, error: null }),
        };
        from.mockReturnValue(selectMock);
        await expect(updatePollOptions(pollId, userId, ['One option'])).rejects.toThrow('At least 2 options are required');
    });
  });

  describe('updatePollComplete', () => {
    it('should call updatePoll and updatePollOptions', async () => {
        const userId = 'user-123';
        const pollId = 'poll-1';
        const data = {
            question: 'Full Update',
            description: 'desc',
            expiresAt: null,
            options: ['Opt A', 'Opt B'],
        };

        const selectPollMock = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { created_by: userId }, error: null }),
        };
        const updatePollMock = {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ error: null }),
        };
        const selectOptionsMock = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { created_by: userId }, error: null }),
        };
        const deleteOptionsMock = {
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ error: null }),
        };
        const insertOptionsMock = {
            insert: jest.fn().mockResolvedValue({ error: null }),
        };

        from
            .mockReturnValueOnce(selectPollMock)
            .mockReturnValueOnce(updatePollMock)
            .mockReturnValueOnce(selectOptionsMock)
            .mockReturnValueOnce(deleteOptionsMock)
            .mockReturnValueOnce(insertOptionsMock);

        await updatePollComplete(pollId, userId, data);

        expect(updatePollMock.update).toHaveBeenCalledWith({
            question: data.question,
            description: data.description,
            expires_at: data.expiresAt,
        });
        expect(insertOptionsMock.insert).toHaveBeenCalled();
    });
  });
});
