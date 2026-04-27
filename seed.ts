import mongoose from 'mongoose'

const MONGODB_URI = 'mongodb://localhost:27017/workboard'

const ClientSchema = new mongoose.Schema({ name: String, email: String, company: String, color: String, invoiceStatus: String, totalEarned: Number }, { timestamps: true })
const SubtaskSchema = new mongoose.Schema({ id: String, title: String, done: Boolean })
const TaskSchema = new mongoose.Schema({ title: String, description: String, status: String, priority: String, clientId: mongoose.Schema.Types.ObjectId, dueDate: Date, estimatedHours: Number, actualHours: Number, tags: [String], subtasks: [SubtaskSchema], boardId: String, order: Number }, { timestamps: true })

const Client = mongoose.models.Client || mongoose.model('Client', ClientSchema)
const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema)

const d = (offsetDays: number) => {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date
}

async function seed() {
  await mongoose.connect(MONGODB_URI)
  await Client.deleteMany({})
  await Task.deleteMany({})
  console.log('🗑  Cleared existing data')

  const clients = await Client.insertMany([
    { name: 'Sarah Mitchell', email: 'sarah@brightwave.io', company: 'BrightWave Agency', color: '#8b5cf6', invoiceStatus: 'paid', totalEarned: 5200 },
    { name: 'James Okafor', email: 'james@novalabs.co', company: 'Nova Labs', color: '#6366f1', invoiceStatus: 'sent', totalEarned: 2400 },
    { name: 'Priya Sharma', email: 'priya@shopzen.com', company: 'ShopZen', color: '#10b981', invoiceStatus: 'unpaid', totalEarned: 1200 },
  ])

  const [sarah, james, priya] = clients
  console.log('✅ Clients created')

  await Task.insertMany([
    // ── TODO ──
    {
      title: 'Design checkout flow for ShopZen',
      description: 'Redesign the 3-step checkout: cart review, shipping info, payment. Mobile-first. Client wants it done before Black Friday campaign.',
      status: 'todo', priority: 'urgent', clientId: priya._id,
      dueDate: d(3), estimatedHours: 8, tags: ['design', 'ecommerce', 'mobile'],
      subtasks: [], boardId: 'default', order: 0,
    },
    {
      title: 'Set up staging server on AWS EC2',
      description: 'Provision t3.medium instance, configure nginx, SSL via Certbot, set up PM2 for Node process management.',
      status: 'todo', priority: 'high', clientId: james._id,
      dueDate: d(5), estimatedHours: 4, tags: ['devops', 'aws', 'backend'],
      subtasks: [], boardId: 'default', order: 1,
    },
    {
      title: 'Write API documentation for Nova Labs dashboard',
      description: 'Document all REST endpoints using Swagger/OpenAPI. Include auth flow, request/response examples, and error codes.',
      status: 'todo', priority: 'medium', clientId: james._id,
      dueDate: d(10), estimatedHours: 5, tags: ['docs', 'api'],
      subtasks: [], boardId: 'default', order: 2,
    },
    {
      title: 'Onboarding email sequence — BrightWave',
      description: '5-email drip sequence for new signups. Copy + HTML templates. Integrate with Mailchimp.',
      status: 'todo', priority: 'low', clientId: sarah._id,
      dueDate: d(14), estimatedHours: 6, tags: ['email', 'copywriting'],
      subtasks: [], boardId: 'default', order: 3,
    },

    // ── IN PROGRESS ──
    {
      title: 'Build admin dashboard — Nova Labs',
      description: 'React + Recharts dashboard with user analytics, revenue graphs, and CSV export. Redux for global state. Must match Figma designs exactly.',
      status: 'in-progress', priority: 'high', clientId: james._id,
      dueDate: d(7), estimatedHours: 18, tags: ['react', 'dashboard', 'redux'],
      subtasks: [
        { id: '1', title: 'Set up React project with Redux Toolkit', done: true },
        { id: '2', title: 'Build sidebar navigation', done: true },
        { id: '3', title: 'Integrate Recharts for revenue graph', done: true },
        { id: '4', title: 'Build user analytics table with filters', done: false },
        { id: '5', title: 'Add CSV export functionality', done: false },
        { id: '6', title: 'Connect to live API endpoints', done: false },
      ],
      boardId: 'default', order: 0,
    },
    {
      title: 'Fix mobile nav bug — BrightWave site',
      description: 'Hamburger menu does not close after clicking a link on iOS Safari. Reproducible on iPhone 13 and 14. Possibly z-index or event propagation issue.',
      status: 'in-progress', priority: 'urgent', clientId: sarah._id,
      dueDate: d(1), estimatedHours: 2, tags: ['bug', 'mobile', 'safari'],
      subtasks: [
        { id: '1', title: 'Reproduce bug on iOS Safari simulator', done: true },
        { id: '2', title: 'Identify root cause in nav component', done: false },
        { id: '3', title: 'Apply fix and test on real device', done: false },
      ],
      boardId: 'default', order: 1,
    },
    {
      title: 'Product image optimization — ShopZen',
      description: 'Convert all product images to WebP, implement lazy loading, and add blur placeholders. Target: LCP under 2.5s.',
      status: 'in-progress', priority: 'medium', clientId: priya._id,
      dueDate: d(6), estimatedHours: 5, tags: ['performance', 'images', 'next.js'],
      subtasks: [
        { id: '1', title: 'Audit current image sizes and formats', done: true },
        { id: '2', title: 'Write conversion script for WebP', done: false },
        { id: '3', title: 'Update Next.js Image components', done: false },
      ],
      boardId: 'default', order: 2,
    },

    // ── REVIEW ──
    {
      title: 'Landing page redesign — BrightWave',
      description: 'New hero section with video background, testimonials carousel, and updated CTA buttons. Design approved by client on Oct 12.',
      status: 'review', priority: 'medium', clientId: sarah._id,
      dueDate: d(-1), estimatedHours: 12, actualHours: 14,
      tags: ['design', 'frontend', 'animation'],
      subtasks: [
        { id: '1', title: 'Hero section with video background', done: true },
        { id: '2', title: 'Testimonials carousel', done: true },
        { id: '3', title: 'CTA redesign and A/B variants', done: true },
        { id: '4', title: 'Cross-browser testing', done: true },
      ],
      boardId: 'default', order: 0,
    },
    {
      title: 'Integrate Stripe payments — ShopZen',
      description: 'Full Stripe checkout integration: one-time payments, webhook handling for order confirmation, refund flow.',
      status: 'review', priority: 'high', clientId: priya._id,
      dueDate: d(2), estimatedHours: 10, actualHours: 9,
      tags: ['payments', 'stripe', 'backend'],
      subtasks: [
        { id: '1', title: 'Install and configure Stripe SDK', done: true },
        { id: '2', title: 'Build checkout session API route', done: true },
        { id: '3', title: 'Handle success and cancel redirects', done: true },
        { id: '4', title: 'Set up webhook for order confirmation', done: true },
        { id: '5', title: 'Test with Stripe test cards', done: false },
      ],
      boardId: 'default', order: 1,
    },

    // ── DONE ──
    {
      title: 'Setup MongoDB Atlas + Redis for production',
      description: 'Configured Atlas M10 cluster with VPC peering, Redis Cloud for session caching. Added connection pooling.',
      status: 'done', priority: 'high', clientId: james._id,
      dueDate: d(-10), estimatedHours: 3, actualHours: 3,
      tags: ['devops', 'database', 'redis'],
      subtasks: [
        { id: '1', title: 'Provision MongoDB Atlas cluster', done: true },
        { id: '2', title: 'Configure VPC peering', done: true },
        { id: '3', title: 'Set up Redis Cloud instance', done: true },
        { id: '4', title: 'Update environment variables', done: true },
      ],
      boardId: 'default', order: 0,
    },
    {
      title: 'Brand identity assets — BrightWave',
      description: 'Full brand kit: primary + secondary logo, favicon, color palette (HEX/RGB/CMYK), typography guide. Delivered as Figma file + exported assets.',
      status: 'done', priority: 'medium', clientId: sarah._id,
      dueDate: d(-7), estimatedHours: 8, actualHours: 8,
      tags: ['design', 'branding', 'figma'],
      subtasks: [
        { id: '1', title: 'Logo design (3 concepts)', done: true },
        { id: '2', title: 'Client revisions — round 1', done: true },
        { id: '3', title: 'Color palette and typography guide', done: true },
        { id: '4', title: 'Export all assets', done: true },
      ],
      boardId: 'default', order: 1,
    },
    {
      title: 'Product listing page — ShopZen',
      description: 'Responsive product grid with filters (category, price range, rating), sorting, and pagination. Built with Next.js SSR.',
      status: 'done', priority: 'medium', clientId: priya._id,
      dueDate: d(-5), estimatedHours: 7, actualHours: 6,
      tags: ['frontend', 'ecommerce', 'next.js'],
      subtasks: [
        { id: '1', title: 'Product grid component', done: true },
        { id: '2', title: 'Filter sidebar', done: true },
        { id: '3', title: 'Sort and pagination', done: true },
        { id: '4', title: 'SSR with getServerSideProps', done: true },
      ],
      boardId: 'default', order: 2,
    },
    {
      title: 'Auth system — Nova Labs',
      description: 'JWT-based auth with refresh tokens, role-based access (admin/user/viewer), Google OAuth, and forgot password flow.',
      status: 'done', priority: 'high', clientId: james._id,
      dueDate: d(-12), estimatedHours: 10, actualHours: 11,
      tags: ['auth', 'jwt', 'backend', 'oauth'],
      subtasks: [
        { id: '1', title: 'JWT login + refresh token logic', done: true },
        { id: '2', title: 'Google OAuth integration', done: true },
        { id: '3', title: 'Role-based middleware', done: true },
        { id: '4', title: 'Forgot password email flow', done: true },
        { id: '5', title: 'Rate limiting on auth routes', done: true },
      ],
      boardId: 'default', order: 3,
    },
  ])

  console.log('✅ Tasks created')
  console.log('\n🎉 Seed complete! Open http://localhost:3000')
  await mongoose.disconnect()
}

seed().catch(err => { console.error(err); process.exit(1) })
