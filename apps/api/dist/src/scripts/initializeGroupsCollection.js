"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const envPath = path_1.default.resolve(process.cwd(), '.env');
dotenv_1.default.config({ path: envPath });
async function initializeGroupsCollection() {
    console.log('🔄 Initializing customer_groups collection...');
    try {
        const { db, isFirebaseInitialized } = await Promise.resolve().then(() => __importStar(require('../services/firestore')));
        if (!isFirebaseInitialized || !db) {
            console.error('❌ Firebase is not initialized');
            console.error('Make sure GOOGLE_APPLICATION_CREDENTIALS_JSON is set in .env');
            process.exit(1);
        }
        console.log('✅ Firebase is initialized');
        const starterGroup = {
            id: 'starter-group',
            name: 'All Customers',
            description: 'Default group containing all customers',
            type: 'dynamic',
            criteria: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system'
        };
        console.log('📝 Creating starter group to initialize collection...');
        await db.collection('customer_groups').doc(starterGroup.id).set(starterGroup);
        console.log('✅ Starter group created successfully');
        console.log('📖 Verifying collection was created...');
        const doc = await db.collection('customer_groups').doc(starterGroup.id).get();
        if (doc.exists) {
            console.log('✅ Collection verified - customer_groups exists!');
            console.log('Data:', doc.data());
        }
        else {
            console.error('❌ Failed to verify collection creation');
            process.exit(1);
        }
        console.log('\n📋 Listing all groups in collection:');
        const snapshot = await db.collection('customer_groups').get();
        console.log(`Found ${snapshot.size} group(s)`);
        snapshot.forEach(doc => {
            console.log(`  - ${doc.id}: ${doc.data().name}`);
        });
        console.log('\n🎉 customer_groups collection is ready!');
        console.log('You can now create groups from the admin portal.');
    }
    catch (error) {
        console.error('❌ Error initializing collection:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        process.exit(1);
    }
}
initializeGroupsCollection();
//# sourceMappingURL=initializeGroupsCollection.js.map