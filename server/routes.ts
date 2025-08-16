import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertOrderSchema, insertOrderItemSchema, insertProductSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }
      
      // In production, use proper JWT tokens
      const token = `mock_token_${user.id}`;
      res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, token });
    } catch (error) {
      res.status(400).json({ message: "Datos de login inválidos" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.json({ message: "Sesión cerrada correctamente" });
  });

  app.get("/api/auth/me", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No autorizado" });
    }
    
    const token = authHeader.substring(7);
    const userId = token.replace("mock_token_", "");
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }
    
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  });

  // Products routes
  app.get("/api/products", async (req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.get("/api/products/:id", async (req, res) => {
    const product = await storage.getProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    res.json(product);
  });

  app.post("/api/products", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No autorizado" });
      }
      
      const token = authHeader.substring(7);
      const userId = token.replace("mock_token_", "");
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Acceso denegado" });
      }
      
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: "Datos de producto inválidos" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No autorizado" });
      }
      
      const token = authHeader.substring(7);
      const userId = token.replace("mock_token_", "");
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Acceso denegado" });
      }
      
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, productData);
      
      if (!product) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Datos de producto inválidos" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No autorizado" });
      }
      
      const token = authHeader.substring(7);
      const userId = token.replace("mock_token_", "");
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Acceso denegado" });
      }
      
      const deleted = await storage.deleteProduct(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      
      res.json({ message: "Producto eliminado correctamente" });
    } catch (error) {
      res.status(400).json({ message: "Error al eliminar producto" });
    }
  });

  // Orders routes
  app.get("/api/orders", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No autorizado" });
      }
      
      const token = authHeader.substring(7);
      const userId = token.replace("mock_token_", "");
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "Usuario no encontrado" });
      }
      
      let orders;
      if (user.role === "admin") {
        orders = await storage.getOrders();
      } else {
        orders = await storage.getUserOrders(userId);
      }
      
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener órdenes" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const orderSchema = insertOrderSchema.extend({
        items: z.array(insertOrderItemSchema),
      });
      
      const { items, ...orderData } = orderSchema.parse(req.body);
      const order = await storage.createOrder(orderData, items);
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ message: "Datos de orden inválidos" });
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No autorizado" });
      }
      
      const token = authHeader.substring(7);
      const userId = token.replace("mock_token_", "");
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Acceso denegado" });
      }
      
      const { status } = z.object({ status: z.string() }).parse(req.body);
      const order = await storage.updateOrderStatus(req.params.id, status);
      
      if (!order) {
        return res.status(404).json({ message: "Orden no encontrada" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: "Error al actualizar estado de orden" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
