# RapidPhotoFlow 🚀

A production-ready Next.js 15 photo processing application built for hackathons. Upload, process, and manage photos with real-time updates, beautiful UI, and seamless Vercel deployment.

## Features

- 📤 **Multi-file Upload**: Drag & drop interface with individual progress bars
- ⚡ **Real-time Processing**: Server-Sent Events (SSE) for live updates
- 🎨 **Beautiful UI**: shadcn/ui components with dark mode support
- 📊 **Processing Queue**: Real-time status tracking with expandable logs
- 🖼️ **Gallery View**: Masonry grid layout with bulk actions
- 🎉 **Confetti Animation**: Celebration when all photos are processed
- 📱 **Mobile Responsive**: Works perfectly on all devices
- 🌙 **Dark Mode**: Toggle between light and dark themes

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **Icons**: Lucide React
- **Storage**: Vercel Blob Storage
- **Database**: Vercel Postgres with Prisma ORM
- **Real-time**: Server-Sent Events (SSE)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Vercel account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd RapidPhotoFlow
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=your_blob_token

# Vercel Postgres Database
# Note: PRISMA_DATABASE_URL is usually the same as POSTGRES_PRISMA_URL
POSTGRES_URL=your_postgres_url
POSTGRES_PRISMA_URL=your_postgres_prisma_url
POSTGRES_URL_NON_POOLING=your_postgres_non_pooling_url
PRISMA_DATABASE_URL=your_postgres_prisma_url
```

**Why multiple .env files?**
- `.env.local` - For local development (gitignored, not committed)
- `.env` - Can be used for default values (optional)
- Vercel automatically uses environment variables set in the dashboard for production
- Next.js loads `.env.local` first, then `.env` (if exists)

**Required Environment Variables:**
- `BLOB_READ_WRITE_TOKEN` - For uploading images to Vercel Blob Storage
- `PRISMA_DATABASE_URL` - For Prisma to connect to your database (required)
- `POSTGRES_URL` - Main database connection (optional, but recommended)
- `POSTGRES_PRISMA_URL` - Prisma-specific connection (usually same as PRISMA_DATABASE_URL)
- `POSTGRES_URL_NON_POOLING` - Direct connection for migrations (optional)

### Getting Vercel Credentials

1. **Vercel Blob Storage**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Navigate to Storage → Create → Blob
   - Copy the `BLOB_READ_WRITE_TOKEN`

2. **Vercel Postgres**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Navigate to Storage → Create → Postgres
   - Copy the connection strings
   - **Important**: Set `PRISMA_DATABASE_URL` to the same value as `POSTGRES_PRISMA_URL`

### Database Setup

After setting up your environment variables, initialize the database:

```bash
# Generate Prisma Client
npm run db:generate

# Push the schema to create tables
npm run db:push
```

**Available Database Commands:**
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema to database (creates/updates tables)
- `npm run db:studio` - Open Prisma Studio (visual database browser)
- `npm run db:reset` - Reset database (⚠️ WARNING: deletes all data!)

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

**Before deploying, make sure to:**
1. Set up environment variables in Vercel Dashboard
2. Run `npm run db:push` after first deployment to create database tables
3. The build script automatically runs `prisma generate` before building
4. The app will automatically configure blob storage and enable serverless functions

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── upload/          # File upload endpoint
│   │   ├── events/          # SSE endpoint for real-time updates
│   │   ├── photos/          # Photo CRUD operations
│   │   ├── gallery/         # Gallery operations (GET, DELETE)
│   │   ├── process/         # Background processing
│   │   └── test-db/         # Database connection test endpoint
│   ├── processing/          # Processing queue page
│   ├── gallery/             # Gallery page
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Upload page
│   └── globals.css          # Global styles
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── nav.tsx              # Navigation component
│   └── theme-provider.tsx   # Dark mode provider
├── lib/
│   ├── db.ts               # Database operations
│   ├── prisma.ts           # Prisma Client setup
│   ├── processing.ts       # Processing simulation logic
│   └── utils.ts            # Utility functions
├── prisma/
│   └── schema.prisma       # Database schema definition
└── hooks/
    └── use-toast.ts        # Toast notifications
```

## How It Works

1. **Upload**: Users drag & drop photos or select files
2. **Storage**: Photos are uploaded to Vercel Blob Storage
3. **Database**: Photo metadata is stored in Vercel Postgres
4. **Processing**: Background jobs simulate processing (8-30s, 5% failure rate)
5. **Real-time**: SSE endpoint pushes updates to clients
6. **Gallery**: Processed photos appear in the gallery with bulk actions

## Features in Detail

### Upload Page (`/`)
- Drag & drop interface
- Multi-file selection
- Individual progress bars
- Auto-redirect to processing page

### Processing Page (`/processing`)
- Real-time queue updates via SSE
- Status badges (Queued/Processing/Done/Failed)
- Circular progress indicators
- Expandable event logs
- Error handling display

### Gallery Page (`/gallery`)
- Masonry grid layout
- Checkbox selection
- Bulk actions (Download/Delete)
- Confetti animation when all done
- Status indicators

## Customization

### Styling
- Modify `tailwind.config.ts` for theme customization
- Update `app/globals.css` for color scheme changes

### Processing Logic
- Edit `lib/processing.ts` to change processing duration, failure rate, or log messages

### Database Schema
- Modify `prisma/schema.prisma` to change the database schema
- Run `npm run db:push` after schema changes
- Modify `lib/db.ts` to add new database operations

## License

MIT License - feel free to use this for your hackathon project!

## Troubleshooting

### Database Connection Issues

**Error: "Can't reach database server"**
- Verify `PRISMA_DATABASE_URL` is set correctly in `.env.local`
- Check that your Vercel Postgres database is active
- Ensure connection strings match exactly (no extra spaces)

**Error: "Table does not exist"**
- Run `npm run db:push` to create the database schema
- Verify the schema was pushed successfully

**Error: "Prisma Client not generated"**
- Run `npm run db:generate` to generate the Prisma Client
- Make sure `prisma` is installed: `npm install prisma --save-dev`

### Blob Storage Issues

**Error: "Failed to upload file"**
- Verify `BLOB_READ_WRITE_TOKEN` is set correctly
- Check that your Blob Store is active in Vercel Dashboard
- Ensure the token has read/write permissions

### Viewing Your Database

**Local Development:**
```bash
npm run db:studio
```
Opens Prisma Studio at `http://localhost:5555`

**Production:**
- Use Prisma Cloud Studio (if connected)
- Or use your database provider's dashboard

## Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ for hackathons

