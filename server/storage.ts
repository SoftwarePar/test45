import { type User, type InsertUser, type Product, type InsertProduct, type Order, type InsertOrder, type OrderItem, type InsertOrderItem, type OrderWithItems } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  
  // Orders
  getOrders(): Promise<OrderWithItems[]>;
  getOrder(id: string): Promise<OrderWithItems | undefined>;
  getUserOrders(userId: string): Promise<OrderWithItems[]>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private products: Map<string, Product>;
  private orders: Map<string, Order>;
  private orderItems: Map<string, OrderItem>;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.initializeData();
  }

  private initializeData() {
    // Create admin user
    const adminId = randomUUID();
    this.users.set(adminId, {
      id: adminId,
      email: "admin@test.com",
      password: "admin123", // In production, this should be hashed
      name: "María González",
      role: "admin",
      createdAt: new Date(),
    });

    // Initialize products
    const products: InsertProduct[] = [
      {
        name: "Kit Estimulación Cognitiva",
        description: "Conjunto de juegos diseñados para estimular memoria, atención y concentración en niños pequeños.",
        price: "18500",
        imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
        type: "physical",
        ageRange: "3-8",
        category: "Estimulación Cognitiva",
        stock: 12,
        isActive: true,
      },
      {
        name: "Set Terapia Ocupacional",
        description: "Herramientas especializadas para el desarrollo de habilidades motoras finas y coordinación.",
        price: "35800",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
        type: "physical",
        ageRange: "4-12",
        category: "Terapia Ocupacional",
        stock: 8,
        isActive: true,
      },
      {
        name: "Juego Mesa Habilidades Sociales",
        description: "Dinámico juego para desarrollar empatía, comunicación y trabajo en equipo.",
        price: "24300",
        imageUrl: "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
        type: "physical",
        ageRange: "7-15",
        category: "Habilidades Sociales",
        stock: 15,
        isActive: true,
      },
      {
        name: "Actividades Lectoescritura Digital",
        description: "Plataforma interactiva para el aprendizaje de lectura y escritura a través del juego.",
        price: "12900",
        imageUrl: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
        type: "digital",
        ageRange: "5-10",
        category: "Lectoescritura",
        stock: null,
        isActive: true,
      },
      {
        name: "Programa Inteligencia Emocional",
        description: "Curso digital completo para el desarrollo de habilidades emocionales y autoconocimiento.",
        price: "15600",
        imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
        type: "digital",
        ageRange: "6-14",
        category: "Inteligencia Emocional",
        stock: null,
        isActive: true,
      },
      {
        name: "App Matemáticas Adaptativa",
        description: "Aplicación que se adapta al ritmo de aprendizaje para fortalecer habilidades matemáticas.",
        price: "9800",
        imageUrl: "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
        type: "digital",
        ageRange: "8-16",
        category: "Matemáticas",
        stock: null,
        isActive: true,
      },
    ];

    products.forEach(product => {
      const id = randomUUID();
      this.products.set(id, {
        ...product,
        id,
        stock: product.stock ?? null,
        isActive: product.isActive ?? true,
        createdAt: new Date(),
      });
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role || "user",
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.isActive);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const newProduct: Product = {
      ...product,
      id,
      stock: product.stock ?? null,
      isActive: product.isActive ?? true,
      createdAt: new Date(),
    };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const existing = this.products.get(id);
    if (!existing) return undefined;
    
    const updated: Product = { ...existing, ...product };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  async getOrders(): Promise<OrderWithItems[]> {
    const orders = Array.from(this.orders.values());
    return Promise.all(orders.map(order => this.populateOrderItems(order)));
  }

  async getOrder(id: string): Promise<OrderWithItems | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    return this.populateOrderItems(order);
  }

  async getUserOrders(userId: string): Promise<OrderWithItems[]> {
    const orders = Array.from(this.orders.values()).filter(order => order.userId === userId);
    return Promise.all(orders.map(order => this.populateOrderItems(order)));
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems> {
    const orderId = randomUUID();
    const newOrder: Order = {
      ...order,
      id: orderId,
      userId: null,
      status: order.status || "pending",
      createdAt: new Date(),
    };
    this.orders.set(orderId, newOrder);

    // Create order items
    const orderItems: (OrderItem & { product: Product })[] = [];
    for (const item of items) {
      const itemId = randomUUID();
      const orderItem: OrderItem = {
        ...item,
        id: itemId,
        orderId,
      };
      this.orderItems.set(itemId, orderItem);
      
      const product = this.products.get(item.productId);
      if (product) {
        orderItems.push({ ...orderItem, product });
        
        // Update stock for physical products
        if (product.type === "physical" && product.stock !== null) {
          const updatedProduct = { ...product, stock: product.stock - item.quantity };
          this.products.set(product.id, updatedProduct);
        }
      }
    }

    return {
      ...newOrder,
      items: orderItems,
    };
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updated: Order = { ...order, status };
    this.orders.set(id, updated);
    return updated;
  }

  private async populateOrderItems(order: Order): Promise<OrderWithItems> {
    const items = Array.from(this.orderItems.values())
      .filter(item => item.orderId === order.id)
      .map(item => {
        const product = this.products.get(item.productId);
        return product ? { ...item, product } : null;
      })
      .filter(item => item !== null) as (OrderItem & { product: Product })[];
      
    return { ...order, items };
  }
}

export const storage = new MemStorage();
