# Spraxe - Modern E-Commerce Platform

A modern, production-ready retail e-commerce platform built for the Bangladesh market, with seller product submission capabilities.

## Features

### Core Features
- **Product Catalog** - Browse products with categories, filters, and search
- **Simple Retail** - Individual customer shopping experience
- **User Authentication** - Email/password signup and login (Phone OTP ready for Phase 2)
- **Shopping Cart** - Add products to cart with quantity management
- **User Dashboard** - Order history, profile management, saved addresses
- **Admin Dashboard** - Product management, order tracking, customer management
- **Seller Submission** - Sellers can apply to submit products for admin approval
- **Support Desk** - Submit tickets for inquiries, complaints, and refund requests

### Technical Stack
- **Frontend**: Next.js 13.5, React 18, TailwindCSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Backend**: Supabase (PostgreSQL database)
- **Authentication**: Supabase Auth
- **Hosting**: Vercel (Frontend) / Supabase (Database)

## Database Schema

The platform includes the following tables:
- `profiles` - User profiles with role management (customer/seller/admin)
- `categories` - Product categories with hierarchy support
- `products` - Product catalog with pricing, inventory, and seller tracking
- `seller_applications` - Seller registration requests
- `cart_items` - Shopping cart items
- `orders` - Order management with tracking
- `order_items` - Order line items
- `addresses` - Delivery addresses
- `support_tickets` - Customer support tickets
- `site_settings` - Configurable site settings

All tables have Row Level Security (RLS) enabled for data protection.

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Supabase account (already configured)

### Installation

1. Install dependencies:
```bash
npm install
```

2. The database schema is already applied to your Supabase instance.

3. Create an admin user:
   - Sign up through the website at `/auth/signup`
   - Go to Supabase Dashboard > Table Editor > profiles
   - Find your user and change `role` from 'customer' to 'admin'

### Development

Run the development server:
```bash
npm run dev
```

Visit http://localhost:3000 to see the application.

### Building for Production

Build the application:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## User Roles

### Customer
- Browse products and categories
- Add products to cart
- Place orders
- View order history
- Manage profile and addresses
- Submit support tickets

### Seller
- All customer features
- Apply to become a seller
- Submit products for admin approval
- View own product submissions
- Once approved, can add products directly

### Admin
- All customer and seller features
- Approve/reject seller applications
- Approve/reject product submissions
- Add/edit/delete all products
- Manage categories
- View all orders and update status
- Manage order shipping and tracking
- View and respond to support tickets
- Access admin dashboard at `/admin`

## Key Pages

- **/** - Homepage with featured products and categories
- **/products** - Product catalog with search and filters
- **/products/[slug]** - Individual product details
- **/cart** - Shopping cart
- **/dashboard** - User dashboard
- **/support** - Support desk
- **/admin** - Admin dashboard (admin only)
- **/admin/products/new** - Add new product (admin/approved sellers)

## Adding Sample Data

Sample categories have already been added. To add sample retail products:

1. Log in as admin
2. Go to `/admin/products/new`
3. Fill in the product details (name, price, stock, etc.)
4. Check "Feature this product" to show on homepage
5. Click "Create Product"

## Phase 1 Complete Features

- Simple retail e-commerce platform
- Product catalog with categories
- Shopping cart and basic checkout
- User authentication (email/password)
- Admin product management
- Seller product submission system
- Support ticket system
- Order management

## Phase 2 Planned Features

- **Payment Gateway**: SSLCOMMERZ integration for card, mobile banking, internet banking
- **Phone OTP**: SMS-based authentication with Bangladeshi phone numbers
- **Email Notifications**: Order confirmations, shipping updates, seller approvals
- **Live Chat**: Messenger or WhatsApp Business integration
- **Advanced Search**: Full-text search or Algolia integration
- **Image Upload**: Product image management with CDN
- **Order Tracking**: Real-time order status updates with tracking numbers
- **Invoice Generation**: Downloadable PDF invoices
- **Reviews & Ratings**: Product reviews and ratings system
- **Wishlist**: Save products for later
- **Advanced Analytics**: Sales reports, charts, and insights
- **Seller Dashboard**: Dedicated dashboard for sellers to manage their products
- **Multi-vendor Features**: Commission tracking, seller payouts

## Support

For issues or questions:
- Email: support@spraxe.com
- Phone: +880 1XXXXXXXXX
- Support Desk: Available on website

## Deployment

### Deploy to Vercel
1. Push code to GitHub
2. Import project in Vercel
3. Deploy

The database is already hosted on Supabase and ready to use.

## License

Private - All Rights Reserved
