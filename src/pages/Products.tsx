import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { getProducts, addProduct, updateProduct, deleteProduct, updateProductPosition } from "@/integrations/supabase/queries";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface Product {
  id: string;
  name: string;
  price: number;
  position: number;
}

interface ProductFormData {
  name: string;
  price: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({ name: "", price: "" });


  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const data = await getProducts();
    setProducts(data);
    setLoading(false);
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    const items = Array.from(products);
    const [movedItem] = items.splice(sourceIndex, 1);
    items.splice(destinationIndex, 0, movedItem);

    // Optimistically update the UI
    setProducts(items);

    // Update position in database
    const success = await updateProductPosition(movedItem.id, destinationIndex);

    if (!success) {
      // Revert to original order if update fails
      setProducts(products);
      toast.error("Failed to update product position");
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = async () => {
    const price = parseFloat(formData.price);
    if (!formData.name || isNaN(price) || price <= 0) {
      toast.error("Please enter a valid product name and price");
      return;
    }

    const newProduct = await addProduct(formData.name, price);
    if (newProduct) {
      setProducts(prev => [...prev, newProduct]);
      setFormData({ name: "", price: "" });
      setIsAddDialogOpen(false);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (window.confirm(`Are you sure you want to delete ${productName}?`)) {
      const success = await deleteProduct(productId);
      if (success) {
        setProducts(prev => prev.filter(p => p.id !== productId));
      }
    }
  };

  return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Products</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsAddDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>Add a new product to your inventory.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Premium Eyeglasses"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Price (DH)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="120.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddProduct}>Add Product</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4">
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="products">
                {(provided) => (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead style={{ width: 50 }}></TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead style={{ width: 100 }}>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">Loading products...</TableCell>
                        </TableRow>
                      ) : filteredProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">No products found.</TableCell>
                        </TableRow>
                      ) : (
                        filteredProducts.map((product, index) => (
                          <Draggable key={product.id} draggableId={product.id} index={index}>
                            {(provided) => (
                              <TableRow
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                              >
                                <TableCell>
                                  <div {...provided.dragHandleProps}>
                                    <GripVertical className="h-4 w-4" />
                                  </div>
                                </TableCell>
                                <TableCell>{product.name}</TableCell>
                                <TableCell className="text-right">{product.price.toFixed(2)} DH</TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => {/*Add Edit Functionality Here*/}}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id, product.name)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </TableBody>
                  </Table>
                )}
              </Droppable>
            </DragDropContext>
          </CardContent>
        </Card>
      </div>
  );
}