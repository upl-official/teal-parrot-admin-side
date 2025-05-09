// lib/upload.ts

const API_BASE_URL = "https://backend-project-r734.onrender.com"

// Function to handle file uploads
export const uploadFiles = async (files, additionalData = {}) => {
  const token = localStorage.getItem("adminToken")
  const formData = new FormData()

  // Add all files to the FormData
  if (Array.isArray(files)) {
    files.forEach((file) => {
      formData.append(`images`, file)
    })
  } else if (files instanceof File) {
    formData.append("images", files)
  }

  // Add additional data to the FormData with proper type conversion
  if (additionalData.name !== undefined) formData.append("name", additionalData.name)
  if (additionalData.description !== undefined) formData.append("description", additionalData.description)
  if (additionalData.stock !== undefined) formData.append("stock", Number.parseInt(additionalData.stock, 10).toString())

  // Ensure category, material, and grade are passed as IDs
  if (additionalData.category !== undefined) formData.append("category", additionalData.category)
  if (additionalData.material !== undefined) formData.append("material", additionalData.material)
  if (additionalData.grade !== undefined) formData.append("grade", additionalData.grade)

  if (additionalData.price !== undefined) formData.append("price", Number.parseFloat(additionalData.price).toString())
  if (additionalData.gem !== undefined && additionalData.gem !== "") formData.append("gem", additionalData.gem)
  if (additionalData.coating !== undefined && additionalData.coating !== "")
    formData.append("coating", additionalData.coating)
  if (additionalData.size !== undefined && additionalData.size !== "") formData.append("size", additionalData.size)
  if (additionalData.originalPrice !== undefined)
    formData.append("originalPrice", Number.parseFloat(additionalData.originalPrice).toString())

  console.log("Uploading product with form data:", {
    files: files.length,
    additionalData: {
      name: additionalData.name,
      description: additionalData.description?.substring(0, 50) + "...",
      stock: Number.parseInt(additionalData.stock, 10),
      category: additionalData.category,
      material: additionalData.material,
      grade: additionalData.grade,
      price: Number.parseFloat(additionalData.price),
      gem: additionalData.gem,
      coating: additionalData.coating,
      size: additionalData.size,
      originalPrice: additionalData.originalPrice,
    },
  })

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/product/add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || "File upload failed")
    }

    return await response.json()
  } catch (error) {
    console.error("File upload error:", error)
    throw error
  }
}
