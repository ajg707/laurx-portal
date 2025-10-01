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
async function testFirebase() {
    console.log('🔄 Testing Firebase connection...');
    try {
        const { db, isFirebaseInitialized } = await Promise.resolve().then(() => __importStar(require('../services/firestore')));
        console.log('Firebase initialized:', isFirebaseInitialized);
        if (!isFirebaseInitialized || !db) {
            console.error('❌ Firebase is not initialized');
            process.exit(1);
        }
        console.log('📝 Testing write to customer_groups collection...');
        const testGroup = {
            id: 'test-group-' + Date.now(),
            name: 'Test Group',
            description: 'This is a test group',
            type: 'static',
            customerIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system-test'
        };
        await db.collection('customer_groups').doc(testGroup.id).set(testGroup);
        console.log('✅ Successfully wrote test group to Firestore');
        console.log('📖 Testing read from customer_groups collection...');
        const doc = await db.collection('customer_groups').doc(testGroup.id).get();
        if (doc.exists) {
            console.log('✅ Successfully read test group from Firestore');
            console.log('Data:', doc.data());
        }
        else {
            console.error('❌ Failed to read test group');
        }
        console.log('🧹 Cleaning up test group...');
        await db.collection('customer_groups').doc(testGroup.id).delete();
        console.log('✅ Test group deleted');
        console.log('\n🎉 Firebase is working correctly!');
    }
    catch (error) {
        console.error('❌ Error testing Firebase:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        process.exit(1);
    }
}
testFirebase();
//# sourceMappingURL=testFirebase.js.map