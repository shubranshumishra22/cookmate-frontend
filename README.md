# CookMate Frontend

A modern Next.js application for connecting users with skilled cooks and reliable house cleaners in their neighborhood.

## 🚀 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (recommended)

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/shubranshumishra22/cookmate-frontend.git
cd cookmate-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Add your Supabase credentials to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push to main

### Environment Variables for Production

```
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
```

## 🎨 Features

- 🍳 **Cook Services**: Find and hire skilled cooks
- 🧹 **Cleaning Services**: Connect with reliable house cleaners
- 🔐 **Authentication**: Secure user registration and login
- 📱 **Responsive Design**: Works on all devices
- 🌍 **Multi-language**: Built-in translation support
- 🎯 **Role-based**: Separate interfaces for service providers and seekers

## 🔗 Backend Repository

The backend API is hosted separately: [CookMate Backend](https://github.com/shubranshumishra22/cookmate-backend)

## 📄 License

This project is licensed under the MIT License.
