/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useEffect } from 'react'
import { FiUploadCloud, FiPlay, FiCheckCircle, FiTrash2, FiEdit2, FiFolder } from 'react-icons/fi'
import { compressImage, compressImages, compressVideo } from '@/lib/compression'

const PRODUCT_CATEGORIES = [
  'Salah Essential',
  'Hijabs',
  'Gift Hampers',
  'Hair Essentials',
  'Jewellery',
  'Offers',
]

type ColorVariant = {
  color: string
  images: string[]
}

type DraftProduct = {
  id: string
  title: string
  description: string
  price: string
  discount?: string
  weight?: string
  category: string
  subCategory?: string
  images: string[]
  imageColors?: string[] // Color names for each image (e.g., ["brown lightbround morelightbroud", "green lightgreen morelightgreen", "black blue lightbule"])
  outOfStockImages?: number[] // Array of image indices (0, 1, 2) that are out of stock
  colorVariants?: ColorVariant[]
  video?: string
  folderPath?: string
}

const MAX_IMAGES = 4 // 1 thumbnail + 3 product images

// Map category names to folder names
const getCategoryFolderName = (category: string): string => {
  const categoryMap: { [key: string]: string } = {
    'Salah Essential': 'Salah-Essential',
    'Hijabs': 'Hijabs',
    'Gift Hampers': 'Gift-Hampers',
    'Hair Essentials': 'Hair-Essentials',
    'Hair Accessories': 'Hair-Essentials', // Legacy support
    'Jewellery': 'Jewellery',
    'Offers': 'Offers',
    'Dresses': 'Salah-Essential', // Legacy support - map old "Dresses" to "Salah Essential"
  }
  return categoryMap[category] || category.replace(/\s+/g, '-')
}

// Map Hijab sub-category to folder name
const getHijabSubCategoryFolderName = (subCategory: string): string => {
  const subCategoryMap: { [key: string]: string } = {
    'Hijab': 'Hijab',
    'Accessory': 'Hijab-Essentials',
    'Luxury': 'Luxury-Hijabs',
    'Day to Day Life': 'Day-to-Day-Life',
  }
  return subCategoryMap[subCategory] || subCategory.replace(/\s+/g, '-')
}

// Generate folder path based on category and subCategory
const getFolderPath = (category: string, subCategory?: string): string => {
  const basePath = 'images'
  const categoryFolder = getCategoryFolderName(category)
  
  if (category === 'Hijabs' && subCategory) {
    const subFolder = getHijabSubCategoryFolderName(subCategory)
    return `${basePath}/${categoryFolder}/${subFolder}`
  }
  
  return `${basePath}/${categoryFolder}`
}

