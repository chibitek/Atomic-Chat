/**
 * Supabase Connection Test
 *
 * Run this to verify your Supabase configuration is working:
 *   cd web-app && bun test supabase-test.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase environment variables')
  console.error('   Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set')
  process.exit(1)
}

console.log('🔌 Testing Supabase connection...')
console.log(`   URL: ${SUPABASE_URL}`)

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
})

async function testConnection() {
  try {
    // Test 1: Basic connectivity (get session)
    console.log('\n1️⃣ Testing auth connectivity...')
    const { error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    console.log('   ✅ Auth endpoint reachable')

    // Test 2: Check if tables exist by querying threads
    console.log('\n2️⃣ Testing database tables...')
    const { error: threadsError } = await supabase
      .from('threads')
      .select('count', { count: 'exact', head: true })

    if (threadsError) {
      if (threadsError.code === '42P01') {
        console.log('   ⚠️  Threads table does not exist yet')
        console.log('      Run supabase/schema.sql to create tables')
      } else {
        throw threadsError
      }
    } else {
      console.log('   ✅ Threads table exists')
    }

    // Test 3: Check messages table
    const { error: messagesError } = await supabase
      .from('messages')
      .select('count', { count: 'exact', head: true })

    if (messagesError && messagesError.code === '42P01') {
      console.log('   ⚠️  Messages table does not exist yet')
    } else if (!messagesError) {
      console.log('   ✅ Messages table exists')
    }

    // Test 4: Check profiles table
    const { error: profilesError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true })

    if (profilesError && profilesError.code === '42P01') {
      console.log('   ⚠️  Profiles table does not exist yet')
    } else if (!profilesError) {
      console.log('   ✅ Profiles table exists')
    }

    // Test 5: Realtime check
    console.log('\n3️⃣ Testing realtime connection...')
    const channel = supabase.channel('test-channel')
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('   ✅ Realtime subscription working')
        supabase.removeChannel(channel)
      }
    })

    // Wait a moment for realtime to connect
    await new Promise((resolve) => setTimeout(resolve, 2000))

    console.log('\n🎉 Supabase connection test complete!')
    console.log('\nNext steps:')
    console.log('   1. Run supabase/schema.sql in your Supabase SQL Editor')
    console.log('   2. Sign up a test user via the app')
    console.log('   3. Create a thread and verify it syncs')

  } catch (error) {
    console.error('\n❌ Supabase connection failed:')
    console.error(error)
    process.exit(1)
  }
}

testConnection()
