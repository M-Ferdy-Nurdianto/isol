import * as dotenv from 'dotenv'
dotenv.config()
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function setup() {
  console.log('Fetching buckets...')
  const { data: buckets, error } = await supabase.storage.listBuckets()
  if (error) {
    console.error('Error fetching buckets:', error)
    return
  }
  console.log('Buckets:', buckets.map(b => b.name))

  if (!buckets.find(b => b.name === 'media')) {
    console.log('Creating media bucket...')
    const { data, error: createError } = await supabase.storage.createBucket('media', {
      public: true
    })
    if (createError) {
      console.error('Error creating media bucket:', createError)
    } else {
      console.log('media bucket created successfully!')
    }
  } else {
    console.log('media bucket already exists. Ensuring it is public...')
    await supabase.storage.updateBucket('media', {
      public: true
    })
  }
}
setup()
