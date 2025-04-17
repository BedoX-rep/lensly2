import { addProduct } from '../integrations/supabase/queries';
import products from '../../attached_assets/products.json';

async function importProducts() {
  console.log('Starting product import...');

  for (const product of products) {
    try {
      await addProduct(product.name, product.price);
      console.log(`Added: ${product.name}`);
    } catch (error) {
      console.error(`Failed to add ${product.name}:`, error);
    }
  }

  console.log('Import completed');
}

importProducts();