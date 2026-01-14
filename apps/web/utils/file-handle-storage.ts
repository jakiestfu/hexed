/**
 * IndexedDB storage for FileSystemFileHandle objects
 * FileSystemFileHandle objects can be stored directly in IndexedDB as they are structured cloneable
 */

const DB_NAME = 'hexed-file-handles'
const DB_VERSION = 1
const STORE_NAME = 'file-handles'

export interface FileHandleMetadata {
  id: string
  path: string
  name: string
  timestamp: number
  source: 'upload' | 'url' | 'disk'
  handle: FileSystemFileHandle
}

let dbInstance: IDBDatabase | null = null

/**
 * Open or create the IndexedDB database
 */
async function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance
  }

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error(`Failed to open database: ${request.error}`))
    }

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('path', 'path', { unique: false })
      }
    }
  })
}

/**
 * Generate a unique ID for a file handle entry
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Save a file handle to IndexedDB
 */
export async function saveFileHandle(
  handle: FileSystemFileHandle,
  metadata: {
    path: string
    source: 'upload' | 'url' | 'disk'
  }
): Promise<string> {
  const db = await openDatabase()
  const id = generateId()

  const entry: FileHandleMetadata = {
    id,
    path: metadata.path,
    name: handle.name,
    timestamp: Date.now(),
    source: metadata.source,
    handle
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const request = store.put(entry)

    request.onsuccess = () => {
      resolve(id)
    }

    request.onerror = () => {
      reject(new Error(`Failed to save file handle: ${request.error}`))
    }
  })
}

/**
 * Get a file handle by ID
 */
export async function getFileHandle(
  id: string
): Promise<FileHandleMetadata | null> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    const request = store.get(id)

    request.onsuccess = () => {
      resolve(request.result || null)
    }

    request.onerror = () => {
      reject(new Error(`Failed to get file handle: ${request.error}`))
    }
  })
}

/**
 * Delete a file handle by ID
 */
export async function deleteFileHandle(id: string): Promise<void> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const request = store.delete(id)

    request.onsuccess = () => {
      resolve()
    }

    request.onerror = () => {
      reject(new Error(`Failed to delete file handle: ${request.error}`))
    }
  })
}

/**
 * Get all file handles, sorted by timestamp (most recent first)
 */
export async function getAllFileHandles(): Promise<FileHandleMetadata[]> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('timestamp')

    const request = index.openCursor(null, 'prev') // 'prev' for descending order
    const results: FileHandleMetadata[] = []

    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) {
        results.push(cursor.value)
        cursor.continue()
      } else {
        resolve(results)
      }
    }

    request.onerror = () => {
      reject(new Error(`Failed to get all file handles: ${request.error}`))
    }
  })
}

/**
 * Clear all file handles
 */
export async function clearAllFileHandles(): Promise<void> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const request = store.clear()

    request.onsuccess = () => {
      resolve()
    }

    request.onerror = () => {
      reject(new Error(`Failed to clear file handles: ${request.error}`))
    }
  })
}

/**
 * Verify and request permission for a file handle
 */
export async function verifyHandlePermission(
  handle: FileSystemFileHandle
): Promise<boolean> {
  const permission = await handle.queryPermission({ mode: 'read' })

  if (permission === 'granted') {
    return true
  }

  if (permission === 'prompt') {
    const newPermission = await handle.requestPermission({ mode: 'read' })
    return newPermission === 'granted'
  }

  return false
}
