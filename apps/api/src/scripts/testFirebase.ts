import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env')
dotenv.config({ path: envPath })

async function testFirebase() {
  console.log('🔄 Testing Firebase connection...')

  try {
    // Import after env is loaded
    const { db, isFirebaseInitialized } = await import('../services/firestore')

    console.log('Firebase initialized:', isFirebaseInitialized)

    if (!isFirebaseInitialized || !db) {
      console.error('❌ Firebase is not initialized')
      process.exit(1)
    }

    // Test write to customer_groups collection
    console.log('📝 Testing write to customer_groups collection...')
    const testGroup = {
      id: 'test-group-' + Date.now(),
      name: 'Test Group',
      description: 'This is a test group',
      type: 'static',
      customerIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system-test'
    }

    await db.collection('customer_groups').doc(testGroup.id).set(testGroup)
    console.log('✅ Successfully wrote test group to Firestore')

    // Test read
    console.log('📖 Testing read from customer_groups collection...')
    const doc = await db.collection('customer_groups').doc(testGroup.id).get()

    if (doc.exists) {
      console.log('✅ Successfully read test group from Firestore')
      console.log('Data:', doc.data())
    } else {
      console.error('❌ Failed to read test group')
    }

    // Clean up test group
    console.log('🧹 Cleaning up test group...')
    await db.collection('customer_groups').doc(testGroup.id).delete()
    console.log('✅ Test group deleted')

    console.log('\n🎉 Firebase is working correctly!')

  } catch (error) {
    console.error('❌ Error testing Firebase:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    process.exit(1)
  }
}

testFirebase()
