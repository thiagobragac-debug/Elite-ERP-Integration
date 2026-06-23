/**
 * Photo Background Sync Utilities
 * 
 * This module provides utilities for queueing photos for background sync
 * and communicating with the service worker.
 */

import { supabase } from './supabase';

export interface PhotoUploadOptions {
  /** The photo file or blob */
  file: File | Blob;
  /** Storage bucket name */
  bucket: string;
  /** Storage path */
  path: string;
  /** Entity type this photo belongs to */
  entityType: 'animal' | 'maquina' | 'pasto' | 'auditoria';
  /** Entity ID */
  entityId: string;
}

export interface QueuedPhotoData {
  id: string;
  blob: string; // Base64 data URL
  bucket: string;
  path: string;
  entityType: string;
  entityId: string;
  timestamp: number;
}

/**
 * Queue a photo for background sync
 * 
 * This function stores the photo in the service worker cache and registers
 * a background sync event to upload it when the network is available.
 * 
 * @param options - Photo upload options
 * @returns Promise that resolves when the photo is queued
 */
export async function queuePhotoForSync(options: PhotoUploadOptions): Promise<void> {
  try {
    // Check if service worker is available
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported in this browser');
    }

    // Wait for service worker to be ready
    const registration = await navigator.serviceWorker.ready;

    // Convert blob to base64 data URL for storage
    const blobDataUrl = await blobToDataUrl(options.file);

    // Create queued photo data
    const queuedPhoto: QueuedPhotoData = {
      id: generatePhotoId(),
      blob: blobDataUrl,
      bucket: options.bucket,
      path: options.path,
      entityType: options.entityType,
      entityId: options.entityId,
      timestamp: Date.now(),
    };

    // Send photo to service worker for queueing
    await sendMessageToServiceWorker(registration, {
      type: 'QUEUE_PHOTO',
      payload: queuedPhoto,
    });

    console.log('[PhotoSync] Photo queued for background sync:', options.path);

    // Try to register background sync
    if ('sync' in registration) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (registration as any).sync.register('sync-photos');
        console.log('[PhotoSync] Background sync registered');
      } catch (error) {
        console.warn('[PhotoSync] Background sync registration failed:', error);
        // Will retry on next opportunity
      }
    }

  } catch (error) {
    console.error('[PhotoSync] Failed to queue photo:', error);
    throw error;
  }
}

/**
 * Upload a photo directly to Supabase Storage
 * 
 * This function uploads a photo immediately without queueing.
 * Use this when the network is available.
 * 
 * @param options - Photo upload options
 * @returns Promise that resolves to the uploaded file path
 */
export async function uploadPhotoDirectly(options: PhotoUploadOptions): Promise<string> {
  try {
    const { file, bucket, path } = options;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      throw error;
    }

    console.log('[PhotoSync] Photo uploaded directly:', data.path);
    return data.path;

  } catch (error) {
    console.error('[PhotoSync] Failed to upload photo directly:', error);
    throw error;
  }
}

/**
 * Upload a photo with automatic fallback to background sync
 * 
 * This function attempts to upload the photo immediately if online,
 * otherwise queues it for background sync.
 * 
 * @param options - Photo upload options
 * @param isOnline - Whether the device is currently online
 * @returns Promise that resolves to the upload path (or null if queued)
 */
export async function uploadPhotoWithFallback(
  options: PhotoUploadOptions,
  isOnline: boolean
): Promise<string | null> {
  if (isOnline) {
    try {
      return await uploadPhotoDirectly(options);
    } catch (error) {
      console.warn('[PhotoSync] Direct upload failed, falling back to queue:', error);
      await queuePhotoForSync(options);
      return null;
    }
  } else {
    await queuePhotoForSync(options);
    return null;
  }
}

/**
 * Manually trigger photo sync
 * 
 * This function requests the service worker to sync all pending photos.
 * 
 * @returns Promise that resolves when sync is complete
 */
export async function triggerPhotoSync(): Promise<void> {
  try {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    const registration = await navigator.serviceWorker.ready;

    await sendMessageToServiceWorker(registration, {
      type: 'TRIGGER_PHOTO_SYNC',
    });

    console.log('[PhotoSync] Manual photo sync triggered');

  } catch (error) {
    console.error('[PhotoSync] Failed to trigger photo sync:', error);
    throw error;
  }
}

/**
 * Get the count of pending photos in the sync queue
 * 
 * @returns Promise that resolves to the count of pending photos
 */
export async function getPendingPhotosCount(): Promise<number> {
  try {
    const cache = await caches.open('pending-photos');
    const requests = await cache.keys();
    return requests.length;
  } catch (error) {
    console.error('[PhotoSync] Failed to get pending photos count:', error);
    return 0;
  }
}

/**
 * Clear all pending photos from the sync queue
 * 
 * @returns Promise that resolves when the queue is cleared
 */
export async function clearPendingPhotos(): Promise<void> {
  try {
    await caches.delete('pending-photos');
    console.log('[PhotoSync] Pending photos queue cleared');
  } catch (error) {
    console.error('[PhotoSync] Failed to clear pending photos:', error);
    throw error;
  }
}

// Helper Functions

/**
 * Convert a Blob to a base64 data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Generate a unique photo ID
 */
function generatePhotoId(): string {
  return `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Send a message to the service worker and wait for response
 */
function sendMessageToServiceWorker(
  registration: ServiceWorkerRegistration,
  message: any
): Promise<any> {
  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      if (event.data.success) {
        resolve(event.data);
      } else {
        reject(new Error(event.data.error || 'Service worker message failed'));
      }
    };

    if (registration.active) {
      registration.active.postMessage(message, [messageChannel.port2]);
    } else {
      reject(new Error('Service worker is not active'));
    }
  });
}

/**
 * Listen for service worker messages
 * 
 * This function sets up a listener for messages from the service worker,
 * such as photo sync completion notifications.
 * 
 * @param callback - Function to call when a message is received
 */
export function listenToServiceWorkerMessages(callback: (message: any) => void): () => void {
  const handler = (event: MessageEvent) => {
    if (event.data && event.data.type) {
      callback(event.data);
    }
  };

  const hasSW = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;

  if (hasSW) {
    navigator.serviceWorker.addEventListener('message', handler);
  }

  // Return cleanup function
  return () => {
    if (hasSW) {
      navigator.serviceWorker.removeEventListener('message', handler);
    }
  };
}
