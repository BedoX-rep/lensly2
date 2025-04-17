import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from "@/components/ui/card";
import Layout from '@/components/Layout';
import { addProduct, getProducts, createReceipt } from '@/integrations/supabase/queries';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  price: number;
}

const NewReceipt: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<{ productId: string; quantity: number; price: number }[]>([]);
  const [advancePayment, setAdvancePayment] = useState<number>(0);
  const [newProductName, setNewProductName] = useState<string>('');
  const [newProductPrice, setNewProductPrice] = useState<number>(0);
  const [rightEyeSph, setRightEyeSph] = useState<string>('');
  const [rightEyeCyl, setRightEyeCyl] = useState<string>('');
  const [rightEyeAxe, setRightEyeAxe] = useState<string>('');
  const [leftEyeSph, setLeftEyeSph] = useState<string>('');
  const [leftEyeCyl, setLeftEyeCyl] = useState<string>('');
  const [leftEyeAxe, setLeftEyeAxe] = useState<string>('');
  const [addValue, setAddValue] = useState<string>('');
const [selectedClient, setSelectedClient] = useState<string>('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const productData = await getProducts();
    setProducts(productData);
  };

  const handleAddItem = (productId: string, price: number) => {
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.productId === productId);

      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += 1;
        return updatedItems;
      } else {
        return [...prevItems, { productId, quantity: 1, price }];
      }
    });
  };

  const handleIncreaseQuantity = (productId: string) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const handleDecreaseQuantity = (productId: string) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.productId !== productId));
  };

  const handleAdvancePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setAdvancePayment(isNaN(value) ? 0 : value);
  };

  const handleCreateProduct = async () => {
    if (!newProductName || newProductPrice <= 0) {
      toast.error('Product name is required and price must be greater than 0.');
      return;
    }

    const newProduct = await addProduct(newProductName, newProductPrice);
    if (newProduct) {
      setProducts([...products, newProduct]);
      setNewProductName('');
      setNewProductPrice(0);
      toast.success('Product created successfully!');
    } else {
      toast.error('Failed to create product.');
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, item) => {
      const product = products.find(p => p.id === item.productId);
      return acc + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal();
  };

  const calculateBalance = () => {
    return calculateTotal() - advancePayment;
  };

  const handleSubmit = async () => {
    if (!selectedClient) {
      toast.error('Please select a client');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one item to the receipt.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be logged in to create a receipt');
      return;
    }

    const receipt = {
      client_id: selectedClient,
      subtotal: calculateSubtotal(),
      total: calculateTotal(),
      advance_payment: advancePayment,
      balance: calculateBalance(),
      right_eye_sph: rightEyeSph ? parseFloat(rightEyeSph) : null,
      right_eye_cyl: rightEyeCyl ? parseFloat(rightEyeCyl) : null,
      right_eye_axe: rightEyeAxe ? parseFloat(rightEyeAxe) : null,
      left_eye_sph: leftEyeSph ? parseFloat(leftEyeSph) : null,
      left_eye_cyl: leftEyeCyl ? parseFloat(leftEyeCyl) : null,
      left_eye_axe: leftEyeAxe ? parseFloat(leftEyeAxe) : null,
      tax: 0,
      discount_percentage: null,
      discount_amount: null
    };

    // Map items with correct structure
    const itemsData = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        product_id: item.productId,
        quantity: item.quantity,
        price: product ? product.price : item.price, // Use product price if product exists
        custom_item_name: !item.productId ? item.name : null
      };
    });

    console.log('Receipt data:', receipt);
    console.log('Items data:', itemsData);

    const result = await createReceipt(receipt, itemsData);

    if (result) {
      toast.success('Receipt created successfully!');
      navigate('/receipts');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto mt-8">
        <h1 className="text-2xl font-bold mb-4">Create New Receipt</h1>

        <Card className="mb-4">
          <CardContent>
            <h2 className="text-lg font-semibold mb-2">Select Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(product => (
                <div key={product.id} className="border rounded p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-md font-semibold">{product.name}</h3>
                    <p className="text-gray-600">Price: {product.price} DH</p>
                  </div>
                  <Button onClick={() => handleAddItem(product.id, product.price)} variant="outline">Add</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardContent>
            <h2 className="text-lg font-semibold mb-2">Create New Product</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newProductName">Product Name</Label>
                <Input
                  type="text"
                  id="newProductName"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="newProductPrice">Product Price</Label>
                <Input
                  type="number"
                  id="newProductPrice"
                  value={newProductPrice.toString()}
                  onChange={(e) => setNewProductPrice(parseFloat(e.target.value))}
                />
              </div>
            </div>
            <Button className="mt-4" onClick={handleCreateProduct}>Create Product</Button>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardContent>
            <h2 className="text-lg font-semibold mb-2">Prescription Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rightEyeSph">Right Eye SPH</Label>
                <Input
                  type="text"
                  id="rightEyeSph"
                  value={rightEyeSph}
                  onChange={(e) => setRightEyeSph(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="rightEyeCyl">Right Eye CYL</Label>
                <Input
                  type="text"
                  id="rightEyeCyl"
                  value={rightEyeCyl}
                  onChange={(e) => setRightEyeCyl(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="rightEyeAxe">Right Eye AXE</Label>
                <Input
                  type="text"
                  id="rightEyeAxe"
                  value={rightEyeAxe}
                  onChange={(e) => setRightEyeAxe(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="leftEyeSph">Left Eye SPH</Label>
                <Input
                  type="text"
                  id="leftEyeSph"
                  value={leftEyeSph}
                  onChange={(e) => setLeftEyeSph(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="leftEyeCyl">Left Eye CYL</Label>
                <Input
                  type="text"
                  id="leftEyeCyl"
                  value={leftEyeCyl}
                  onChange={(e) => setLeftEyeCyl(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="leftEyeAxe">Left Eye AXE</Label>
                <Input
                  type="text"
                  id="leftEyeAxe"
                  value={leftEyeAxe}
                  onChange={(e) => setLeftEyeAxe(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="addValue">ADD Value</Label>
                <Input
                  type="text"
                  id="addValue"
                  value={addValue}
                  onChange={(e) => setAddValue(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardContent>
            <h2 className="text-lg font-semibold mb-2">Items</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full leading-normal">
                <thead>
                  <tr>
                    <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const product = products.find(p => p.id === item.productId);
                    return (
                      <tr key={item.productId}>
                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                          {product ? product.name : 'Unknown'}
                        </td>
                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                          <div className="flex items-center">
                            <Button onClick={() => handleDecreaseQuantity(item.productId)}>-</Button>
                            <span className="mx-2">{item.quantity}</span>
                            <Button onClick={() => handleIncreaseQuantity(item.productId)}>+</Button>
                          </div>
                        </td>
                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                          {product ? product.price : '0'} DH
                        </td>
                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                          <Button onClick={() => handleRemoveItem(item.productId)} variant="destructive">Remove</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardContent>
            <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
            <div className="mb-4">
              <Label htmlFor="advancePayment">Advance Payment</Label>
              <Input
                type="number"
                id="advancePayment"
                value={advancePayment.toString()}
                onChange={handleAdvancePaymentChange}
              />
            </div>
            <table className="min-w-full mb-4">
              <tbody>
                <tr>
                  <td colSpan={3} className="text-right font-medium">Subtotal:</td>
                  <td className="text-right">{calculateSubtotal().toFixed(2)} DH</td>
                </tr>
                <tr>
                  <td colSpan={3} className="text-right font-medium">Total:</td>
                  <td className="text-right">{calculateTotal().toFixed(2)} DH</td>
                </tr>
                <tr>
                  <td colSpan={3} className="text-right font-medium">Advance Payment:</td>
                  <td className="text-right">{advancePayment} DH</td>
                </tr>
                <tr>
                  <td colSpan={3} className="text-right font-medium">Balance Due:</td>
                  <td className="text-right">{calculateBalance().toFixed(2)} DH</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Button onClick={handleSubmit}>Create Receipt</Button>
      </div>
    </Layout>
  );
};

export default NewReceipt;