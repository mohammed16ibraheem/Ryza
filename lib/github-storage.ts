/**
 * GitHub Storage Utility
 * Uploads files to GitHub repository using GitHub API
 */

interface GitHubConfig {
  token: string
  owner: string
  repo: string
  branch?: string
}

interface UploadResult {
  url: string
  path: string
  sha?: string
}

/**
 * Initialize GitHub storage configuration
 */
function getGitHubConfig(): GitHubConfig | null {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_REPO_OWNER
  const repo = process.env.GITHUB_REPO_NAME
  const branch = process.env.GITHUB_BRANCH || 'main'

  if (!token || !owner || !repo) {
    return null
  }

  return { token, owner, repo, branch }
}

/**
 * Convert file or blob to base64 string
 */
async function fileToBase64(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  return base64
}

/**
 * Get public URL for a file stored in GitHub
 * For public repos, use raw.githubusercontent.com directly (faster)
 * For private repos, use our API proxy
 */
function getPublicUrl(path: string, config: GitHubConfig): string {
  // For public repositories, use raw.githubusercontent.com directly (faster)
  // For private repos, you can use the proxy API
  // Since repo is now public, use direct GitHub URLs
  return `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${path}`
  
  // Alternative: Use proxy API (works for both public and private)
  // const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://theryza.com'
  // return `${siteUrl}/api/images/${path}`
}

/**
 * Upload a file or blob to GitHub repository
 */
export async function uploadToGitHub(
  file: File | Blob,
  path: string,
  message?: string
): Promise<UploadResult> {
  const config = getGitHubConfig()
  if (!config) {
    throw new Error('GitHub storage not configured. Please set GITHUB_TOKEN, GITHUB_REPO_OWNER, and GITHUB_REPO_NAME environment variables.')
  }

  // Convert file to base64
  const content = await fileToBase64(file)

  // Prepare API request
  const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`
  const fileName = file instanceof File ? file.name : path.split('/').pop() || 'file'
  const commitMessage = message || `Upload ${fileName}`

  // Check if file already exists (to update it)
  let existingSha: string | undefined
  try {
    const existingResponse = await fetch(apiUrl, {
      headers: {
        'Authorization': `token ${config.token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (existingResponse.ok) {
      const existingData = await existingResponse.json()
      existingSha = existingData.sha
    }
  } catch (error) {
    // File doesn't exist, that's fine
  }

  // Upload/update file
  const response = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${config.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: commitMessage,
      content: content,
      branch: config.branch,
      ...(existingSha && { sha: existingSha }), // Include SHA if updating existing file
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.message || `Failed to upload file to GitHub: ${response.statusText}`
    )
  }

  const data = await response.json()
  const publicUrl = getPublicUrl(path, config)

  return {
    url: publicUrl,
    path: data.content.path,
    sha: data.content.sha,
  }
}

/**
 * Upload multiple files to GitHub
 */
export async function uploadMultipleToGitHub(
  files: File[],
  basePath: string,
  message?: string
): Promise<UploadResult[]> {
  const results: UploadResult[] = []
  const baseTimestamp = Date.now()

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    // Generate unique filename with proper extension
    // Add small delay to each file to ensure unique timestamps and avoid rate limits
    const timestamp = baseTimestamp + i
    let originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    
    // Ensure file has an extension
    if (!originalName.includes('.')) {
      // If no extension, determine from file type
      const extension = file.type.includes('jpeg') || file.type.includes('jpg') ? '.jpg' :
                       file.type.includes('png') ? '.png' :
                       file.type.includes('webp') ? '.webp' :
                       file.type.includes('gif') ? '.gif' : '.jpg'
      originalName = `image${i}${extension}`
    }
    
    // Ensure unique filename for each file in the batch
    const filePath = `${basePath}/${timestamp}_${i}_${originalName}`

    try {
      const result = await uploadToGitHub(file, filePath, message)
      results.push(result)
      
      // Small delay between uploads to avoid GitHub API rate limits
      if (i < files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error) {
      console.error(`Error uploading ${file.name}:`, error)
      throw error
    }
  }

  return results
}

/**
 * Delete a file from GitHub repository
 */
export async function deleteFromGitHub(path: string, message?: string): Promise<void> {
  const config = getGitHubConfig()
  if (!config) {
    throw new Error('GitHub storage not configured')
  }

  // First, get the file SHA (required for deletion)
  const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`
  
  let sha: string
  try {
    const getResponse = await fetch(apiUrl, {
      headers: {
        'Authorization': `token ${config.token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!getResponse.ok) {
      // File doesn't exist - that's okay, just return (already deleted)
      if (getResponse.status === 404) {
        console.log(`File already deleted or not found: ${path}`)
        return
      }
      throw new Error(`Failed to get file info: ${getResponse.statusText}`)
    }

    const fileData = await getResponse.json()
    sha = fileData.sha
  } catch (error) {
    // If file doesn't exist, that's fine - it's already deleted
    if (error instanceof Error && error.message.includes('not found')) {
      console.log(`File already deleted: ${path}`)
      return
    }
    throw error
  }

  // Delete file
  const deleteResponse = await fetch(apiUrl, {
    method: 'DELETE',
    headers: {
      'Authorization': `token ${config.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: message || `Delete ${path}`,
      sha: sha,
      branch: config.branch,
    }),
  })

  if (!deleteResponse.ok) {
    const errorData = await deleteResponse.json().catch(() => ({}))
    throw new Error(
      errorData.message || `Failed to delete file from GitHub: ${deleteResponse.statusText}`
    )
  }
}

