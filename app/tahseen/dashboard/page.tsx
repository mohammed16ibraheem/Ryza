/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useEffect } from 'react'
import { FiUploadCloud, FiCheckCircle, FiTrash2, FiEdit2, FiFolder } from 'react-icons/fi'
import { compressImage, compressImages } from '@/lib/compression'

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
  const [products, setProducts] = useState<DraftProduct[]>([])
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  
  // Color variants state
  const [colorVariants, setColorVariants] = useState<Array<{color: string, imageFiles: File[], imagePreviews: string[], uploadedImages: string[]}>>([])
  const [currentColor, setCurrentColor] = useState('')

  // Category thumbnails state
  const [categoryThumbnails, setCategoryThumbnails] = useState<{ [key: string]: string }>({})
  const [uploadingThumbnail, setUploadingThumbnail] = useState<string | null>(null)

  // Shipping settings state
  const [shippingSettings, setShippingSettings] = useState({
    freeShippingThreshold: 5000,
    shippingCost: 200,
  })
  const [savingShippingSettings, setSavingShippingSettings] = useState(false)

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

  // Fetch shipping settings - MUST be before any early returns
  useEffect(() => {
    if (isAuthenticated !== true) return // Only fetch if authenticated
    
    const fetchShippingSettings = async () => {
      try {
        const response = await fetch('/api/shipping-settings', {
          cache: 'no-store', // Always fetch fresh data
        })
        const data = await response.json()
        if (data.freeShippingThreshold !== undefined || data.shippingCost !== undefined) {
          // IMPORTANT: Check for undefined/null, not falsy (0 is valid!)
          const threshold = data.freeShippingThreshold !== undefined && data.freeShippingThreshold !== null
            ? Number(data.freeShippingThreshold)
            : 5000
          const shippingCost = data.shippingCost !== undefined && data.shippingCost !== null
            ? Number(data.shippingCost)
            : 200
          setShippingSettings({
            freeShippingThreshold: threshold,
            shippingCost: shippingCost,
          })
        }
      } catch (error) {
        console.error('Error fetching shipping settings:', error)
      }
    }
    
    fetchShippingSettings()
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

  // Handle bulk image upload (replaces all)
  const handleImagesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : []
    const availableSlots = MAX_IMAGES - (imagePreviews.length + existingImages.length)
    const limitedFiles = files.slice(0, availableSlots > 0 ? availableSlots : 0)
    
    if (limitedFiles.length === 0) {
      showToastNotification('Maximum 4 images allowed. Remove some images first.', 'error')
      return
    }
    
    // Compress images before setting them
    setUploadStatus('Compressing images...')
    try {
      const compressedFiles = await compressImages(limitedFiles)
      setImageFiles([...imageFiles, ...compressedFiles])
      const newPreviews = compressedFiles.map((file) => URL.createObjectURL(file))
      setImagePreviews([...imagePreviews, ...newPreviews])
      // Extend imageColors array if needed
      const currentColors = [...imageColors]
      while (currentColors.length < imagePreviews.length + newPreviews.length) {
        currentColors.push('')
      }
      setImageColors(currentColors.slice(0, MAX_IMAGES))
      setUploadStatus('')
    } catch (error) {
      console.error('Error compressing images:', error)
      // Fallback to original files if compression fails
      setImageFiles([...imageFiles, ...limitedFiles])
      const newPreviews = limitedFiles.map((file) => URL.createObjectURL(file))
      setImagePreviews([...imagePreviews, ...newPreviews])
      const currentColors = [...imageColors]
      while (currentColors.length < imagePreviews.length + newPreviews.length) {
        currentColors.push('')
      }
      setImageColors(currentColors.slice(0, MAX_IMAGES))
      setUploadStatus('')
    }
    // Reset input
    event.target.value = ''
  }

  // Handle single image addition
  const handleAddSingleImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const totalImages = imagePreviews.length + existingImages.length
    if (totalImages >= MAX_IMAGES) {
      showToastNotification('Maximum 4 images allowed. Remove some images first.', 'error')
      event.target.value = ''
      return
    }
    
    if (!file.type.startsWith('image/')) {
      showToastNotification('Please select a valid image file', 'error')
      event.target.value = ''
      return
    }
    
    setUploadStatus('Compressing image...')
    try {
      const compressedFile = await compressImage(file)
      setImageFiles([...imageFiles, compressedFile])
      const newPreview = URL.createObjectURL(compressedFile)
      setImagePreviews([...imagePreviews, newPreview])
      // Extend imageColors array if needed
      const currentColors = [...imageColors]
      currentColors.push('')
      setImageColors(currentColors.slice(0, MAX_IMAGES))
      setUploadStatus('')
    } catch (error) {
      console.error('Error compressing image:', error)
      setImageFiles([...imageFiles, file])
      const newPreview = URL.createObjectURL(file)
      setImagePreviews([...imagePreviews, newPreview])
      const currentColors = [...imageColors]
      currentColors.push('')
      setImageColors(currentColors.slice(0, MAX_IMAGES))
      setUploadStatus('')
    }
    event.target.value = ''
  }

  // Remove an image (from previews)
  const handleRemoveImage = (index: number) => {
    // Revoke object URL to prevent memory leak
    if (imagePreviews[index]) {
      URL.revokeObjectURL(imagePreviews[index])
    }
    
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    const newFiles = imageFiles.filter((_, i) => i !== index)
    const newColors = imageColors.filter((_, i) => i !== index)
    const newOutOfStock = outOfStockImages.filter(i => i !== index).map(i => i > index ? i - 1 : i)
    
    setImagePreviews(newPreviews)
    setImageFiles(newFiles)
    setImageColors(newColors)
    setOutOfStockImages(newOutOfStock)
  }

  // Remove an existing image (from server)
  const handleRemoveExistingImage = (index: number) => {
    const newExisting = existingImages.filter((_, i) => i !== index)
    const newColors = imageColors.filter((_, i) => i !== index)
    const newOutOfStock = outOfStockImages.filter(i => i !== index).map(i => i > index ? i - 1 : i)
    
    setExistingImages(newExisting)
    setImageColors(newColors)
    setOutOfStockImages(newOutOfStock)
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

  const resetForm = () => {
    // Revoke all object URLs to prevent memory leaks
    imagePreviews.forEach(url => URL.revokeObjectURL(url))
    
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
      // Show loading state
      setUploadStatus('Deleting product and files from GitHub...')
      
      const response = await fetch(`/api/products?id=${productId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || 'Failed to delete product')
      }

      // Verify deletion was successful
      const deleteResult = await response.json()
      if (!deleteResult.success) {
        throw new Error('Deletion was not successful')
      }

      // Wait a moment for GitHub to process the deletion
      await new Promise(resolve => setTimeout(resolve, 500))

      // Refresh products from API and verify the product is gone
      const refreshResponse = await fetch('/api/products')
      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh products list after deletion')
      }
      
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
        imageColors: p.imageColors,
        outOfStockImages: p.outOfStockImages || [],
        colorVariants: p.colorVariants,
        folderPath: p.folderPath,
      }))
      
      // Verify the product is actually deleted
      const deletedProductStillExists = transformedProducts.some(p => p.id === productId)
      if (deletedProductStillExists) {
        throw new Error('Product deletion failed - product still exists in the list')
      }
      
      setProducts(transformedProducts)
      setUploadStatus('') // Clear loading status
      
      // Only show success after verification
      showToastNotification('Product and all associated files deleted successfully from GitHub!', 'success')
    } catch (error) {
      console.error('Error deleting product:', error)
      setUploadStatus('') // Clear loading status
      showToastNotification(`Error: ${error instanceof Error ? error.message : 'Failed to delete product'}`, 'error')
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
      showToastNotification('Please fill all required fields and ensure at least one product image is available', 'error')
      return
    }

    if (category === 'Hijabs' && !subCategory) {
      showToastNotification('Please select Hijab type (Hijab, Hijab Essentials, Luxury Hijabs, or Day to Day Life)', 'error')
      return
    }

    setUploading(true)
    setUploadStatus(imageFiles.length > 0 ? 'Uploading images to GitHub...' : 'Saving product...')

    try {
      const productId = editingProductId || crypto.randomUUID()
      const folderPath = getFolderPath(category, category === 'Hijabs' ? subCategory : undefined)

      let uploadedImages: string[] = []

      // Start with existing images (when editing)
      if (hasExistingImages) {
        uploadedImages = [...existingImages]
      }

      // Upload newly selected images and add to the array
      if (imageFiles.length > 0) {
        setUploadStatus(`Uploading ${imageFiles.length} image(s) to GitHub...`)
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
        if (!imageData.success || !imageData.files || imageData.files.length === 0) {
          throw new Error('Image upload completed but no files were returned')
        }
        
        // Combine existing images with newly uploaded ones
        uploadedImages = [...uploadedImages, ...imageData.files]
        setUploadStatus(`Successfully uploaded ${imageData.files.length} image(s). Saving product...`)
      }

      // Upload color variant images
      const colorVariantsData: ColorVariant[] = []
      if (colorVariants.length > 0) {
        setUploadStatus('Uploading color variant images...')
      }
      for (const variant of colorVariants) {
        if (variant.imageFiles.length > 0) {
          setUploadStatus(`Uploading images for ${variant.color} variant...`)
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
            if (colorData.success && colorData.files && colorData.files.length > 0) {
              colorVariantsData.push({
                color: variant.color,
                images: colorData.files
              })
            } else {
              console.warn(`Color variant ${variant.color} upload completed but no files returned`)
            }
          } else {
            const errorData = await colorResponse.json().catch(() => ({}))
            console.warn('Color variant image upload failed:', errorData.message || errorData.error)
            // Continue with other variants even if one fails
          }
        } else if (variant.uploadedImages.length > 0) {
          // Already uploaded images (when editing)
          colorVariantsData.push({
            color: variant.color,
            images: variant.uploadedImages
          })
        }
      }
      
      // Small delay to ensure GitHub has processed all uploads
      if (imageFiles.length > 0 || colorVariants.some(v => v.imageFiles.length > 0)) {
        await new Promise(resolve => setTimeout(resolve, 300))
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
        imageColors: imageColors.slice(0, uploadedImages.length).filter(c => c.trim() !== '').length > 0 
          ? imageColors.slice(0, uploadedImages.length) 
          : undefined,
        outOfStockImages: outOfStockImages.length > 0 ? outOfStockImages : undefined,
        colorVariants: colorVariantsData.length > 0 ? colorVariantsData : undefined,
        folderPath,
      }

      // Save to API
      setUploadStatus('Saving product data...')
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

      // Verify the saved product has the correct data
      const savedProductData = await saveResponse.json()
      // API returns { success: true, product: {...} }
      if (!savedProductData || !savedProductData.success || !savedProductData.product || !savedProductData.product.id) {
        throw new Error('Product save response is invalid')
      }
      
      // Wait a moment for GitHub to process the save
      await new Promise(resolve => setTimeout(resolve, 500))

      // Refresh products from API
      const refreshResponse = await fetch('/api/products')
      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh products list')
      }
      
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
        imageColors: p.imageColors,
        outOfStockImages: p.outOfStockImages || [], // IMPORTANT: Include out of stock images
        colorVariants: p.colorVariants,
        folderPath: p.folderPath,
      }))
      
      // Verify the product is actually in the list
      const savedProduct = transformedProducts.find(p => p.id === productId)
      if (!savedProduct) {
        throw new Error('Product was not found in the list after saving')
      }
      
      // Verify critical fields match
      if (savedProduct.title !== title || savedProduct.price !== String(price)) {
        throw new Error('Product data mismatch after saving')
      }
      
      // Verify out of stock images are saved correctly
      const savedOutOfStock = savedProduct.outOfStockImages || []
      const expectedOutOfStock = outOfStockImages || []
      if (JSON.stringify(savedOutOfStock.sort()) !== JSON.stringify(expectedOutOfStock.sort())) {
        console.warn('Out of stock status mismatch - saved:', savedOutOfStock, 'expected:', expectedOutOfStock)
        // Don't throw error, just warn - this might be a display issue
      }
      
      // Verify images are saved
      if (savedProduct.images.length === 0 && uploadedImages.length > 0) {
        throw new Error('Product images were not saved correctly')
      }
      
      setProducts(transformedProducts)
      
      setUploading(false)
      setUploadStatus('') // Clear loading status
      
      // Only show success after all verifications pass
      showToastNotification(editingProductId ? 'Product updated successfully! Changes are live.' : 'Product uploaded successfully! Now visible in user UI.', 'success')

      // Clean up preview URLs
      imagePreviews.forEach((url) => URL.revokeObjectURL(url))

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

      // Status cleared, toast notification shows success
    } catch (error) {
      console.error('Upload error:', error)
      setUploading(false)
      setUploadStatus('') // Clear loading status on error
      showToastNotification(`Error: ${error instanceof Error ? error.message : 'Failed to upload files'}`, 'error')
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
      if (!data.thumbnail) {
        throw new Error('Thumbnail upload response is invalid')
      }
      
      // Wait a moment for GitHub to process
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Verify thumbnail was saved by fetching it
      const verifyResponse = await fetch(`/api/category-thumbnails?category=${categoryKey}`)
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json()
        if (verifyData.thumbnail !== data.thumbnail) {
          throw new Error('Thumbnail verification failed')
        }
      }
      
      setCategoryThumbnails(prev => ({
        ...prev,
        [categoryKey]: data.thumbnail
      }))
      showToastNotification(`Thumbnail uploaded successfully for ${categoryKey.replace(/-/g, ' ')}! Now visible in user UI.`, 'success')
    } catch (error) {
      console.error('Error uploading thumbnail:', error)
      showToastNotification(`Error: ${error instanceof Error ? error.message : 'Failed to upload thumbnail'}`, 'error')
    } finally {
      setUploadingThumbnail(null)
    }
  }

  // Handle shipping settings save
  const handleSaveShippingSettings = async () => {
    setSavingShippingSettings(true)
    try {
      const response = await fetch('/api/shipping-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shippingSettings),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save shipping settings')
      }

      // Get the saved settings from the response
      const savedData = await response.json()
      if (savedData.settings && (savedData.settings.freeShippingThreshold !== undefined || savedData.settings.shippingCost !== undefined)) {
        const threshold = savedData.settings.freeShippingThreshold !== undefined && savedData.settings.freeShippingThreshold !== null
          ? Number(savedData.settings.freeShippingThreshold)
          : shippingSettings.freeShippingThreshold
        const shippingCost = savedData.settings.shippingCost !== undefined && savedData.settings.shippingCost !== null
          ? Number(savedData.settings.shippingCost)
          : shippingSettings.shippingCost
        // Wait a moment for GitHub to process
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Verify settings were saved
        const verifyResponse = await fetch('/api/shipping-settings', { cache: 'no-store' })
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json()
          if (verifyData.freeShippingThreshold !== threshold || verifyData.shippingCost !== shippingCost) {
            throw new Error('Shipping settings verification failed')
          }
        }
        
        setShippingSettings({
          freeShippingThreshold: threshold,
          shippingCost: shippingCost,
        })
        showToastNotification('Shipping settings saved successfully! Changes are live in user UI.', 'success')
      } else {
        // Fallback: Refresh shipping settings after a short delay to ensure blob is written
        setTimeout(async () => {
          try {
            const refreshResponse = await fetch('/api/shipping-settings', {
              cache: 'no-store',
            })
            const refreshData = await refreshResponse.json()
            if (refreshData.freeShippingThreshold !== undefined || refreshData.shippingCost !== undefined) {
              // IMPORTANT: Check for undefined/null, not falsy (0 is valid!)
              const threshold = refreshData.freeShippingThreshold !== undefined && refreshData.freeShippingThreshold !== null
                ? Number(refreshData.freeShippingThreshold)
                : 5000
              const shippingCost = refreshData.shippingCost !== undefined && refreshData.shippingCost !== null
                ? Number(refreshData.shippingCost)
                : 200
              
              // Verify before updating
              if (refreshData.freeShippingThreshold === shippingSettings.freeShippingThreshold && 
                  refreshData.shippingCost === shippingSettings.shippingCost) {
                setShippingSettings({
                  freeShippingThreshold: threshold,
                  shippingCost: shippingCost,
                })
                showToastNotification('Shipping settings saved successfully! Changes are live in user UI.', 'success')
              }
            }
          } catch (err) {
            console.error('Error refreshing settings:', err)
            showToastNotification('Error: Failed to verify shipping settings', 'error')
          }
        }, 500)
      }
    } catch (error) {
      console.error('Error saving shipping settings:', error)
      showToastNotification(`Error: ${error instanceof Error ? error.message : 'Failed to save shipping settings'}`, 'error')
    } finally {
      setSavingShippingSettings(false)
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

  // Toast notification function
  const showToastNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
    setTimeout(() => {
      setShowToast(false)
    }, 4000) // Auto-hide after 4 seconds
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 md:py-12 lg:py-16">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className={`rounded-xl shadow-2xl border-2 p-4 sm:p-5 min-w-[280px] sm:min-w-[350px] max-w-[90vw] backdrop-blur-sm ${
            toastType === 'success'
              ? 'bg-green-50/95 border-green-300 text-green-800'
              : toastType === 'error'
              ? 'bg-red-50/95 border-red-300 text-red-800'
              : 'bg-blue-50/95 border-blue-300 text-blue-800'
          }`}>
            <div className="flex items-start gap-3 sm:gap-4">
              {toastType === 'success' && (
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
            </div>
              )}
              {toastType === 'error' && (
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
            </div>
              )}
              {toastType === 'info' && (
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
          </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm sm:text-base md:text-lg break-words">{toastMessage}</p>
              </div>
              <button
                onClick={() => setShowToast(false)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
              </button>
            </div>
          </div>
                  </div>
                )}

      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 space-y-6 sm:space-y-8 md:space-y-10">
        {/* Header with Logout */}
        <div className="flex justify-end mb-2 sm:mb-4">
          <button
            onClick={handleLogout}
            className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2 text-sm sm:text-base min-h-[44px]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden">Out</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
                <div className="flex-1">
              <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-primary-600 font-semibold">
                Admin Control
              </p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mt-1">
                {editingProductId ? 'Edit Product' : 'Create a new product card'}
              </h1>
              <p className="text-gray-500 mt-2 text-sm sm:text-base">
                Upload up to 4 images (1 thumbnail + 3 product images) with pricing & descriptions. Choose the collection where it should appear.
                    </p>
                </div>
          </div>

          {/* Loading status for processing (compressing, uploading, etc.) */}
          {uploadStatus && !uploadStatus.includes('✅') && !uploadStatus.includes('❌') && (
            <div className="mb-4 sm:mb-6 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg bg-blue-50 text-blue-700 border-2 border-blue-200">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-3 border-blue-600 border-t-transparent"></div>
                <p className="font-semibold text-sm sm:text-base">{uploadStatus}</p>
              </div>
            </div>
          )}

          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Product Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex: Silk Hijab - Rose Gold"
                  className="w-full rounded-xl sm:rounded-2xl border border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-primary-500 focus:ring-primary-200 min-h-[44px]"
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
                  className="w-full rounded-xl sm:rounded-2xl border border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-primary-500 focus:ring-primary-200 min-h-[44px]"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Weight (g/kg)</label>
                <input
                  type="text"
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                  placeholder="Ex: 250g or 1.5kg"
                  className="w-full rounded-xl sm:rounded-2xl border border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-primary-500 focus:ring-primary-200 min-h-[44px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 flex-wrap">
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
                    className="w-full rounded-xl sm:rounded-2xl border border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-primary-500 focus:ring-primary-200 pr-16 sm:pr-20 min-h-[44px]"
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
                className="w-full rounded-xl sm:rounded-2xl border border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-primary-500 focus:ring-primary-200 resize-y"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
                  className="w-full rounded-xl sm:rounded-2xl border border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3 bg-white text-sm sm:text-base focus:border-primary-500 focus:ring-primary-200 min-h-[44px]"
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
                    className="w-full rounded-xl sm:rounded-2xl border border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3 bg-white text-sm sm:text-base focus:border-primary-500 focus:ring-primary-200 min-h-[44px]"
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
                  <label className="text-sm font-semibold text-gray-700">
                    {editingProductId ? 'Product Images (Edit Mode)' : 'Upload Product Images'}
                  </label>
                  {editingProductId && existingImages.length > 0 && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-blue-800 font-semibold">
                        ⓘ Edit Mode: Only existing images can be used. Remove images if needed, but new uploads are disabled.
                      </p>
                    </div>
                  )}
                  {!editingProductId && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Bulk Upload */}
                      <div className="border border-dashed border-gray-300 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImagesChange}
                      className="hidden"
                          id="product-images-bulk"
                          disabled={imagePreviews.length + existingImages.length >= MAX_IMAGES || !!editingProductId}
                    />
                        <label htmlFor="product-images-bulk" className={`cursor-pointer flex flex-col items-center space-y-2 text-gray-500 min-h-[100px] sm:min-h-[120px] justify-center ${imagePreviews.length + existingImages.length >= MAX_IMAGES || editingProductId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <FiUploadCloud className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500" />
                      <div>
                            <p className="font-semibold text-gray-700 text-sm sm:text-base">Upload Multiple</p>
                            <p className="text-xs text-gray-400 mt-1">Select multiple at once</p>
                      </div>
                    </label>
                      </div>
                      {/* Single Upload */}
                      <div className="border border-dashed border-gray-300 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAddSingleImage}
                          className="hidden"
                          id="product-images-single"
                          disabled={imagePreviews.length + existingImages.length >= MAX_IMAGES || !!editingProductId}
                        />
                        <label htmlFor="product-images-single" className={`cursor-pointer flex flex-col items-center space-y-2 text-gray-500 min-h-[100px] sm:min-h-[120px] justify-center ${imagePreviews.length + existingImages.length >= MAX_IMAGES || editingProductId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <FiUploadCloud className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500" />
                          <div>
                            <p className="font-semibold text-gray-700 text-sm sm:text-base">Add One Image</p>
                            <p className="text-xs text-gray-400 mt-1">Add images one by one</p>
                          </div>
                        </label>
                  </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 text-center">
                    Images: {imagePreviews.length + existingImages.length} / {MAX_IMAGES} (1st image = Thumbnail)
                  </p>
                </div>
              )}
            </div>

            {category === 'Hijabs' && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  {editingProductId ? 'Product Images (Edit Mode)' : 'Upload Product Images'}
                </label>
                {editingProductId && existingImages.length > 0 && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-blue-800 font-semibold">
                      ⓘ Edit Mode: Only existing images can be used. Remove images if needed, but new uploads are disabled.
                    </p>
                  </div>
                )}
                {!editingProductId && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Bulk Upload */}
                    <div className="border border-dashed border-gray-300 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImagesChange}
                    className="hidden"
                      id="product-images-hijabs-bulk"
                      disabled={imagePreviews.length + existingImages.length >= MAX_IMAGES || !!editingProductId}
                  />
                      <label htmlFor="product-images-hijabs-bulk" className={`cursor-pointer flex flex-col items-center space-y-2 text-gray-500 min-h-[100px] sm:min-h-[120px] justify-center ${imagePreviews.length + existingImages.length >= MAX_IMAGES || editingProductId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <FiUploadCloud className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500" />
                    <div>
                          <p className="font-semibold text-gray-700 text-sm sm:text-base">Upload Multiple</p>
                          <p className="text-xs text-gray-400 mt-1">Select multiple at once</p>
                    </div>
                  </label>
                </div>
                    {/* Single Upload */}
                    <div className="border border-dashed border-gray-300 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAddSingleImage}
                        className="hidden"
                      id="product-images-hijabs-single"
                      disabled={imagePreviews.length + existingImages.length >= MAX_IMAGES || !!editingProductId}
                      />
                      <label htmlFor="product-images-hijabs-single" className={`cursor-pointer flex flex-col items-center space-y-2 text-gray-500 min-h-[100px] sm:min-h-[120px] justify-center ${imagePreviews.length + existingImages.length >= MAX_IMAGES || editingProductId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <FiUploadCloud className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500" />
                        <div>
                          <p className="font-semibold text-gray-700 text-sm sm:text-base">Add One Image</p>
                          <p className="text-xs text-gray-400 mt-1">Add images one by one</p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-400 text-center">
                  Images: {imagePreviews.length + existingImages.length} / {MAX_IMAGES} (1st image = Thumbnail)
                </p>
              </div>
            )}

            {/* Show existing images when editing */}
            {existingImages.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Existing Images</p>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {existingImages.map((src, index) => {
                    const displayIndex = index
                    return (
                      <div key={`existing-${index}`} className="space-y-2">
                        <div className="relative rounded-2xl overflow-hidden border-2 shadow-lg transition-all hover:shadow-xl" style={{
                          borderColor: displayIndex === 0 ? '#92487A' : '#e5e7eb',
                          borderWidth: displayIndex === 0 ? '3px' : '2px'
                      }}>
                          <img src={src} alt={`Existing ${displayIndex + 1}`} className="w-full h-40 object-cover" />
                          
                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(index)}
                            className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-lg z-20"
                            title="Remove image"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                          
                        {/* Thumbnail Badge */}
                          {displayIndex === 0 && (
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
                          
                          {/* Mark Out of Stock */}
                          <div className="absolute bottom-3 right-3 z-10">
                            <label className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg cursor-pointer transition-all duration-200 ${
                              outOfStockImages.includes(displayIndex) 
                                ? 'bg-red-600 hover:bg-red-700 text-white' 
                                : 'bg-white/95 backdrop-blur-sm hover:bg-white text-gray-700 border-2 border-gray-200 hover:border-red-300'
                            }`}>
                            <input
                              type="checkbox"
                                checked={outOfStockImages.includes(displayIndex)}
                                onChange={() => toggleOutOfStock(displayIndex)}
                                className="sr-only"
                              />
                              {outOfStockImages.includes(displayIndex) ? (
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
                          
                          {/* Out of Stock Overlay */}
                          {outOfStockImages.includes(displayIndex) && (
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
                            {displayIndex === 0 ? 'Thumbnail' : `Image ${displayIndex + 1}`} Color Name
                        </label>
                        <input
                          type="text"
                            value={imageColors[displayIndex] || ''}
                            onChange={(e) => handleImageColorChange(displayIndex, e.target.value)}
                            placeholder={displayIndex === 0 ? 'Thumbnail color (optional)' : `e.g., ${displayIndex === 1 ? 'brown lightbround morelightbroud' : displayIndex === 2 ? 'green lightgreen morelightgreen' : 'black blue lightbule'}`}
                            className="w-full rounded-lg border border-gray-200 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-primary-500 focus:ring-primary-200 min-h-[40px]"
                        />
                      </div>
                    </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Show new image previews */}
            {imagePreviews.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                  {existingImages.length > 0 ? 'New Images' : 'Image Preview'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {imagePreviews.map((src, index) => {
                    const displayIndex = existingImages.length + index
                    return (
                      <div key={`preview-${index}`} className="space-y-2">
                        <div className="relative rounded-2xl overflow-hidden border-2 shadow-lg transition-all hover:shadow-xl" style={{
                          borderColor: displayIndex === 0 ? '#92487A' : '#e5e7eb',
                          borderWidth: displayIndex === 0 ? '3px' : '2px'
                        }}>
                          <img src={src} alt={`Preview ${displayIndex + 1}`} className="w-full h-40 object-cover" />
                          
                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-lg z-20"
                            title="Remove image"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        
                          {/* Thumbnail Badge - Enhanced */}
                          {displayIndex === 0 && (
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
                        
                          {/* Mark Out of Stock - Enhanced - Moved to bottom-right */}
                          <div className="absolute bottom-3 right-3 z-10">
                            <label className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg cursor-pointer transition-all duration-200 ${
                              outOfStockImages.includes(displayIndex) 
                                ? 'bg-red-600 hover:bg-red-700 text-white' 
                                : 'bg-white/95 backdrop-blur-sm hover:bg-white text-gray-700 border-2 border-gray-200 hover:border-red-300'
                            }`}>
                              <input
                                type="checkbox"
                                checked={outOfStockImages.includes(displayIndex)}
                                onChange={() => toggleOutOfStock(displayIndex)}
                                className="sr-only"
                              />
                              {outOfStockImages.includes(displayIndex) ? (
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
                          {outOfStockImages.includes(displayIndex) && (
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
                            {displayIndex === 0 ? 'Thumbnail' : `Image ${displayIndex + 1}`} Color Name
                          </label>
                          <input
                            type="text"
                            value={imageColors[displayIndex] || ''}
                            onChange={(e) => handleImageColorChange(displayIndex, e.target.value)}
                            placeholder={displayIndex === 0 ? 'Thumbnail color (optional)' : `e.g., ${displayIndex === 1 ? 'brown lightbround morelightbroud' : displayIndex === 2 ? 'green lightgreen morelightgreen' : 'black blue lightbule'}`}
                            className="w-full rounded-lg border border-gray-200 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-primary-500 focus:ring-primary-200 min-h-[40px]"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  <span className="font-semibold text-primary-600">Note:</span> The first image (Image 1) is the <strong>Thumbnail</strong> that will be shown in product listings. Images 2-4 will be shown in the product detail page. You can upload images in bulk or add them one by one. Click the remove button (🗑️) to remove any image.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="submit"
                disabled={uploading}
                className="inline-flex items-center justify-center rounded-full bg-primary-600 px-6 sm:px-8 py-2.5 sm:py-3 font-semibold text-white text-sm sm:text-base shadow-lg shadow-primary-600/30 hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                {uploading ? 'Uploading...' : editingProductId ? 'Update Product' : 'Upload Product'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-gray-300 px-6 sm:px-8 py-2.5 sm:py-3 font-semibold text-gray-600 text-sm sm:text-base hover:border-primary-200 hover:text-primary-600 transition-colors min-h-[44px]"
              >
                Reset Form
              </button>
            </div>
          </form>
        </div>

        {/* Category Thumbnails Management Section */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 border border-gray-100">
          <div className="mb-4 sm:mb-6">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-primary-600 font-semibold mb-1 sm:mb-2">
              Category Management
            </p>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
              Category Thumbnails
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm md:text-base">
              Upload custom thumbnail images for each category in the "Shop by Category" section. These images will be displayed on the homepage.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
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

        {/* Shipping Settings Section */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 border border-gray-100">
          <div className="mb-4 sm:mb-6">
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-primary-600 font-semibold mb-1 sm:mb-2">
              Store Settings
            </p>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
              Shipping Settings
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm md:text-base">
              Set the free shipping threshold and shipping cost. Enter 0 for free shipping on all orders, or enter an amount above which orders get free shipping.
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Free Shipping Threshold */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Free Shipping Threshold (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={shippingSettings.freeShippingThreshold}
                onChange={(e) =>
                  setShippingSettings({
                    ...shippingSettings,
                    freeShippingThreshold: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-gray-900 text-sm sm:text-base min-h-[44px]"
                placeholder="5000"
              />
              <p className="text-xs text-gray-500 mt-1.5 sm:mt-2">
                Enter 0 for free shipping on all orders. Enter an amount (e.g., 1000) - orders above this amount get free shipping, orders below pay the shipping cost.
              </p>
            </div>

            {/* Shipping Cost */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Shipping Cost (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={shippingSettings.shippingCost}
                onChange={(e) =>
                  setShippingSettings({
                    ...shippingSettings,
                    shippingCost: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-gray-900 text-sm sm:text-base min-h-[44px]"
                placeholder="200"
              />
              <p className="text-xs text-gray-500 mt-1.5 sm:mt-2">
                Enter the shipping cost for orders below the free shipping threshold (e.g., 200, 150, 250).
              </p>
            </div>

            {/* Preview Section */}
            <div className="bg-primary-50 border-2 border-primary-200 rounded-lg sm:rounded-xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-primary-900 mb-3 sm:mb-4">
                Preview
              </h3>
              <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
                {shippingSettings.freeShippingThreshold === 0 ? (
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 pb-2 border-b border-primary-200">
                      <span className="text-gray-700 font-medium">Product Price:</span>
                      <span className="font-semibold text-gray-900">₹2,500</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 pb-2 border-b border-primary-200">
                      <span className="text-gray-700 font-medium">Shipping:</span>
                      <span className="font-semibold text-green-600">Free</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 pt-2">
                      <span className="text-gray-900 font-bold text-sm sm:text-base">Total Price:</span>
                      <span className="font-bold text-primary-600 text-base sm:text-lg">₹2,500</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Example 1: Order below threshold (with shipping) */}
                    <div className="bg-white rounded-lg p-3 sm:p-4 border border-primary-200">
                      <p className="text-xs text-gray-500 mb-2 font-medium">Example: Order Below Threshold</p>
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                          <span className="text-gray-700">Product Price:</span>
                          <span className="font-semibold text-gray-900">₹{Math.max(1000, Math.floor(shippingSettings.freeShippingThreshold * 0.5)).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                          <span className="text-gray-700">Shipping:</span>
                          <span className="font-semibold text-gray-900">₹{shippingSettings.shippingCost.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 pt-2 border-t border-gray-200">
                          <span className="text-gray-900 font-bold">Total Price:</span>
                          <span className="font-bold text-primary-600 text-base sm:text-lg">₹{(Math.max(1000, Math.floor(shippingSettings.freeShippingThreshold * 0.5)) + shippingSettings.shippingCost).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                    {/* Example 2: Order above threshold (free shipping) */}
                    <div className="bg-white rounded-lg p-3 sm:p-4 border border-primary-200">
                      <p className="text-xs text-gray-500 mb-2 font-medium">Example: Order Above Threshold</p>
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                          <span className="text-gray-700">Product Price:</span>
                          <span className="font-semibold text-gray-900">₹{shippingSettings.freeShippingThreshold.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                          <span className="text-gray-700">Shipping:</span>
                          <span className="font-semibold text-green-600">Free</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 pt-2 border-t border-gray-200">
                          <span className="text-gray-900 font-bold">Total Price:</span>
                          <span className="font-bold text-primary-600 text-base sm:text-lg">₹{shippingSettings.freeShippingThreshold.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                <div className="pt-2 sm:pt-3 border-t border-primary-200">
                  <p className="text-xs text-primary-800 leading-relaxed">
                    {shippingSettings.freeShippingThreshold === 0
                      ? '✅ Free shipping is enabled for all orders. Total price = Product price only.'
                      : `💡 Orders above ₹${shippingSettings.freeShippingThreshold.toLocaleString('en-IN')} get free shipping. Orders below pay ₹${shippingSettings.shippingCost.toLocaleString('en-IN')} shipping. Total price = Product price + Shipping.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSaveShippingSettings}
              disabled={savingShippingSettings}
              className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] text-sm sm:text-base"
            >
              {savingShippingSettings ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FiCheckCircle className="w-5 h-5" />
                  <span>Save Shipping Settings</span>
                </>
              )}
            </button>
          </div>
        </div>

        {loadingProducts ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-gray-600 text-sm sm:text-base">Loading products...</p>
          </div>
        ) : products.length > 0 ? (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {selectedFolder ? `Products in ${selectedFolder}` : `All Products (${products.length})`}
              </h2>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {selectedFolder && (
                  <button
                    onClick={() => setSelectedFolder(null)}
                    className="text-xs sm:text-sm text-gray-600 hover:text-primary-600 font-semibold flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-100 min-h-[36px] sm:min-h-[40px]"
                  >
                    <span>←</span>
                    <span className="hidden sm:inline">Back to All</span>
                    <span className="sm:hidden">Back</span>
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
                      folderPath: p.folderPath,
                    }))
                    setProducts(transformedProducts)
                    setLoadingProducts(false)
                  }}
                  className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-semibold px-2 py-1.5 rounded-lg hover:bg-primary-50 min-h-[36px] sm:min-h-[40px]"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Folder Navigation - Show only when no folder selected */}
            {!selectedFolder ? (
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">Browse by Folder</h3>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {Array.from(new Set(products.map(p => p.folderPath).filter(Boolean))).map((folderPath) => {
                    const folderProducts = products.filter(p => p.folderPath === folderPath)
                    return (
                      <button
                        key={folderPath}
                        onClick={() => setSelectedFolder(folderPath || '')}
                        className="p-3 sm:p-4 md:p-5 bg-white rounded-lg sm:rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left group shadow-sm hover:shadow-md min-h-[80px] sm:min-h-[100px]"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                          <FiFolder className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 group-hover:text-primary-700 flex-shrink-0" />
                          <span className="text-sm sm:text-base font-semibold text-gray-700 group-hover:text-primary-600 truncate">
                            {folderPath?.replace('images/', '') || 'No Folder'}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 font-medium">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {products.filter(p => p.folderPath === selectedFolder).map((product) => (
                <div key={product.id} className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="aspect-[4/3] relative">
                    {product.images[0] ? (
                      <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs sm:text-sm">
                        No image
                      </div>
                    )}
                    <span className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-800 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs">
                      {product.category}{product.subCategory ? ` - ${product.subCategory}` : ''}
                    </span>
                  </div>
                  <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <h3 className="font-semibold text-gray-900 text-base sm:text-lg flex-1 min-w-0 pr-2">{product.title}</h3>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
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
                            setImageColors(product.imageColors && product.imageColors.length > 0 ? [...product.imageColors, '', '', ''].slice(0, MAX_IMAGES) : Array(MAX_IMAGES).fill(''))
                            setOutOfStockImages(product.outOfStockImages || [])
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
                          className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                          title="Edit product"
                        >
                          <FiEdit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                          title="Delete product"
                        >
                          <FiTrash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">{product.description}</p>
                    {product.weight && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <span className="font-semibold">Weight:</span>
                        <span>{product.weight}</span>
                      </div>
                    )}
                    <div className="space-y-2">
                      {product.discount && Number(product.discount) > 0 ? (
                        <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                          <div className="flex items-baseline gap-1 price-text text-gray-400">
                            <span className="currency text-sm sm:text-lg">₹</span>
                            <p className="text-xl sm:text-2xl font-bold line-through">
                              {Math.floor(Number(product.price)).toLocaleString('en-IN')}
                            </p>
                            {Number(product.price) % 1 !== 0 && (
                              <span className="text-sm sm:text-lg line-through">
                                .{Math.round((Number(product.price) % 1) * 100).toString().padStart(2, '0')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-baseline gap-1 price-text text-primary-600">
                            <span className="currency text-base sm:text-xl text-gray-400">₹</span>
                            <p className="text-2xl sm:text-3xl font-bold">
                              {Math.floor(Number(product.price) * (1 - Number(product.discount) / 100)).toLocaleString('en-IN')}
                            </p>
                            {(Number(product.price) * (1 - Number(product.discount) / 100)) % 1 !== 0 && (
                              <span className="text-base sm:text-xl font-semibold">
                                .{Math.round(((Number(product.price) * (1 - Number(product.discount) / 100)) % 1) * 100).toString().padStart(2, '0')}
                              </span>
                            )}
                          </div>
                          <span className="inline-flex flex-col items-center justify-center bg-gradient-to-r from-red-500 via-pink-500 to-primary-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg transform hover:scale-105 transition-transform relative overflow-hidden min-w-[75px] sm:min-w-[90px]">
                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></span>
                            <span className="relative z-10 flex flex-col items-center gap-0.5">
                              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider leading-tight">DISCOUNT</span>
                              <span className="text-[10px] sm:text-xs font-bold">{product.discount}% OFF</span>
                            </span>
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1 price-text text-primary-600">
                          <span className="currency text-base sm:text-xl text-gray-400">₹</span>
                          <p className="text-2xl sm:text-3xl font-bold">
                            {Math.floor(Number(product.price)).toLocaleString('en-IN')}
                          </p>
                          {Number(product.price) % 1 !== 0 && (
                            <span className="text-base sm:text-xl font-semibold">
                              .{Math.round((Number(product.price) % 1) * 100).toString().padStart(2, '0')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <p className="text-gray-600 text-sm sm:text-base">No products yet. Upload your first product above!</p>
          </div>
        )}
      </div>
    </div>
  )
}


