/**
 * Example 4: JSON Format
 * 
 * This example demonstrates using JSON instead of YAML.
 * JSON is faster for parsing but less human-readable than YAML.
 */

import { NoSqlFile } from '../src';

interface Product {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
}

async function jsonFormatExample() {
  console.log('=== JSON Format Example ===\n');

  // Create database with JSON format
  const db = new NoSqlFile('./data', { format: 'json' });

  // Create a collection (will use .json extension)
  console.log('Creating products collection (JSON format)...');
  const products = await db.collection<Product>('products');

  // Insert products
  await products.insert({ id: 1, name: 'Laptop', price: 999.99, inStock: true });
  await products.insert({ id: 2, name: 'Mouse', price: 29.99, inStock: true });
  await products.insert({ id: 3, name: 'Keyboard', price: 79.99, inStock: false });

  console.log('Products:', products.getAll());

  // Create a dictionary (will use .json extension)
  console.log('\nCreating store config (JSON format)...');
  const storeConfig = await db.dictionary('store-config');

  await storeConfig.set('storeName', 'Tech Store');
  await storeConfig.set('currency', 'USD');
  await storeConfig.set('taxRate', 0.08);

  console.log('Store Config:', storeConfig.getAll());

  console.log('\nExample completed!');
  console.log('Check:');
  console.log('  - ./data/products.json');
  console.log('  - ./data/store-config.json');
  console.log('\nJSON files are more compact but less human-readable than YAML.');
}

// Run the example
jsonFormatExample().catch(console.error);