export default function AdminPanel() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [discount, setDiscount] = useState('')
  const [weight, setWeight] = useState('')
  const [category, setCategory] = useState(PRODUCT_CATEGORIES[0])
  const [subCategory, setSubCategory] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [imageColors, setImageColors] = useState<string[]>(['', '', '']) // Color names for each image (1, 2, 3)
  const [outOfStockImages, setOutOfStockImages] = useState<number[]>([]) // Track which images are out of stock (0, 1, 2)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | undefined>()
  const [products, setProducts] = useState<DraftProduct[]>([])
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  
  // Color variants state
  const [colorVariants, setColorVariants] = useState<Array<{color: string, imageFiles: File[], imagePreviews: string[], uploadedImages: string[]}>>([])
  const [currentColor, setCurrentColor] = useState('')

  // Category thumbnails state
  const [categoryThumbnails, setCategoryThumbnails] = useState<{ [key: string]: string }>({})
  const [uploadingThumbnail, setUploadingThumbnail] = useState<string | null>(null)

  // Check authentication on mount - MUST be before any early returns
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check')
        
        // Handle 401 or other errors gracefully
        if (!response.ok) {
          setIsAuthenticated(false)
          window.location.href = '/tahseen'
          return
        }
        
        const data = await response.json()
        
        if (data.authenticated) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
          window.location.href = '/tahseen'
        }
      } catch (error) {
        console.error('Auth check error:', error)
        setIsAuthenticated(false)
        window.location.href = '/tahseen'
      }
    }
    
    checkAuth()
  }, [])

  // Fetch category thumbnails - MUST be before any early returns
  useEffect(() => {
    if (isAuthenticated !== true) return // Only fetch if authenticated
    
    const fetchThumbnails = async () => {
      try {
        const response = await fetch('/api/category-thumbnails')
        const data = await response.json()
        setCategoryThumbnails(data.thumbnails || {})
      } catch (error) {
        console.error('Error fetching thumbnails:', error)
      }
    }
    
    fetchThumbnails()
  }, [isAuthenticated])

  // Load products from API on mount - MUST be before any early returns
  useEffect(() => {
    if (isAuthenticated !== true) return // Only fetch if authenticated
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true)
        const response = await fetch('/api/products')
        const data = await response.json()
        
        // Transform API products to DraftProduct format
        const transformedProducts: DraftProduct[] = data.products.map((p: any) => ({
          id: p.id,
          title: p.name || p.title,
          description: p.description,
          price: String(p.price),
          discount: p.discount,
          weight: p.weight,
          category: p.category,
          subCategory: p.subCategory,
          images: p.images || [],
          imageColors: p.imageColors || [],
          outOfStockImages: p.outOfStockImages || [],
          colorVariants: p.colorVariants,
          video: p.video,
          folderPath: p.folderPath,
        }))
        
        setProducts(transformedProducts)
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [isAuthenticated])

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/tahseen'
    } catch (error) {
      console.error('Logout error:', error)
      window.location.href = '/tahseen'
    }
  }

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // Don't render dashboard if not authenticated
  if (!isAuthenticated) {
    return null
  }

  const handleImagesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : []
    const limitedFiles = files.slice(0, MAX_IMAGES)
    
    // Compress images before setting them
    setUploadStatus('Compressing images...')
    try {
      const compressedFiles = await compressImages(limitedFiles)
      setImageFiles(compressedFiles)
      const previews = compressedFiles.map((file) => URL.createObjectURL(file))
      setImagePreviews(previews)
      setExistingImages([])
      // Reset out of stock selection and colors when new images are uploaded
      setOutOfStockImages([])
      setImageColors(['', '', ''])
      setUploadStatus('')
    } catch (error) {
      console.error('Error compressing images:', error)
      // Fallback to original files if compression fails
      setImageFiles(limitedFiles)
      const previews = limitedFiles.map((file) => URL.createObjectURL(file))
      setImagePreviews(previews)
      setExistingImages([])
      setOutOfStockImages([])
      setImageColors(['', '', ''])
      setUploadStatus('')
    }
  }

  const handleImageColorChange = (index: number, value: string) => {
    const newColors = [...imageColors]
    newColors[index] = value
    setImageColors(newColors)
  }

  const toggleOutOfStock = (imageIndex: number) => {
    setOutOfStockImages(prev => 
      prev.includes(imageIndex) 
        ? prev.filter(i => i !== imageIndex)
        : [...prev, imageIndex]
    )
  }

  const handleVideoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate video file type
      if (!file.type.startsWith('video/')) {
        setUploadStatus('❌ Please select a valid video file')
        setTimeout(() => setUploadStatus(''), 3000)
        return
      }
      
      // Compress and trim video before setting it
      setUploadStatus('Processing video (trimming to 1 minute and compressing)...')
      try {
        const compressedVideo = await compressVideo(file)
        setVideoFile(compressedVideo)
        setVideoPreview(URL.createObjectURL(compressedVideo))
        setUploadStatus('✅ Video processed successfully (max 1 minute, compressed)')
        setTimeout(() => setUploadStatus(''), 3000)
      } catch (error) {
        console.error('Error compressing video:', error)
        // Fallback to original file if compression fails
        setVideoFile(file)
        setVideoPreview(URL.createObjectURL(file))
        setUploadStatus('⚠️ Video compression failed, using original file')
        setTimeout(() => setUploadStatus(''), 3000)
      }
    } else {
      setVideoFile(null)
      setVideoPreview(undefined)
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setPrice('')
    setDiscount('')
    setWeight('')
    setCategory(PRODUCT_CATEGORIES[0])
    setSubCategory('')
    setImageFiles([])
    setImagePreviews([])
    setExistingImages([])
    setImageColors(['', '', ''])
    setOutOfStockImages([])
    setVideoFile(null)
    setVideoPreview(undefined)
    setEditingProductId(null)
    setUploadStatus('')
    setColorVariants([])
    setCurrentColor('')
  }

  const addColorVariant = () => {
    if (!currentColor.trim()) {
      alert('Please enter a color name')
      return
    }
    if (colorVariants.find(v => v.color.toLowerCase() === currentColor.toLowerCase())) {
      alert('This color already exists')
      return
    }
    setColorVariants([...colorVariants, {
      color: currentColor.trim(),
      imageFiles: [],
      imagePreviews: [],
      uploadedImages: []
    }])
    setCurrentColor('')
  }

  const removeColorVariant = (index: number) => {
    setColorVariants(colorVariants.filter((_, i) => i !== index))
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/products?id=${productId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to delete product')
      }

      // Refresh products from API
      const refreshResponse = await fetch('/api/products')
      const refreshData = await refreshResponse.json()
      const transformedProducts: DraftProduct[] = refreshData.products.map((p: any) => ({
        id: p.id,
        title: p.name || p.title,
        description: p.description,
        price: String(p.price),
        discount: p.discount,
        category: p.category,
        subCategory: p.subCategory,
        images: p.images || [],
        outOfStockImages: p.outOfStockImages || [],
        colorVariants: p.colorVariants,
        video: p.video,
        folderPath: p.folderPath,
      }))
      setProducts(transformedProducts)
      
      setUploadStatus('✅ Product deleted successfully!')
      setTimeout(() => setUploadStatus(''), 3000)
    } catch (error) {
      console.error('Error deleting product:', error)
      setUploadStatus(`❌ Error: ${error instanceof Error ? error.message : 'Failed to delete product'}`)
      setTimeout(() => setUploadStatus(''), 5000)
    }
  }

  const handleColorImagesChange = async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : []
    const limitedFiles = files.slice(0, MAX_IMAGES)
    
    // Compress images before setting them
    setUploadStatus('Compressing images...')
    try {
      const compressedFiles = await compressImages(limitedFiles)
      const previews = compressedFiles.map((file) => URL.createObjectURL(file))
      
      setColorVariants(colorVariants.map((variant, i) => 
        i === index 
          ? { ...variant, imageFiles: compressedFiles, imagePreviews: previews }
          : variant
      ))
      setUploadStatus('')
    } catch (error) {
      console.error('Error compressing color variant images:', error)
      // Fallback to original files if compression fails
      const previews = limitedFiles.map((file) => URL.createObjectURL(file))
      setColorVariants(colorVariants.map((variant, i) => 
        i === index 
          ? { ...variant, imageFiles: limitedFiles, imagePreviews: previews }
          : variant
      ))
      setUploadStatus('')
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const hasExistingImages = !!editingProductId && existingImages.length > 0
    if (!title || !price || !description || (!imageFiles.length && !hasExistingImages)) {
      setUploadStatus('Please fill all required fields and ensure at least one product image is available')
      return
    }

    if (category === 'Hijabs' && !subCategory) {
      setUploadStatus('Please select Hijab type (Hijab, Hijab Essentials, Luxury Hijabs, or Day to Day Life)')
      return
    }

    setUploading(true)
    setUploadStatus(imageFiles.length > 0 ? 'Uploading files...' : 'Saving product...')

    try {
      const productId = editingProductId || crypto.randomUUID()
      const folderPath = getFolderPath(category, category === 'Hijabs' ? subCategory : undefined)

      let uploadedImages: string[] = []

      if (imageFiles.length > 0) {
        // Upload newly selected images
        const imageFormData = new FormData()
        imageFiles.forEach((file) => {
          imageFormData.append('files', file)
        })
        imageFormData.append('category', category)
        if (subCategory) {
          imageFormData.append('subCategory', subCategory)
        }
        imageFormData.append('productId', productId)

        const imageResponse = await fetch('/api/upload', {
          method: 'POST',
          body: imageFormData,
        })

        if (!imageResponse.ok) {
          const errorData = await imageResponse.json().catch(() => ({}))
          throw new Error(errorData.message || errorData.error || 'Failed to upload images')
        }

        const imageData = await imageResponse.json()
        uploadedImages = imageData.files
      } else if (hasExistingImages) {
        uploadedImages = existingImages
      }

      // Upload color variant images
      const colorVariantsData: ColorVariant[] = []
      for (const variant of colorVariants) {
        if (variant.imageFiles.length > 0) {
          const colorFormData = new FormData()
          variant.imageFiles.forEach((file) => {
            colorFormData.append('files', file)
          })
          colorFormData.append('category', category)
          if (subCategory) {
            colorFormData.append('subCategory', subCategory)
          }
          colorFormData.append('productId', `${productId}_${variant.color}`)

          const colorResponse = await fetch('/api/upload', {
            method: 'POST',
            body: colorFormData,
          })

          if (colorResponse.ok) {
            const colorData = await colorResponse.json()
            colorVariantsData.push({
              color: variant.color,
              images: colorData.files
            })
          } else {
            const errorData = await colorResponse.json().catch(() => ({}))
            console.warn('Color variant image upload failed:', errorData.message || errorData.error)
          }
        } else if (variant.uploadedImages.length > 0) {
          // Already uploaded images (when editing)
          colorVariantsData.push({
            color: variant.color,
            images: variant.uploadedImages
          })
        }
      }

      // Upload video if exists
      let uploadedVideo: string | undefined = undefined
      if (videoFile) {
        const videoFormData = new FormData()
        videoFormData.append('video', videoFile)
        videoFormData.append('category', category)
        if (subCategory) {
          videoFormData.append('subCategory', subCategory)
        }
        videoFormData.append('productId', productId)

        const videoResponse = await fetch('/api/upload-video', {
          method: 'POST',
          body: videoFormData,
        })

        if (videoResponse.ok) {
          const videoData = await videoResponse.json()
          uploadedVideo = videoData.video
        } else {
          const errorData = await videoResponse.json().catch(() => ({}))
          console.warn('Video upload failed:', errorData.message || errorData.error)
        }
      }

      // Prepare product data for API
      const productData = {
        id: productId,
        name: title,
        title,
        description,
        price: parseFloat(price),
        discount,
        weight: weight || undefined,
        category,
        subCategory: category === 'Hijabs' ? subCategory : undefined,
        images: uploadedImages,
        imageColors: imageColors.filter(c => c.trim() !== '').length > 0 ? imageColors : undefined,
        outOfStockImages: outOfStockImages.length > 0 ? outOfStockImages : undefined,
        colorVariants: colorVariantsData.length > 0 ? colorVariantsData : undefined,
        video: uploadedVideo,
        folderPath,
      }

      // Save to API
      const saveResponse = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || 'Failed to save product to database')
      }

      // Refresh products from API
      const refreshResponse = await fetch('/api/products')
      const refreshData = await refreshResponse.json()
      const transformedProducts: DraftProduct[] = refreshData.products.map((p: any) => ({
        id: p.id,
        title: p.name || p.title,
        description: p.description,
        price: String(p.price),
        discount: p.discount,
        category: p.category,
        subCategory: p.subCategory,
        images: p.images || [],
        colorVariants: p.colorVariants,
        video: p.video,
        folderPath: p.folderPath,
      }))
      setProducts(transformedProducts)
      
      setUploading(false)
      setUploadStatus(editingProductId ? '✅ Product Updated Successfully!' : '✅ Upload Successful!')

      // Clean up preview URLs
      imagePreviews.forEach((url) => URL.revokeObjectURL(url))
      if (videoPreview) URL.revokeObjectURL(videoPreview)

      // Clear editing state
      setEditingProductId(null)
      resetForm()
      
      // Reset form element if it exists
      const form = event.currentTarget
      if (form) {
        form.reset()
      }

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' })

      // Keep success message visible for 8 seconds
      setTimeout(() => setUploadStatus(''), 8000)
    } catch (error) {
      console.error('Upload error:', error)
      setUploading(false)
      setUploadStatus(`❌ Error: ${error instanceof Error ? error.message : 'Failed to upload files'}`)
      setTimeout(() => setUploadStatus(''), 5000)
    }
  }

  // Handle category thumbnail upload
  const handleCategoryThumbnailUpload = async (categoryKey: string, file: File) => {
    if (!file) return
    
    setUploadingThumbnail(categoryKey)
    try {
      // Compress image first
      const compressedFile = await compressImage(file)
      
      const formData = new FormData()
      formData.append('category', categoryKey)
      formData.append('file', compressedFile)
      
      const response = await fetch('/api/category-thumbnails', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || 'Failed to upload thumbnail')
      }
      
      const data = await response.json()
      setCategoryThumbnails(prev => ({
        ...prev,
        [categoryKey]: data.thumbnail
      }))
      setUploadStatus(`✅ Thumbnail uploaded successfully for ${categoryKey}`)
      setTimeout(() => setUploadStatus(''), 3000)
    } catch (error) {
      console.error('Error uploading thumbnail:', error)
      setUploadStatus(`❌ Error: ${error instanceof Error ? error.message : 'Failed to upload thumbnail'}`)
      setTimeout(() => setUploadStatus(''), 5000)
    } finally {
      setUploadingThumbnail(null)
    }
  }

  const categoryThumbnailConfig = [
    { key: 'salah-essential', label: '1. Salah Essential', description: 'Modest dresses' },
    { key: 'hijabs', label: '2. Hijabs', description: 'Beautiful hijab collection' },
    { key: 'gift-hampers', label: '3. Gift Hampers', description: 'Beautiful gift hampers with books, flowers & more' },
    { key: 'hair-essentials', label: '4. Hair Essentials', description: 'Complete your look' },
    { key: 'jewellery', label: '5. Jewellery', description: 'Elegant jewellery collection' },
    { key: 'offers', label: '6. Offers', description: 'Limited-time deals & bundles' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header with Logout */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-primary-600 font-semibold">
                Admin Control
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                {editingProductId ? 'Edit Product' : 'Create a new product card'}
              </h1>
              <p className="text-gray-500 mt-2">
                Upload up to 4 images (1 thumbnail + 3 product images) and 1 video with pricing & descriptions. Choose the collection where it should appear.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <FiCheckCircle className="text-primary-600" />
              <span>Files are uploaded to Vercel Blob storage and organized by category.</span>
            </div>
          </div>

          {uploadStatus && (
            <div className={`mb-6 p-6 rounded-2xl shadow-lg animate-fade-in ${
              uploadStatus.includes('✅') 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-2 border-green-300' 
                : uploadStatus.includes('❌')
                ? 'bg-red-50 text-red-700 border-2 border-red-200'
                : 'bg-blue-50 text-blue-700 border-2 border-blue-200'
            }`}>
              <div className="flex items-center gap-4">
                {uploadStatus.includes('✅') && (
                  <div className="flex-shrink-0 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-bold text-xl mb-2">{uploadStatus}</p>
                  {uploadStatus.includes('✅') && (
                    <p className="text-base text-green-700 font-medium">
                      Your product has been {editingProductId ? 'updated' : 'uploaded'} successfully! You can view it in the "All Products" section below.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Product Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex: Silk Hijab - Rose Gold"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:border-primary-500 focus:ring-primary-200"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="Ex: 2499"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:border-primary-500 focus:ring-primary-200"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Weight (g/kg)</label>
                <input
                  type="text"
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                  placeholder="Ex: 250g or 1.5kg"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:border-primary-500 focus:ring-primary-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span>Discount</span>
                  <span className="text-xs text-gray-400 font-normal">(optional, enter %)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={discount}
                    onChange={(event) => setDiscount(event.target.value)}
                    placeholder="Ex: 30 (for 30% off)"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:border-primary-500 focus:ring-primary-200 pr-20"
                  />
                  {discount && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="text-sm font-bold text-primary-600">%</span>
                    </div>
                  )}
                </div>
                {discount && price && (
                  <div className="bg-gradient-to-r from-primary-50 to-pink-50 rounded-xl p-4 border border-primary-200">
                    <p className="text-xs text-gray-600 mb-2 font-medium">Price Preview:</p>
                    <div className="flex items-baseline gap-3">
                      <div className="flex items-baseline gap-1 price-text text-gray-400">
                        <span className="currency text-sm">₹</span>
                        <span className="text-lg font-bold line-through">
                          {Math.floor(Number(price)).toLocaleString('en-IN')}
                        </span>
                        {Number(price) % 1 !== 0 && (
                          <span className="text-sm line-through">
                            .{Math.round((Number(price) % 1) * 100).toString().padStart(2, '0')}
                          </span>
                        )}
                      </div>
                      <span className="text-gray-400">→</span>
                      <div className="flex items-baseline gap-1 price-text text-primary-600">
                        <span className="currency text-sm text-gray-400">₹</span>
                        <span className="text-xl font-bold">
                          {Math.floor(Number(price) * (1 - Number(discount) / 100)).toLocaleString('en-IN')}
                        </span>
                        {(Number(price) * (1 - Number(discount) / 100)) % 1 !== 0 && (
                          <span className="text-sm font-semibold">
                            .{Math.round(((Number(price) * (1 - Number(discount) / 100)) % 1) * 100).toString().padStart(2, '0')}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-primary-600 font-semibold mt-2">
                      You save ₹{Math.floor(Number(price) * (Number(discount) / 100)).toLocaleString('en-IN')} ({discount}% off)
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Description</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Share material, design details, styling tips..."
                rows={4}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:border-primary-500 focus:ring-primary-200"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Collection</label>
                <select
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value)
                    if (event.target.value !== 'Hijabs') {
                      setSubCategory('')
                    }
                  }}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 bg-white focus:border-primary-500 focus:ring-primary-200"
                >
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {(category || subCategory) && (
                  <p className="text-xs text-gray-500 mt-1">
                    📁 Images will be saved to: <span className="font-mono text-primary-600">
                      {getFolderPath(category, category === 'Hijabs' ? subCategory : undefined)}
                    </span>
                  </p>
                )}
              </div>

              {category === 'Hijabs' ? (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Type</label>
                  <select
                    value={subCategory}
                    onChange={(event) => setSubCategory(event.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 bg-white focus:border-primary-500 focus:ring-primary-200"
                    required
                  >
                    <option value="">Select type...</option>
                    <option value="Hijab">Hijab</option>
                    <option value="Accessory">Hijab Essentials</option>
                    <option value="Luxury">Luxury Hijabs</option>
                    <option value="Day to Day Life">Day to Day Life</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Upload Product Images</label>
                  <div className="border border-dashed border-gray-300 rounded-2xl p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImagesChange}
                      className="hidden"
                      id="product-images"
                    />
                    <label htmlFor="product-images" className="cursor-pointer flex flex-col items-center space-y-2 text-gray-500">
                      <FiUploadCloud className="w-8 h-8 text-primary-500" />
                      <div>
                        <p className="font-semibold text-gray-700">Upload up to 4 images</p>
                        <p className="text-xs text-gray-400">PNG, JPG, JPEG (1st image = Thumbnail)</p>
                      </div>
                    </label>
                    <p className="text-xs text-gray-400 mt-2">Selected: {imagePreviews.length} / {MAX_IMAGES}</p>
                  </div>
                </div>
              )}
            </div>

            {category === 'Hijabs' && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Upload Product Images</label>
                <div className="border border-dashed border-gray-300 rounded-2xl p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImagesChange}
                    className="hidden"
                    id="product-images-hijabs"
                  />
                  <label htmlFor="product-images-hijabs" className="cursor-pointer flex flex-col items-center space-y-2 text-gray-500">
                    <FiUploadCloud className="w-8 h-8 text-primary-500" />
                    <div>
                      <p className="font-semibold text-gray-700">Upload up to 4 images</p>
                      <p className="text-xs text-gray-400">PNG, JPG, JPEG (1st image = Thumbnail)</p>
                    </div>
                  </label>
                  <p className="text-xs text-gray-400 mt-2">Selected: {imagePreviews.length} / {MAX_IMAGES}</p>
                </div>
              </div>
            )}

            {imagePreviews.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Image Preview</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {imagePreviews.map((src, index) => (
                    <div key={index} className="space-y-2">
                      <div className="relative rounded-2xl overflow-hidden border-2 shadow-lg transition-all hover:shadow-xl" style={{
                        borderColor: index === 0 ? '#92487A' : '#e5e7eb',
                        borderWidth: index === 0 ? '3px' : '2px'
                      }}>
                        <img src={src} alt={`Preview ${index + 1}`} className="w-full h-40 object-cover" />
                        
                        {/* Thumbnail Badge - Enhanced */}
                        {index === 0 && (
                          <div className="absolute top-3 left-3 z-10">
                            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xl flex items-center gap-2 border-2 border-white/30 backdrop-blur-sm">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>THUMBNAIL</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Mark Out of Stock - Enhanced */}
                        <div className="absolute top-3 right-3 z-10">
                          <label className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg cursor-pointer transition-all duration-200 ${
                            outOfStockImages.includes(index) 
                              ? 'bg-red-600 hover:bg-red-700 text-white' 
                              : 'bg-white/95 backdrop-blur-sm hover:bg-white text-gray-700 border-2 border-gray-200 hover:border-red-300'
                          }`}>
                            <input
                              type="checkbox"
                              checked={outOfStockImages.includes(index)}
                              onChange={() => toggleOutOfStock(index)}
                              className="sr-only"
                            />
                            {outOfStockImages.includes(index) ? (
                              <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-xs font-bold">Out of Stock</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5 text-red-500 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span className="text-xs font-semibold">Mark Out of Stock</span>
                              </>
                            )}
                          </label>
                        </div>
                        
                        {/* Out of Stock Overlay - Enhanced */}
                        {outOfStockImages.includes(index) && (
                          <div className="absolute inset-0 bg-gradient-to-br from-red-500/30 via-red-600/20 to-red-700/30 flex items-center justify-center pointer-events-none backdrop-blur-[1px]">
                            <div className="bg-red-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-2xl border-4 border-white/50 transform rotate-[-2deg]">
                              <div className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span>OUT OF STOCK</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">
                          {index === 0 ? 'Thumbnail' : `Image ${index + 1}`} Color Name
                        </label>
                        <input
                          type="text"
                          value={imageColors[index] || ''}
                          onChange={(e) => handleImageColorChange(index, e.target.value)}
                          placeholder={index === 0 ? 'Thumbnail color (optional)' : `e.g., ${index === 1 ? 'brown lightbround morelightbroud' : index === 2 ? 'green lightgreen morelightgreen' : 'black blue lightbule'}`}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-200"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  <span className="font-semibold text-primary-600">Note:</span> The first image (Image 1) is the <strong>Thumbnail</strong> that will be shown in product listings. Images 2-4 will be shown in the product detail page.
                </p>
              </div>
            )}

            {/* Color Variants Section */}
            <div className="space-y-4 border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Color Variants (Optional)</label>
                <span className="text-xs text-gray-500">Add different colors with their own images</span>
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentColor}
                  onChange={(e) => setCurrentColor(e.target.value)}
                  placeholder="Enter color name (e.g., Red, Blue, Black)"
                  className="flex-1 rounded-2xl border border-gray-200 px-4 py-2 focus:border-primary-500 focus:ring-primary-200"
                />
                <button
                  type="button"
                  onClick={addColorVariant}
                  className="px-6 py-2 bg-primary-600 text-white rounded-2xl font-semibold hover:bg-primary-700 transition-colors"
                >
                  Add Color
                </button>
              </div>

              {colorVariants.length > 0 && (
                <div className="space-y-4">
                  {colorVariants.map((variant, index) => (
                    <div key={index} className="border border-gray-200 rounded-2xl p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 capitalize">{variant.color}</h4>
                        <button
                          type="button"
                          onClick={() => removeColorVariant(index)}
                          className="text-red-600 hover:text-red-700 text-sm font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="border border-dashed border-gray-300 rounded-2xl p-4 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleColorImagesChange(index, e)}
                          className="hidden"
                          id={`color-images-${index}`}
                        />
                        <label htmlFor={`color-images-${index}`} className="cursor-pointer flex flex-col items-center space-y-2 text-gray-500">
                          <FiUploadCloud className="w-6 h-6 text-primary-500" />
                          <div>
                            <p className="font-semibold text-gray-700 text-sm">Upload images for {variant.color}</p>
                            <p className="text-xs text-gray-400">Up to {MAX_IMAGES} images</p>
                          </div>
                        </label>
                        <p className="text-xs text-gray-400 mt-2">
                          Selected: {variant.imagePreviews.length} / {MAX_IMAGES}
                        </p>
                      </div>
                      {variant.imagePreviews.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {variant.imagePreviews.map((src, imgIndex) => (
                            <div key={imgIndex} className="rounded-lg overflow-hidden border border-gray-100">
                              <img src={src} alt={`${variant.color} ${imgIndex + 1}`} className="w-full h-24 object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Upload Product Video</label>
              <div className="border border-dashed border-gray-300 rounded-2xl p-4 text-center">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                  id="product-video"
                />
                <label htmlFor="product-video" className="cursor-pointer flex flex-col items-center space-y-2 text-gray-500">
                  <FiPlay className="w-8 h-8 text-primary-500" />
                  <div>
                    <p className="font-semibold text-gray-700">Upload a video</p>
                    <p className="text-xs text-gray-400">MP4, MOV, WEBM (max 1 minute, auto-compressed)</p>
                  </div>
                </label>
                {videoPreview && (
                  <video controls className="mt-4 rounded-2xl w-full border border-gray-100">
                    <source src={videoPreview} />
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={uploading}
                className="inline-flex items-center justify-center rounded-full bg-primary-600 px-8 py-3 font-semibold text-white shadow-lg shadow-primary-600/30 hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : editingProductId ? 'Update Product' : 'Upload Product'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-gray-300 px-8 py-3 font-semibold text-gray-600 hover:border-primary-200 hover:text-primary-600 transition-colors"
              >
                Reset Form
              </button>
            </div>
          </form>
        </div>

        {/* Category Thumbnails Management Section */}
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-100">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.2em] text-primary-600 font-semibold mb-2">
              Category Management
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Category Thumbnails
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Upload custom thumbnail images for each category in the "Shop by Category" section. These images will be displayed on the homepage.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {categoryThumbnailConfig.map((category) => (
              <div
                key={category.key}
                className="border-2 border-gray-200 rounded-xl p-4 sm:p-5 bg-gray-50 hover:border-primary-300 transition-all"
              >
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-1">
                    {category.label}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {category.description}
                  </p>
                </div>

                {/* Current Thumbnail Preview */}
                {categoryThumbnails[category.key] ? (
                  <div className="relative mb-3 rounded-lg overflow-hidden border-2 border-primary-300">
                    <img
                      src={categoryThumbnails[category.key]}
                      alt={category.label}
                      className="w-full h-32 sm:h-40 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded">
                      Current
                    </div>
                  </div>
                ) : (
                  <div className="mb-3 h-32 sm:h-40 bg-gradient-to-br from-primary-200 to-primary-300 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                    <p className="text-xs sm:text-sm text-gray-500 text-center px-2">
                      No thumbnail uploaded
                    </p>
                  </div>
                )}

                {/* Upload Button */}
                <div className="w-full">
                  <input
                    type="file"
                    id={`thumbnail-upload-${category.key}`}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleCategoryThumbnailUpload(category.key, file)
                      }
                      e.target.value = '' // Reset input
                    }}
                    className="hidden"
                    disabled={uploadingThumbnail === category.key}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById(`thumbnail-upload-${category.key}`) as HTMLInputElement
                      if (input && !uploadingThumbnail) {
                        input.click()
                      }
                    }}
                    disabled={uploadingThumbnail === category.key}
                    className="w-full px-4 py-2.5 bg-primary-600 text-white rounded-lg font-semibold text-sm sm:text-base hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    {uploadingThumbnail === category.key ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <FiUploadCloud className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>{categoryThumbnails[category.key] ? 'Change Thumbnail' : 'Upload Thumbnail'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {loadingProducts ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : products.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedFolder ? `Products in ${selectedFolder}` : `All Products (${products.length})`}
              </h2>
              <div className="flex items-center gap-3">
                {selectedFolder && (
                  <button
                    onClick={() => setSelectedFolder(null)}
                    className="text-sm text-gray-600 hover:text-primary-600 font-semibold flex items-center gap-1"
                  >
                    <span>←</span>
                    <span>Back to All</span>
                  </button>
                )}
                <button
                  onClick={async () => {
                    setLoadingProducts(true)
                    const response = await fetch('/api/products')
                    const data = await response.json()
                    const transformedProducts: DraftProduct[] = data.products.map((p: any) => ({
                      id: p.id,
                      title: p.name || p.title,
                      description: p.description,
                      price: String(p.price),
                      discount: p.discount,
                      category: p.category,
                      subCategory: p.subCategory,
                      images: p.images || [],
                      outOfStockImages: p.outOfStockImages || [],
                      colorVariants: p.colorVariants,
                      video: p.video,
                      folderPath: p.folderPath,
                    }))
                    setProducts(transformedProducts)
                    setLoadingProducts(false)
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Folder Navigation - Show only when no folder selected */}
            {!selectedFolder ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Browse by Folder</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from(new Set(products.map(p => p.folderPath).filter(Boolean))).map((folderPath) => {
                    const folderProducts = products.filter(p => p.folderPath === folderPath)
                    return (
                      <button
                        key={folderPath}
                        onClick={() => setSelectedFolder(folderPath || '')}
                        className="p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left group shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <FiFolder className="w-6 h-6 text-primary-600 group-hover:text-primary-700" />
                          <span className="text-base font-semibold text-gray-700 group-hover:text-primary-600">
                            {folderPath?.replace('images/', '') || 'No Folder'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 font-medium">
                          {folderProducts.length} {folderProducts.length === 1 ? 'product' : 'products'}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* Products Grid - Show only when folder is selected */
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.filter(p => p.folderPath === selectedFolder).map((product) => (
                <div key={product.id} className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="aspect-[4/3] relative">
                    {product.images[0] ? (
                      <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                        No image
                      </div>
                    )}
                    <span className="absolute top-4 left-4 bg-white/80 text-xs font-semibold text-gray-800 px-3 py-1 rounded-full">
                      {product.category}{product.subCategory ? ` - ${product.subCategory}` : ''}
                    </span>
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-gray-900 text-lg">{product.title}</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingProductId(product.id)
                            setTitle(product.title)
                            setDescription(product.description)
                            setPrice(product.price)
                            setDiscount(product.discount || '')
                            setWeight(product.weight || '')
                            setCategory(product.category)
                            setSubCategory(product.subCategory || '')
                            // If images are server paths, use them directly; otherwise they're preview URLs
                            setImagePreviews(product.images)
                            setImageFiles([]) // Clear file objects when editing
                            setExistingImages(product.images || [])
                            setImageColors(product.imageColors && product.imageColors.length > 0 ? [...product.imageColors, '', '', ''].slice(0, 3) : ['', '', ''])
                            setOutOfStockImages(product.outOfStockImages || [])
                            setVideoPreview(product.video)
                            setVideoFile(null) // Clear video file when editing
                            // Load color variants if they exist
                            if (product.colorVariants && product.colorVariants.length > 0) {
                              setColorVariants(product.colorVariants.map(v => ({
                                color: v.color,
                                imageFiles: [],
                                imagePreviews: [],
                                uploadedImages: v.images
                              })))
                            } else {
                              setColorVariants([])
                            }
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                          className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit product"
                        >
                          <FiEdit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete product"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                    {product.weight && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-semibold">Weight:</span>
                        <span>{product.weight}</span>
                      </div>
                    )}
                    <div className="space-y-2">
                      {product.discount && Number(product.discount) > 0 ? (
                        <div className="flex items-baseline gap-3 flex-wrap">
                          <div className="flex items-baseline gap-1 price-text text-gray-400">
                            <span className="currency text-lg">₹</span>
                            <p className="text-2xl font-bold line-through">
                              {Math.floor(Number(product.price)).toLocaleString('en-IN')}
                            </p>
                            {Number(product.price) % 1 !== 0 && (
                              <span className="text-lg line-through">
                                .{Math.round((Number(product.price) % 1) * 100).toString().padStart(2, '0')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-baseline gap-1 price-text text-primary-600">
                            <span className="currency text-xl text-gray-400">₹</span>
                            <p className="text-3xl font-bold">
                              {Math.floor(Number(product.price) * (1 - Number(product.discount) / 100)).toLocaleString('en-IN')}
                            </p>
                            {(Number(product.price) * (1 - Number(product.discount) / 100)) % 1 !== 0 && (
                              <span className="text-xl font-semibold">
                                .{Math.round(((Number(product.price) * (1 - Number(product.discount) / 100)) % 1) * 100).toString().padStart(2, '0')}
                              </span>
                            )}
                          </div>
                          <span className="inline-flex flex-col items-center justify-center bg-gradient-to-r from-red-500 via-pink-500 to-primary-600 text-white px-4 py-2 rounded-full shadow-lg transform hover:scale-105 transition-transform relative overflow-hidden min-w-[90px]">
                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></span>
                            <span className="relative z-10 flex flex-col items-center gap-0.5">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider leading-tight">DISCOUNT</span>
                              <span className="text-xs font-bold">{product.discount}% OFF</span>
                            </span>
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1 price-text text-primary-600">
                          <span className="currency text-xl text-gray-400">₹</span>
                          <p className="text-3xl font-bold">
                            {Math.floor(Number(product.price)).toLocaleString('en-IN')}
                          </p>
                          {Number(product.price) % 1 !== 0 && (
                            <span className="text-xl font-semibold">
                              .{Math.round((Number(product.price) % 1) * 100).toString().padStart(2, '0')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {product.video && (
                      <video controls className="w-full rounded-2xl border border-gray-100">
                        <source src={product.video} />
                      </video>
                    )}
                  </div>
                </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No products yet. Upload your first product above!</p>
          </div>
        )}
      </div>
    </div>
  )
}


