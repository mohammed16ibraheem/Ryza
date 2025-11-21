import imageCompression from 'browser-image-compression'

// Image compression options - optimized for web performance
const imageCompressionOptions = {
  maxSizeMB: 0.5, // Maximum file size in MB (500KB)
  maxWidthOrHeight: 1200, // Maximum width or height
  useWebWorker: true, // Use web worker for better performance
  fileType: 'image/jpeg', // Convert to JPEG for better compression
  initialQuality: 0.8, // Quality (0-1), 0.8 = 80% quality
}

/**
 * Compress an image file
 * @param file - The image file to compress
 * @returns Compressed image file
 */
export async function compressImage(file: File): Promise<File> {
  try {
    // Only compress if file is larger than 200KB
    if (file.size < 200 * 1024) {
      console.log('Image is already small, skipping compression')
      return file
    }

    console.log(`Compressing image: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`)
    
    const compressedFile = await imageCompression(file, imageCompressionOptions)
    
    const originalSize = (file.size / 1024).toFixed(2)
    const compressedSize = (compressedFile.size / 1024).toFixed(2)
    const reduction = ((1 - compressedFile.size / file.size) * 100).toFixed(1)
    
    console.log(`Compressed: ${originalSize} KB → ${compressedSize} KB (${reduction}% reduction)`)
    
    return compressedFile
  } catch (error) {
    console.error('Image compression error:', error)
    // Return original file if compression fails
    return file
  }
}

/**
 * Compress multiple image files
 * @param files - Array of image files to compress
 * @returns Array of compressed image files
 */
export async function compressImages(files: File[]): Promise<File[]> {
  const compressedFiles = await Promise.all(
    files.map(file => compressImage(file))
  )
  return compressedFiles
}

/**
 * Get video duration in seconds
 * @param file - The video file
 * @returns Duration in seconds
 */
function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src)
      resolve(video.duration)
    }
    
    video.onerror = () => {
      window.URL.revokeObjectURL(video.src)
      reject(new Error('Failed to load video metadata'))
    }
    
    video.src = URL.createObjectURL(file)
  })
}

/**
 * Trim and compress video file to 1 minute max
 * @param file - The video file
 * @returns Compressed/trimmed video file
 */
export async function compressVideo(file: File): Promise<File> {
  try {
    // Check video duration
    const duration = await getVideoDuration(file)
    const maxDuration = 60 // 1 minute in seconds
    const maxSizeMB = 15 // Maximum file size: 15MB
    
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      console.warn(`Video file is large: ${(file.size / 1024 / 1024).toFixed(2)} MB`)
    }
    
    // If video is longer than 1 minute, trim it
    if (duration > maxDuration) {
      console.log(`Video is ${duration.toFixed(1)}s, trimming to ${maxDuration}s`)
      return await trimVideo(file, maxDuration)
    }
    
    // If video is within limits, try to compress it slightly
    if (file.size > 5 * 1024 * 1024) { // If larger than 5MB, compress
      return await compressVideoQuality(file)
    }
    
    return file
  } catch (error) {
    console.error('Video compression error:', error)
    return file
  }
}

/**
 * Trim video to specified duration using MediaRecorder
 * @param file - The video file
 * @param maxDuration - Maximum duration in seconds
 * @returns Trimmed video file
 */
async function trimVideo(file: File, maxDuration: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true // Mute for processing
    video.playsInline = true
    const videoUrl = URL.createObjectURL(file)
    video.src = videoUrl
    
    video.onloadedmetadata = async () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          URL.revokeObjectURL(videoUrl)
          reject(new Error('Canvas context not available'))
          return
        }
        
        // Set canvas size to match video
        canvas.width = Math.min(video.videoWidth, 1280)
        canvas.height = Math.min(video.videoHeight, 720)
        
        // Check MediaRecorder support
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
          ? 'video/webm;codecs=vp9'
          : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : 'video/webm'
        
        const stream = canvas.captureStream(25) // 25 fps for smaller file
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 800000, // 800 kbps for compression
        })
        
        const chunks: Blob[] = []
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data)
          }
        }
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType })
          const trimmedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webm'), {
            type: mimeType,
            lastModified: Date.now(),
          })
          URL.revokeObjectURL(videoUrl)
          resolve(trimmedFile)
        }
        
        mediaRecorder.onerror = (e) => {
          URL.revokeObjectURL(videoUrl)
          reject(new Error('MediaRecorder error'))
        }
        
        video.currentTime = 0
        await video.play()
        mediaRecorder.start()
        
        const startTime = Date.now()
        const drawFrame = () => {
          const elapsed = (Date.now() - startTime) / 1000
          
          if (elapsed >= maxDuration || video.ended) {
            mediaRecorder.stop()
            video.pause()
            return
          }
          
          if (video.readyState >= 2) { // HAVE_CURRENT_DATA
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          }
          
          requestAnimationFrame(drawFrame)
        }
        
        drawFrame()
      } catch (error) {
        URL.revokeObjectURL(videoUrl)
        reject(error)
      }
    }
    
    video.onerror = () => {
      URL.revokeObjectURL(videoUrl)
      reject(new Error('Failed to load video'))
    }
  })
}

/**
 * Compress video quality
 * @param file - The video file
 * @returns Compressed video file
 */
async function compressVideoQuality(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    const videoUrl = URL.createObjectURL(file)
    video.src = videoUrl
    
    video.onloadedmetadata = async () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          URL.revokeObjectURL(videoUrl)
          reject(new Error('Canvas context not available'))
          return
        }
        
        // Reduce resolution for compression (max 1280x720)
        canvas.width = Math.min(video.videoWidth, 1280)
        canvas.height = Math.min(video.videoHeight, 720)
        
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
          ? 'video/webm;codecs=vp9'
          : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : 'video/webm'
        
        const stream = canvas.captureStream(25) // 25 fps
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 1000000, // 1 Mbps for compression
        })
        
        const chunks: Blob[] = []
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data)
          }
        }
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType })
          const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webm'), {
            type: mimeType,
            lastModified: Date.now(),
          })
          URL.revokeObjectURL(videoUrl)
          resolve(compressedFile)
        }
        
        mediaRecorder.onerror = () => {
          URL.revokeObjectURL(videoUrl)
          reject(new Error('MediaRecorder error'))
        }
        
        video.currentTime = 0
        await video.play()
        mediaRecorder.start()
        
        const drawFrame = () => {
          if (video.ended) {
            mediaRecorder.stop()
            video.pause()
            return
          }
          
          if (video.readyState >= 2) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          }
          
          requestAnimationFrame(drawFrame)
        }
        
        drawFrame()
      } catch (error) {
        URL.revokeObjectURL(videoUrl)
        reject(error)
      }
    }
    
    video.onerror = () => {
      URL.revokeObjectURL(videoUrl)
      reject(new Error('Failed to load video'))
    }
  })
}

