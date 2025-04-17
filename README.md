
# Lensly - Lens Optic Management System

## Project Overview
Lensly is a web application for optical stores to manage products, clients, and generate prescription receipts with PDF export capability. It uses React for the frontend and Supabase for the backend database, creating a clean, intuitive interface focused on essential features without unnecessary complexity.

**URL**: https://lovable.dev/projects/efbaa934-dcbd-4348-b1bd-adcdb569a5fb

## Database Structure
The application uses the following Supabase tables:

1. **products**
   - id (UUID, primary key)
   - name (text)
   - price (decimal)
   - created_at (timestamp)

2. **clients**
   - id (UUID, primary key)
   - name (text)
   - phone (text)
   - created_at (timestamp)

3. **receipts**
   - id (UUID, primary key)
   - client_id (UUID, foreign key)
   - Prescription data (right_eye_sph, right_eye_cyl, right_eye_axe, etc.)
   - Financial data (subtotal, tax, discount, total, etc.)
   - created_at (timestamp)

4. **receipt_items**
   - id (UUID, primary key)
   - receipt_id (UUID, foreign key)
   - product_id (UUID, foreign key, nullable)
   - custom_item_name (text, nullable)
   - quantity (integer)
   - price (decimal)
   - created_at (timestamp)

## Core Functionality

### Product Management
- ✅ Product listing with add/edit/delete capabilities
- ✅ Form validation for product prices (no negative values)
- ✅ Simple, straightforward product management

### Client Management
- ✅ Add and edit client information
- ✅ Client search functionality by name or phone
- ✅ View client's prescription history

### Receipt Generation
- ✅ Client selection with option to add new clients
- ✅ Prescription fields for both eyes (SPH, CYL, AXE)
- ✅ Product selection with quantity inputs
- ✅ Custom item entry with manual pricing
- ✅ Discount application (percentage or fixed amount)
- ✅ Advance payment recording
- ✅ Automatic calculations of totals and balances

### Receipt History
- ✅ Chronological display of transactions
- ✅ Client filtering
- ✅ Detailed receipt view
- ✅ PDF export functionality

### PDF Generation
- ✅ Professional receipt format
- ✅ Client and prescription details
- ✅ Itemized product list with prices
- ✅ Payment breakdown and balance due

## Technical Implementation
- React frontend with component-based architecture
- Supabase for database, API, and RLS policies
- PDF generation for downloadable receipts
- Mobile-responsive design with Tailwind CSS

## How to Use

### Product Management
Navigate to the Products page to:
- View all products with their prices
- Add new products
- Edit existing product details
- Delete products no longer offered

### Client Management
Navigate to the Clients page to:
- View and search for existing clients
- Add new clients
- Edit client information
- View a client's prescription history

### Creating Receipts
1. Go to the New Receipt page
2. Select an existing client or add a new one
3. Enter prescription details
4. Add products and custom items
5. Apply discounts if needed
6. Record any advance payment
7. Save the receipt
8. Print or download the receipt as PDF

### Viewing Receipt History
Navigate to the Receipts page to:
- See all historical transactions
- Filter receipts by client name
- View receipt details
- Download PDF copies of past receipts

## Development

### Local Development
```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm i

# Start the development server
npm run dev
```

### Deployment
Simply open [Lovable](https://lovable.dev/projects/efbaa934-dcbd-4348-b1bd-adcdb569a5fb) and click on Share -> Publish.

## Implementation Status

The project has successfully implemented all core requirements:
- ✅ Database structure with appropriate relationships
- ✅ Product management interface
- ✅ Client management system
- ✅ Receipt generation with prescription fields
- ✅ Financial calculations
- ✅ PDF generation and export
- ✅ Clean, intuitive user interface
- ✅ Mobile responsiveness

## Future Enhancements
Potential improvements could include:
- User authentication for multi-user environments
- Advanced reporting and analytics
- Inventory tracking
- Integration with appointment scheduling
- Email functionality for sending receipts
