// Firestore access for this codebase. The project's (default) database is
// in Datastore Mode (created long ago; the Firestore API is unavailable on
// it), so all Firestore usage targets the named Native-mode database below.
const {getFirestore} = require("firebase-admin/firestore");

const DATABASE_ID = "propagent-website";

let db;

/**
 * Lazily resolve the shared Firestore client for the named database.
 * @return {Object} Firestore instance bound to DATABASE_ID
 */
const getDb = () => {
  if (!db) db = getFirestore(DATABASE_ID);
  return db;
};

module.exports = {getDb, DATABASE_ID};
