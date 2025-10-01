import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env')
dotenv.config({ path: envPath })

async function initializeGroupsCollection() {
  console.log('🔄 Initializing customer_groups collection...')

  try {
    // Import after env is loaded
    const { db, isFirebaseInitialized } = await import('../services/firestore')

    if (!isFirebaseInitialized || !db) {
      console.error('❌ Firebase is not initialized')
      console.error('Make sure GOOGLE_APPLICATION_CREDENTIALS_JSON is set in .env')
      process.exit(1)
    }

    console.log('✅ Firebase is initialized')

    // Create a starter group to initialize the collection
    const starterGroup = {
      id: 'starter-group',
      name: 'All Customers',
      description: 'Default group containing all customers',
      type: 'dynamic',
      criteria: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system'
    }

    console.log('📝 Creating starter group to initialize collection...')
    await db.collection('customer_groups').doc(starterGroup.id).set(starterGroup)
    console.log('✅ Starter group created successfully')

    // Verify it was created
    console.log('📖 Verifying collection was created...')
    const doc = await db.collection('customer_groups').doc(starterGroup.id).get()

    if (doc.exists) {
      console.log('✅ Collection verified - customer_groups exists!')
      console.log('Data:', doc.data())
    } else {
      console.error('❌ Failed to verify collection creation')
      process.exit(1)
    }

    // List all groups
    console.log('\n📋 Listing all groups in collection:')
    const snapshot = await db.collection('customer_groups').get()
    console.log(`Found ${snapshot.size} group(s)`)
    snapshot.forEach(doc => {
      console.log(`  - ${doc.id}: ${doc.data().name}`)
    })

    console.log('\n🎉 customer_groups collection is ready!')
    console.log('You can now create groups from the admin portal.')

  } catch (error) {
    console.error('❌ Error initializing collection:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    process.exit(1)
  }
}

initializeGroupsCollection()
