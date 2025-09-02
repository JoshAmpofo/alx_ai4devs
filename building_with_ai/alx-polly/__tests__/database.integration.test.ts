import { createPoll, deletePoll } from '@/lib/polls';

describe('Database Connection and Poll Creation', () => {
  let newPollId: string | null = null;
  const testUserId = '8d712258-1592-487a-a639-4e55987119ab'; // Dummy user id

  it('should establish a connection and create a poll', async () => {
    // This is an integration test and requires a running Supabase instance
    // with valid credentials in the environment.
    
    const pollData = {
      question: 'Database connection test poll?',
      options: ['Yes', 'No'],
    };

    try {
      newPollId = await createPoll(pollData, testUserId);
      expect(newPollId).toBeDefined();
      expect(typeof newPollId).toBe('string');
    } catch (error) {
      console.error("Database test failed. Ensure your Supabase environment variables are set up correctly for testing.", error);
      throw error;
    }
  });

  afterAll(async () => {
    // Clean up the created poll
    if (newPollId) {
      try {
        await deletePoll(newPollId, testUserId);
      } catch (error) {
        console.error('Error during poll cleanup:', error);
      }
    }
  });
});
