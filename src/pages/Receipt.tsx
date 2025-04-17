import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, FileText, Eye, Printer } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { getClients, getProducts, addClient, createReceipt } from "@/integrations/supabase/queries";

interface Client {
  id: string;
  name: string;
  phone: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

interface ReceiptItem {
  id: string;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface PrescriptionData {
  rightEyeSph: string;
  rightEyeCyl: string;
  rightEyeAxe: string;
  leftEyeSph: string;
  leftEyeCyl: string;
  leftEyeAxe: string;
  add: string;
}

const Receipt = () => {
  const navigate = useNavigate();
  const [selectedClient, setSelectedClient] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [showNewClientForm, setShowNewClientForm] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productSearchQuery, setProductSearchQuery] = useState(""); 
  const [clientSearchQuery, setClientSearchQuery] = useState(""); 

  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState("");
  const [quantity, setQuantity] = useState("1");

  const [prescription, setPrescription] = useState<PrescriptionData>({
    rightEyeSph: "",
    rightEyeCyl: "",
    rightEyeAxe: "",
    leftEyeSph: "",
    leftEyeCyl: "",
    leftEyeAxe: "",
    add: ""
  });

  const [discountType, setDiscountType] = useState<"percentage" | "amount">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [advancePayment, setAdvancePayment] = useState("");
  const [taxInput, setTaxInput] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [clientsData, productsData] = await Promise.all([
        getClients(),
        getProducts()
      ]);
      setClients(clientsData);
      setFilteredClients(clientsData);
      setProducts(productsData);
      setFilteredProducts(productsData);
      setIsLoading(false);
    };

