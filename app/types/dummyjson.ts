// Types des réponses de l'API DummyJSON (https://dummyjson.com/docs)
// Écrits à partir des réponses réelles de l'API.

export interface Review {
  rating: number
  comment: string
  date: string
  reviewerName: string
  reviewerEmail: string
}

export interface ProductDimensions {
  width: number
  height: number
  depth: number
}

export interface ProductMeta {
  createdAt: string
  updatedAt: string
  barcode: string
  qrCode: string
}

export interface Product {
  id: number
  title: string
  description: string
  category: string
  price: number
  discountPercentage: number
  rating: number
  stock: number
  tags: string[]
  /** Absent sur certains produits (ex. catégorie groceries) */
  brand?: string
  sku: string
  weight: number
  dimensions: ProductDimensions
  warrantyInformation: string
  shippingInformation: string
  availabilityStatus: string
  reviews: Review[]
  returnPolicy: string
  minimumOrderQuantity: number
  meta: ProductMeta
  images: string[]
  thumbnail: string
}

/** Version allégée d'un produit, suffisante pour une carte du catalogue */
export type ProductSummary = Pick<
  Product,
  'id' | 'title' | 'price' | 'discountPercentage' | 'rating' | 'thumbnail' | 'category'
>

/** Réponse paginée des routes /products, /products/search et /products/category/:slug */
export interface ProductsResponse<T = Product> {
  products: T[]
  total: number
  skip: number
  limit: number
}

/** Élément de GET /products/categories */
export interface Category {
  slug: string
  name: string
  url: string
}

export interface User {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  gender: string
  image: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

/** Réponse de POST /auth/login */
export type LoginResponse = User & AuthTokens
