// roomUtils.js

/**
 * Generates a consistent room ID from a URL path
 * @param {string} path - URL path (e.g., "/antpb/pixel")
 * @returns {string} Normalized room ID (e.g., "antpb-pixel")
 */
export function generateRoomId(path) {
	// Remove leading/trailing slashes and query strings
	const cleanPath = path.replace(/^\/+|\/+$/g, '').split('?')[0];
	
	// Replace remaining slashes with hyphens and normalize
	return cleanPath.replace(/\//g, '-').toLowerCase();
  }
  
  /**
   * Validates and retrieves room information
   * @param {Object} sql - SQL database instance
   * @param {string} roomId - Room ID to validate
   * @param {string} characterId - Character ID associated with the room
   * @returns {Promise<Object>} Room information or null
   */
  export async function getOrCreateRoom(sql, roomId, characterId) {
	try {
	  // First try to get existing room
	  const existingRoom = await sql.exec(`
		SELECT * FROM rooms 
		WHERE id = ? 
		LIMIT 1
	  `, roomId).toArray();
  
	  if (existingRoom.length) {
		return existingRoom[0];
	  }
  
	  // Create new room if it doesn't exist
	  await sql.exec(`
		INSERT INTO rooms (
		  id,
		  character_id,
		  created_at,
		  last_active
		) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
	  `, roomId, characterId);
  
	  return {
		id: roomId,
		character_id: characterId,
		created_at: new Date().toISOString()
	  };
	} catch (error) {
	  console.error('Error in getOrCreateRoom:', error);
	  return null;
	}
  }
  
  /**
   * Updates session with room information
   * @param {Object} sql - SQL database instance
   * @param {string} sessionId - Session ID to update
   * @param {string} roomId - Room ID to associate
   * @returns {Promise<boolean>} Success status
   */
  export async function linkSessionToRoom(sql, sessionId, roomId) {
	try {
	  await sql.exec(`
		UPDATE character_sessions 
		SET room_id = ?,
			last_active = CURRENT_TIMESTAMP 
		WHERE id = ?
	  `, roomId, sessionId);
  
	  await sql.exec(`
		UPDATE rooms 
		SET current_session_id = ?,
			last_active = CURRENT_TIMESTAMP 
		WHERE id = ?
	  `, sessionId, roomId);
  
	  return true;
	} catch (error) {
	  console.error('Error linking session to room:', error);
	  return false;
	}
  }