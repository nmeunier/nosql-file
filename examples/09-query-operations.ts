/**
 * Example 9: Advanced Query Operations
 * 
 * This example demonstrates various query patterns for finding
 * and filtering documents in a collection.
 */

import { NoSqlFile } from '../src';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  inStock: boolean;
  tags: string[];
  specs?: {
    weight?: number;
    color?: string;
  };
}

async function queryOperationsExample() {
  console.log('=== Query Operations Example ===\n');

  const db = new NoSqlFile('./data');
  const products = await db.collection<Product>('products');

  // Insert sample data
  console.log('Inserting sample products...');
  await products.insert({
    id: 1,
    name: 'Laptop Pro',
    category: 'electronics',
    price: 1299.99,
    inStock: true,
    tags: ['computer', 'portable', 'professional'],
    specs: { weight: 1.5, color: 'silver' }
  });

  await products.insert({
    id: 2,
    name: 'Wireless Mouse',
    category: 'electronics',
    price: 29.99,
    inStock: true,
    tags: ['accessory', 'wireless'],
    specs: { color: 'black' }
  });

  await products.insert({
    id: 3,
    name: 'Office Chair',
    category: 'furniture',
    price: 299.99,
    inStock: false,
    tags: ['furniture', 'ergonomic']
  });

  await products.insert({
    id: 4,
    name: 'USB-C Cable',
    category: 'electronics',
    price: 19.99,
    inStock: true,
    tags: ['accessory', 'cable']
  });

  await products.insert({
    id: 5,
    name: 'Desk Lamp',
    category: 'furniture',
    price: 49.99,
    inStock: true,
    tags: ['furniture', 'lighting']
  });

  console.log(`Inserted ${products.count()} products\n`);

  // Query 1: Find all (no query)
  console.log('1. Find all products:');
  const all = products.find();
  console.log(`   Found ${all.length} products\n`);

  // Query 2: Single property match
  console.log('2. Find by category (electronics):');
  const electronics = products.find({ category: 'electronics' });
  console.log(`   Found ${electronics.length} electronics:`, electronics.map(p => p.name));

  // Query 3: Multiple properties (AND logic)
  console.log('\n3. Find in-stock electronics:');
  const inStockElectronics = products.find({ category: 'electronics', inStock: true });
  console.log(`   Found ${inStockElectronics.length}:`, inStockElectronics.map(p => p.name));

  // Query 4: By number
  console.log('\n4. Find products under $50:');
  const affordable = products.find({}).filter(p => p.price < 50);
  console.log(`   Found ${affordable.length}:`, affordable.map(p => `${p.name} ($${p.price})`));

  // Query 5: By boolean
  console.log('\n5. Find out-of-stock products:');
  const outOfStock = products.find({ inStock: false });
  console.log(`   Found ${outOfStock.length}:`, outOfStock.map(p => p.name));

  // Query 6: Nested object properties
  console.log('\n6. Find products with black color:');
  const blackProducts = products.find({}).filter(p => p.specs?.color === 'black');
  console.log(`   Found ${blackProducts.length}:`, blackProducts.map(p => p.name));

  // Query 7: Array property
  console.log('\n7. Find products tagged as "accessory":');
  const accessories = products.find({}).filter(p => p.tags.includes('accessory'));
  console.log(`   Found ${accessories.length}:`, accessories.map(p => p.name));

  // Query 8: Complex filter
  console.log('\n8. Find premium products (> $100) that are in stock:');
  const premium = products.find({ inStock: true }).filter(p => p.price > 100);
  console.log(`   Found ${premium.length}:`, premium.map(p => `${p.name} ($${p.price})`));

  // Query 9: Sort results (manual)
  console.log('\n9. Products sorted by price (ascending):');
  const sorted = products.find({}).sort((a, b) => a.price - b.price);
  sorted.forEach(p => console.log(`   ${p.name}: $${p.price}`));

  // Query 10: Count by category
  console.log('\n10. Count by category:');
  const categories = new Map<string, number>();
  products.find({}).forEach(p => {
    categories.set(p.category, (categories.get(p.category) || 0) + 1);
  });
  categories.forEach((count, category) => {
    console.log(`   ${category}: ${count}`);
  });

  console.log('\nExample completed!');
}

// Run the example
queryOperationsExample().catch(console.error);
