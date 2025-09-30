// Image downloader utility
export async function downloadAndSaveImage(imageUrl, title, category) {
  if (!imageUrl || !imageUrl.startsWith('http')) {
    return null
  }

  try {
    // Check if user is logged in
    const token = localStorage.getItem('authToken')
    const user = localStorage.getItem('currentUser')
    
    if (!token || !user) {
      // For non-logged in users, use original URL
      console.log(`User not logged in, using original URL: ${imageUrl}`)
      return imageUrl
    }

    // For logged in users, try to download and save via backend
    try {
      const response = await fetch('/api/fetch-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title,
          category: category
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.path) {
          console.log(`Image saved locally: ${data.data.path}`)
          return data.data.path
        }
      }
    } catch (apiError) {
      console.warn('Backend image download failed, using original URL:', apiError)
    }
    
    // Fallback to original URL
    console.log(`Using original image URL: ${imageUrl}`)
    return imageUrl
  } catch (error) {
    console.error('Failed to process image:', error)
    return imageUrl // Return original URL as fallback
  }
}

// Function to check if an image exists locally
export function getLocalImagePath(imageUrl, title, category) {
  if (!imageUrl || !imageUrl.startsWith('http')) {
    return null
  }

  // Check if user is logged in
  const token = localStorage.getItem('authToken')
  const user = localStorage.getItem('currentUser')
  
  if (!token || !user) {
    // For non-logged in users, return original URL
    return imageUrl
  }

  // For logged in users, return original URL (backend will handle local storage)
  return imageUrl
}

// Function to handle image URL conversion
export function processImageUrl(imageUrl, title, category) {
  if (!imageUrl) return null
  
  // If it's already a local path, return as is
  if (imageUrl.startsWith('images/') || imageUrl.startsWith('images_downloads/')) {
    return imageUrl
  }
  
  // If it's an external URL, return as is
  if (imageUrl.startsWith('http')) {
    return imageUrl
  }
  
  return imageUrl
}
