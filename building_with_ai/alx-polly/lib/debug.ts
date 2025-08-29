import { supabase } from '@/lib/supabase/client';

// Test authentication and database connectivity
export async function testSupabaseConnection() {
  console.log('🔧 Testing Supabase Connection...');
  
  try {
    // Test 1: Check if we can connect to Supabase
    const { data: testData, error: testError } = await supabase
      .from('polls')
      .select('count', { count: 'exact', head: true });
    
    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return false;
    }
    
    console.log('✅ Database connection successful');
    console.log('📊 Current polls count:', testData);
    
    // Test 2: Check current auth state
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth check failed:', authError);
      return false;
    }
    
    if (session?.user) {
      console.log('✅ User is authenticated:', session.user.email);
      console.log('🔑 User ID:', session.user.id);
    } else {
      console.log('❌ No authenticated user');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
}

// Test poll creation
export async function testPollCreation(userId: string) {
  console.log('🔧 Testing Poll Creation...');
  
  try {
    const testPoll = {
      question: 'Test Poll - ' + new Date().toISOString(),
      description: 'This is a test poll created by the debug script',
      created_by: userId,
    };
    
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .insert(testPoll)
      .select('id')
      .single();
    
    if (pollError) {
      console.error('❌ Poll creation failed:', pollError);
      return null;
    }
    
    console.log('✅ Poll created successfully:', pollData.id);
    
    // Create test options
    const options = [
      { poll_id: pollData.id, label: 'Option 1' },
      { poll_id: pollData.id, label: 'Option 2' },
    ];
    
    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(options);
    
    if (optionsError) {
      console.error('❌ Options creation failed:', optionsError);
      return null;
    }
    
    console.log('✅ Poll options created successfully');
    return pollData.id;
  } catch (error) {
    console.error('❌ Poll creation test failed:', error);
    return null;
  }
}

// Add this to your browser console to debug
// window.testSupabase = { testSupabaseConnection, testPollCreation };
