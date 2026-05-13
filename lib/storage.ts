import { Product } from "./types";

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

// Mock products untuk initial data
const mockProducts: Product[] = [
  {
    id: "eco-001",
    name: "MacBook Air M1 8/256",
    year: 2021,
    price: 9200000,
    description: "MacBook Air M1 pemakaian normal, kondisi masih mulus, charger lengkap, dijual karena upgrade.",
    location: "Jakarta Selatan",
    condition: "like_new",
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80",
    imageUrls: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80"],
    city: "Jakarta Selatan",
    category: "Elektronik",
    subcategory: "Laptop",
    sellerId: "mock-zys",
    sellerName: "Zys",
    sellerAvatar: "",
    sellerPhone: "+6281234567890",
    sellerVerified: true,
    sellerContributionCount: 12,
    sellerStatus: "Eco Seller",
    ecoSaved: 1,
    createdAt: hoursAgo(2),
  },
  {
    id: "eco-002",
    name: "iPhone 12 128GB",
    year: 2020,
    price: 5700000,
    description: "iPhone 12 128GB masih normal dipakai harian, baterai aman, body terawat, dijual karena ganti unit.",
    location: "Bandung",
    condition: "good",
    imageUrl: "https://images.unsplash.com/photo-1603891128711-11b4b03bb138?auto=format&fit=crop&w=900&q=80",
    imageUrls: ["https://images.unsplash.com/photo-1603891128711-11b4b03bb138?auto=format&fit=crop&w=900&q=80"],
    city: "Bandung",
    category: "Elektronik",
    subcategory: "Handphone",
    sellerId: "mock-leo",
    sellerName: "Leo",
    sellerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
    sellerPhone: "+6281234567891",
    sellerVerified: true,
    sellerContributionCount: 8,
    sellerStatus: "Trusted",
    ecoSaved: 1,
    createdAt: hoursAgo(7),
  },
  {
    id: "eco-003",
    name: "Samsung Galaxy S21 256GB",
    year: 2021,
    price: 4800000,
    description: "Samsung Galaxy S21 256GB performa masih lancar, layar jernih, cocok untuk pemakaian produktif.",
    location: "Surabaya",
    city: "Surabaya",
    condition: "good",
    category: "Elektronik",
    subcategory: "Handphone",
    sellerId: "mock-naufal",
    sellerName: "Naufal",
    sellerAvatar: "",
    sellerPhone: "+6281234567892",
    sellerVerified: false,
    sellerContributionCount: 15,
    sellerStatus: "Top Contributor",
    ecoSaved: 1,
    createdAt: daysAgo(1),
  },
  {
    id: "eco-004",
    name: "Sony WF-1000XM4",
    year: 2022,
    price: 1850000,
    description: "Sony WF-1000XM4 kondisi seperti baru, suara jernih, noise cancelling berfungsi normal.",
    location: "Yogyakarta",
    condition: "like_new",
    imageUrl: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=80",
    imageUrls: ["https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=80"],
    city: "Yogyakarta",
    category: "Elektronik",
    subcategory: "Earphone",
    sellerId: "mock-aira",
    sellerName: "Aira",
    sellerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
    sellerPhone: "+6281234567893",
    sellerVerified: true,
    sellerContributionCount: 21,
    sellerStatus: "Eco Hero",
    ecoSaved: 1,
    createdAt: daysAgo(3),
  },
  {
    id: "eco-005",
    name: "ASUS TUF Gaming F15",
    year: 2021,
    price: 8800000,
    description: "ASUS TUF Gaming F15 performa masih kuat untuk kerja dan gaming ringan, ada lecet ringan di bodi.",
    location: "Jakarta Barat",
    city: "Jakarta Barat",
    condition: "minus",
    conditionDetail: "Ada lecet ringan di bodi, performa masih normal.",
    category: "Elektronik",
    subcategory: "Laptop",
    sellerId: "mock-raka",
    sellerName: "Raka",
    sellerAvatar: "",
    sellerPhone: "+6281234567894",
    sellerVerified: false,
    sellerContributionCount: 6,
    ecoSaved: 1,
    createdAt: daysAgo(5),
  },
  {
    id: "eco-006",
    name: "AirPods Pro Gen 2",
    year: 2023,
    price: 2100000,
    description: "AirPods Pro Gen 2 pemakaian singkat, suara normal, case masih bagus, dijual karena jarang dipakai.",
    location: "Medan",
    city: "Medan",
    condition: "like_new",
    category: "Elektronik",
    subcategory: "Earphone",
    sellerId: "mock-dina",
    sellerName: "Dina",
    sellerAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80",
    sellerPhone: "+6281234567895",
    sellerVerified: true,
    sellerContributionCount: 18,
    sellerStatus: "Trusted",
    ecoSaved: 1,
    createdAt: daysAgo(8),
  },
];

// Simple in-memory storage (replace dengan DB nanti)
const products: Product[] = [...mockProducts];

export function getProducts(): Product[] {
  return products;
}

export function addProduct(product: Product): void {
  products.push(product);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getAllProducts(): Product[] {
  return [...products];
}