    loadData();
  }, []);

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateAssuranceTax = () => {
    const subtotal = calculateSubtotal();
    const taxAmount = parseFloat(taxInput) || 0;

    if (taxAmount <= subtotal) {
      return 0;
    }

    return (taxAmount - subtotal) * 0.33;
  };

  const calculateTax = () => {
    return calculateAssuranceTax();
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (!discountValue || isNaN(parseFloat(discountValue))) return 0;

    if (discountType === "percentage") {
      const percentage = parseFloat(discountValue) / 100;
      return subtotal * percentage;
    } else {
      return parseFloat(discountValue);
    }
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - calculateDiscount();
  };

  const calculateBalance = () => {
    const total = calculateTotal();
    const advance = advancePayment ? parseFloat(advancePayment) : 0;
    return total - advance;
  };

  const handlePrescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPrescription(prev => ({ ...prev, [name]: value }));
  };

  const addItem = () => {
    if (selectedProduct) {
      const product = products.find(p => p.id === selectedProduct);
      if (product) {
        const qty = parseInt(quantity) || 1;
        const newItem: ReceiptItem = {
          id: Date.now().toString(),
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: qty,
          total: product.price * qty
        };
        setItems(prev => [...prev, newItem]);
        setSelectedProduct("");
        setQuantity("1");
        return;
      }
    }

    if (customItemName && customItemPrice) {
      const price = parseFloat(customItemPrice);
      const qty = parseInt(quantity) || 1;
      if (!isNaN(price) && price > 0) {
        const newItem: ReceiptItem = {
          id: Date.now().toString(),
          name: customItemName,
          price: price,
          quantity: qty,
          total: price * qty
        };
        setItems(prev => [...prev, newItem]);
        setCustomItemName("");
        setCustomItemPrice("");
        setQuantity("1");
      }
    }
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleClientSelection = (value: string) => {
    if (value === "new") {
      setSelectedClient("");
      setShowNewClientForm(true);
    } else {
      setSelectedClient(value);
      setShowNewClientForm(false);
    }
  };

  const addNewClient = async () => {
    if (!newClientName || !newClientPhone) {
      toast.error("Please enter both name and phone number");
      return;
    }

    const newClient = await addClient(newClientName, newClientPhone);
    if (newClient) {
      setClients(prev => [...prev, newClient]);
      setFilteredClients(prev => [...prev, newClient]); 
      setNewClientName("");
      setNewClientPhone("");
      setShowNewClientForm(false);
      setSelectedClient(newClient.id); 
    }
  };

  const handleSaveReceipt = async () => {
    if (!selectedClient || items.length === 0) {
      toast.error("Please select a client and add items");
      return;
    }

    const receipt = {
      client_id: selectedClient,
      right_eye_sph: prescription.rightEyeSph ? parseFloat(prescription.rightEyeSph) : null,
      right_eye_cyl: prescription.rightEyeCyl ? parseFloat(prescription.rightEyeCyl) : null,
      right_eye_axe: prescription.rightEyeAxe ? parseInt(prescription.rightEyeAxe) : null,
      left_eye_sph: prescription.leftEyeSph ? parseFloat(prescription.leftEyeSph) : null,
      left_eye_cyl: prescription.leftEyeCyl ? parseFloat(prescription.leftEyeCyl) : null,
      left_eye_axe: prescription.leftEyeAxe ? parseInt(prescription.leftEyeAxe) : null,
      add_value: prescription.add ? parseFloat(prescription.add) : null,
      subtotal: calculateSubtotal(),
      tax: calculateTax(),
      discount_percentage: discountType === "percentage" ? (discountValue ? parseFloat(discountValue) : 0) : 0,
      discount_amount: discountType === "amount" ? (discountValue ? parseFloat(discountValue) : 0) : calculateDiscount(),
      total: calculateTotal(),
      advance_payment: advancePayment ? parseFloat(advancePayment) : 0,
      balance: calculateBalance(),
      created_at: new Date().toISOString()
    };

    const receiptItems = items.map(item => ({
      product_id: item.productId || null,
      custom_item_name: !item.productId ? item.name : null,
      quantity: item.quantity,
      price: item.price
    }));

    const result = await createReceipt(receipt, receiptItems);

    if (result) {
      toast.success("Receipt created successfully");
      navigate("/receipts");
    }
  };

  const handlePrintReceipt = () => {
    toast.info("PDF generation will be implemented later");
  };

  const handleProductSelection = (value: string) => {
    setSelectedProduct(value);
  };

  const handleProductSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm)
    );
    setFilteredProducts(filtered);
  };

  const handleClientSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value.toLowerCase();
    setClientSearchQuery(searchTerm);
    const filtered = clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm) ||
      client.phone.toLowerCase().includes(searchTerm)
    );
    setFilteredClients(filtered);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-slide-up pb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Receipt</h1>
          <p className="text-muted-foreground">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="flex flex-col gap-6 animate-slide-up pb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Receipt</h1>
          <p className="text-muted-foreground">
            Create a new prescription receipt
          </p>
        </div>

        <Tabs defaultValue="client" className="w-full">
          <TabsList className="grid w-full md:w-[400px] grid-cols-4">
            <TabsTrigger value="client">Client</TabsTrigger>
            <TabsTrigger value="prescription">Prescription</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="receipts">Receipts</TabsTrigger>
          </TabsList>

          <TabsContent value="client" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showNewClientForm ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Select Client</Label>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowNewClientForm(true)}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add New Client
                        </Button>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Input
                          type="text"
                          placeholder="Search clients..."
                          value={clientSearchQuery}
                          onChange={handleClientSearch}
                        />
                        <Select value={selectedClient} onValueChange={handleClientSelection}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">+ Add New Client</SelectItem>
                            {filteredClients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name} - {client.phone}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newClientName">Client Name</Label>
                      <Input
                        id="newClientName"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newClientPhone">Phone Number</Label>
                      <Input
                        id="newClientPhone"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        placeholder="555-123-4567"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowNewClientForm(false)}>
                        Cancel
                      </Button>
                      <Button onClick={addNewClient}>
                        Add Client
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prescription" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Prescription Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Right Eye</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="rightEyeSph">SPH</Label>
                        <Input
                          id="rightEyeSph"
                          name="rightEyeSph"
                          value={prescription.rightEyeSph}
                          onChange={handlePrescriptionChange}
                          placeholder="-2.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rightEyeCyl">CYL</Label>
                        <Input
                          id="rightEyeCyl"
                          name="rightEyeCyl"
                          value={prescription.rightEyeCyl}
                          onChange={handlePrescriptionChange}
                          placeholder="-0.50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rightEyeAxe">AXE</Label>
                        <Input
                          id="rightEyeAxe"
                          name="rightEyeAxe"
                          value={prescription.rightEyeAxe}
                          onChange={handlePrescriptionChange}
                          placeholder="180"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Left Eye</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="leftEyeSph">SPH</Label>
                        <Input
                          id="leftEyeSph"
                          name="leftEyeSph"
                          value={prescription.leftEyeSph}
                          onChange={handlePrescriptionChange}
                          placeholder="-2.25"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="leftEyeCyl">CYL</Label>
                        <Input
                          id="leftEyeCyl"
                          name="leftEyeCyl"
                          value={prescription.leftEyeCyl}
                          onChange={handlePrescriptionChange}
                          placeholder="-0.75"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="leftEyeAxe">AXE</Label>
                        <Input
                          id="leftEyeAxe"
                          name="leftEyeAxe"
                          value={prescription.leftEyeAxe}
                          onChange={handlePrescriptionChange}
                          placeholder="175"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="add">ADD</Label>
                      <Input
                        id="add"
                        name="add"
                        value={prescription.add}
                        onChange={handlePrescriptionChange}
                        placeholder="+2.50"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="items" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h3 className="font-medium">Product Item</h3>
                    <div className="space-y-2">
                      <Label htmlFor="productSelect">Select Product</Label>
                      <div className="space-y-2">
                        <Input
                          type="text"
                          placeholder="Search products by name..."
                          onChange={handleProductSearch}
                        />
                        <Select value={selectedProduct} onValueChange={handleProductSelection}>
                          <SelectTrigger id="productSelect">
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredProducts.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - {product.price.toFixed(2)} DH
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Custom Item</h3>
                    <div className="space-y-2">
                      <Label htmlFor="customItemName">Item Name</Label>
                      <Input
                        id="customItemName"
                        value={customItemName}
                        onChange={(e) => setCustomItemName(e.target.value)}
                        placeholder="Custom Lens"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customItemPrice">Price (DH)</Label>
                      <Input
                        id="customItemPrice"
                        type="number"
                        value={customItemPrice}
                        onChange={(e) => setCustomItemPrice(e.target.value)}
                        placeholder="75.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                      <Label htmlFor="taxInput">Tax Amount</Label>
                      <Input
                        id="taxInput"
                        type="number"
                        value={taxInput}
                        onChange={(e) => setTaxInput(e.target.value)}
                        placeholder="Enter tax amount"
                      />
                      {calculateAssuranceTax() > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Assurance tax: DH{calculateAssuranceTax().toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      min="1"
                      className="w-full md:w-1/4"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={addItem} className="gap-1">
                    <Plus className="h-4 w-4" /> Add Item
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Receipt Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...items, calculateAssuranceTax() > 0 ? {
                      id: 'assurance-tax',
                      name: 'Assurance Tax',
                      price: calculateAssuranceTax(),
                      quantity: 1,
                      total: calculateAssuranceTax()
                    } : null].filter(Boolean).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">DH{item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">DH{item.total.toFixed(2)}</TableCell>
                        <TableCell>
                          {item.id !== 'assurance-tax' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Discount</h3>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="discountPercentage"
                          name="discountType"
                          checked={discountType === "percentage"}
                          onChange={() => setDiscountType("percentage")}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="discountPercentage">Percentage (%)</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="discountAmount"
                          name="discountType"
                          checked={discountType === "amount"}
                          onChange={() => setDiscountType("amount")}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="discountAmount">Fixed Amount (DH)</Label>
                      </div>
                    </div>
                    <Input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === "percentage" ? "10" : "25.00"}
                      min="0"
                      step={discountType === "percentage" ? "1" : "0.01"}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Advance Payment</h3>
                    <div className="space-y-2">
                      <Label htmlFor="advancePayment">Amount (DH)</Label>
                      <Input
                        id="advancePayment"
                        type="number"
                        value={advancePayment}
                        onChange={(e) => setAdvancePayment(e.target.value)}
                        placeholder="100.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <dl className="divide-y">
                    <div className="flex justify-between py-2">
                      <dt className="text-sm font-medium">Subtotal</dt>
                      <dd className="text-sm font-medium">DH{calculateSubtotal().toFixed(2)}</dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-sm font-medium">Tax</dt>
                      <dd className="text-sm font-medium">DH{calculateTax().toFixed(2)}</dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-sm font-medium">Discount</dt>
                      <dd className="text-sm font-medium">DH{calculateDiscount().toFixed(2)}</dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-sm font-medium">Total</dt>
                      <dd className="text-sm font-medium">DH{calculateTotal().toFixed(2)}</dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-sm font-medium">Advance Payment</dt>
                      <dd className="text-sm font-medium">DH{advancePayment ? parseFloat(advancePayment).toFixed(2) : "0.00"}</dd>
                    </div>
                    <div className="flex justify-between py-2 font-bold">
                      <dt>Balance Due</dt>
                      <dd>{calculateBalance().toFixed(2)} DH</dd>
                    </div>
                  </dl>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={handlePrintReceipt} className="gap-1">
                  <Printer className="h-4 w-4" /> Print
                </Button>
                <Button onClick={handleSaveReceipt} className="gap-1">
                  <FileText className="h-4 w-4" /> Save Receipt
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default Receipt;