import Dexie from 'dexie';

// Create a new Dexie database instance
export const db = new Dexie('FastnoteLocalDB');

// Define the schema
// The first item is the Primary Key (id). The rest are indexed properties 
// that we want to be able to search or filter by quickly.
db.version(1).stores({
    notes: 'id, title, type, updatedAt, syncStatus'
});

// syncStatus will be either: 'synced', 'pending_sync', or 'pending_delete'