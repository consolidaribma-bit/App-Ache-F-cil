/**
 * Mock Database - Em memória para desenvolvimento sem MongoDB
 * Usa arquivo JSON para persistência
 */

import fs from 'fs';
import path from 'path';

const DATA_FILE = path.resolve(process.cwd(), '.data', 'db.json');

export interface MockCollection {
  [key: string]: any[];
}

class MockDatabase {
  private data: MockCollection = {
    users: [],
    shoppinglists: [],
    menus: [],
    offers: [],
    stores: [],
  };

  constructor() {
    this.loadFromFile();
  }

  private loadFromFile() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(content);
      } else {
        // Criar arquivo inicial
        this.ensureDir();
        this.saveToFile();
      }
    } catch (error) {
      console.warn('Erro ao carregar dados, iniciando com vazio:', error);
      this.ensureDir();
    }
  }

  private ensureDir() {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private saveToFile() {
    try {
      this.ensureDir();
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
    }
  }

  collection(name: string) {
    if (!this.data[name]) {
      this.data[name] = [];
      this.saveToFile();
    }
    return new MockCollection(name, this.data, () => this.saveToFile());
  }

  close() {
    this.saveToFile();
  }
}

class MockCollection {
  constructor(
    private name: string,
    private data: MockCollection,
    private save: () => void
  ) {}

  async insertOne(doc: any) {
    const id = Math.random().toString(36).substr(2, 9);
    const newDoc = { _id: id, ...doc, createdAt: new Date(), updatedAt: new Date() };
    this.data[this.name].push(newDoc);
    this.save();
    return { insertedId: id };
  }

  async insertMany(docs: any[]) {
    const ids = docs.map((doc) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newDoc = { _id: id, ...doc, createdAt: new Date(), updatedAt: new Date() };
      this.data[this.name].push(newDoc);
      return id;
    });
    this.save();
    return { insertedIds: ids };
  }

  async find(filter: any = {}) {
    let results = this.data[this.name];
    for (const [key, value] of Object.entries(filter)) {
      results = results.filter((doc) => doc[key] === value);
    }
    return results;
  }

  async findOne(filter: any) {
    const results = await this.find(filter);
    return results[0] || null;
  }

  async findById(id: string) {
    return this.findOne({ _id: id });
  }

  async updateOne(filter: any, update: any) {
    const index = this.data[this.name].findIndex((doc) => {
      for (const [key, value] of Object.entries(filter)) {
        if (doc[key] !== value) return false;
      }
      return true;
    });
    if (index !== -1) {
      this.data[this.name][index] = {
        ...this.data[this.name][index],
        ...update.$set || update,
        updatedAt: new Date(),
      };
      this.save();
      return { modifiedCount: 1 };
    }
    return { modifiedCount: 0 };
  }

  async deleteOne(filter: any) {
    const index = this.data[this.name].findIndex((doc) => {
      for (const [key, value] of Object.entries(filter)) {
        if (doc[key] !== value) return false;
      }
      return true;
    });
    if (index !== -1) {
      this.data[this.name].splice(index, 1);
      this.save();
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async deleteMany(filter: any) {
    const initialCount = this.data[this.name].length;
    this.data[this.name] = this.data[this.name].filter((doc) => {
      for (const [key, value] of Object.entries(filter)) {
        if (doc[key] === value) return false;
      }
      return true;
    });
    const deletedCount = initialCount - this.data[this.name].length;
    if (deletedCount > 0) {
      this.save();
    }
    return { deletedCount };
  }

  async countDocuments(filter: any = {}) {
    const results = await this.find(filter);
    return results.length;
  }
}

export const mockDB = new MockDatabase();
