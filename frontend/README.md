# CivicTrack Frontend – Premium Production-Grade Next.js App Router Architecture

This is a premium, production-ready Next.js frontend application built with TypeScript, featuring ultra-advanced animations, real AI-assisted UI features, and full PWA + offline support.

## Architecture Overview

The frontend is built using:
- **Next.js 16 App Router** – File-based routing with server/client components
- **TypeScript** – Type safety throughout
- **React 19** – Latest React features
- **Framer Motion** – Premium animations and micro-interactions
- **Tailwind CSS** – Utility-first styling
- **SWR** – Client-side data fetching with caching
- **React Hook Form + Zod** – Form validation
- **Context API** – Global state management
- **PWA (next-pwa)** – Progressive Web App with offline support
- **Real AI Integration** – Gemini API for smart form assistance

---

## 📁 Route Map

### Public Routes (No Authentication Required)

- `/` – Landing page
- `/feed` – Public issue feed
- `/map` – Interactive map view
- `/report` – Report a new issue
- `/login` – User login
- `/signup` – User registration
- `/issues/[id]` – View issue details (public)

### Protected Routes (Authentication Required)

- `/dashboard` – User's personal dashboard
- `/officer` – Officer view (role-based)
- `/admin` – Admin panel (role-based)

### Error Pages

- `/not-found` – 404 page (automatic)
- `/error` – Global error boundary

---

## 🏗️ Layout & Component Hierarchy

### Root Layout (`app/layout.tsx`)

The root layout wraps the entire application with:
- **Providers** – SWR, Auth, Theme, Sidebar contexts
- **AppLayout** – Header, Sidebar, Main content area
- **Font loading** – Geist Sans & Mono

### App Layout (`components/AppLayout.tsx`)

- **Header** – Navigation, auth state, theme toggle, sidebar toggle
- **Sidebar** – Collapsible navigation menu (responsive)
- **Main Content** – Page content area with consistent spacing

### Component Architecture

```
components/
├── ui/                    # Reusable UI primitives
│   ├── Button.tsx        # Button with variants (primary, secondary, outline, ghost, danger)
│   ├── Card.tsx          # Card container (CardHeader, CardTitle, CardContent, CardFooter)
│   ├── Input.tsx         # Form input with label and error handling
│   ├── Badge.tsx         # Badge component with variants
│   └── Loader.tsx        # Loading spinner with sizes
├── forms/                # Form components
│   └── FormInput.tsx     # Input integrated with React Hook Form
├── Header.tsx            # Main header component
├── Sidebar.tsx           # Sidebar navigation
├── AppLayout.tsx         # Layout wrapper
└── ProtectedRoute.tsx    # Route protection wrapper
```

**Design Principles:**
- **Composable** – Components can be combined flexibly
- **Variant-driven** – Styling via props, not duplicated CSS
- **Accessible** – ARIA labels, keyboard navigation, semantic HTML
- **Mobile-first** – Responsive by default
- **Type-safe** – Full TypeScript support

---

## 🔄 State Management Architecture

### Global State (Context API)

#### 1. **AuthContext** (`contexts/AuthContext.tsx`)
- **State**: `user`, `isAuthenticated`, `isLoading`
- **Actions**: `login(token, userData)`, `logout()`
- **Persistence**: localStorage (token + user data)
- **Usage**: `const { user, isAuthenticated, login, logout } = useAuth()`

#### 2. **ThemeContext** (`contexts/ThemeContext.tsx`)
- **State**: `theme` ("light" | "dark" | "system"), `resolvedTheme`
- **Actions**: `setTheme(theme)`
- **Persistence**: localStorage
- **Usage**: `const { theme, resolvedTheme, setTheme } = useTheme()`

#### 3. **SidebarContext** (`contexts/SidebarContext.tsx`)
- **State**: `isOpen`
- **Actions**: `toggle()`, `open()`, `close()`
- **Persistence**: localStorage
- **Usage**: `const { isOpen, toggle } = useSidebar()`

**Why Context API?**
- Lightweight for app-level state
- No external dependencies
- Built into React
- Optimized with minimal re-renders (contexts split by concern)

### Local State

- Component-specific state uses `useState`
- Form state uses React Hook Form (managed internally)
- Data fetching state uses SWR (managed internally)

---

## 📡 Data Fetching Strategy (SWR)

### SWR Configuration (`lib/swr.ts`)

- **Automatic revalidation** on focus and reconnect
- **Caching** – Responses cached by URL
- **Error retry** – 3 retries on failure
- **Auth headers** – Automatically includes JWT token

### Usage Example

```typescript
import { useSWRFetch } from "@/lib/swr";

function IssuesList() {
  const { data, error, isLoading, mutate } = useSWRFetch<{ issues: Issue[] }>("/api/issues");

  if (isLoading) return <Loader />;
  if (error) return <div>Error loading issues</div>;

  return (
    <div>
      {data?.issues.map(issue => <IssueCard key={issue.id} issue={issue} />)}
      <button onClick={() => mutate()}>Refresh</button>
    </div>
  );
}
```

**Benefits:**
- **Caching** – Reduces unnecessary API calls
- **Revalidation** – Keeps data fresh automatically
- **Optimistic updates** – Use `mutate()` for instant UI updates
- **Error handling** – Built-in error states

---

## 📝 Form Validation Approach

### React Hook Form + Zod

All forms use:
- **React Hook Form** – Form state management
- **Zod** – Schema validation
- **@hookform/resolvers** – Integration layer

### Example: Login Form

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register("email")} error={errors.email?.message} />
      <Input {...register("password")} error={errors.password?.message} />
      <Button type="submit">Login</Button>
    </form>
  );
}
```

**Benefits:**
- **Schema-driven** – Single source of truth for validation
- **Type-safe** – TypeScript types inferred from schema
- **Accessible** – Error messages linked to inputs via ARIA
- **Performance** – Uncontrolled inputs, minimal re-renders

---

## 🛡️ Route Protection & RBAC

### ProtectedRoute Component

```typescript
import ProtectedRoute from "@/components/ProtectedRoute";

export default function DashboardPage() {
  return (
    <ProtectedRoute requireRole="admin">
      <div>Admin content</div>
    </ProtectedRoute>
  );
}
```

**Features:**
- Checks authentication status
- Optional role-based access (`requireRole`)
- Redirects to `/login` if not authenticated
- Shows loading state during auth check

### Permission-Based UI Rendering

The application uses a comprehensive RBAC system for conditional UI rendering:

**Using Permission Hooks:**
```typescript
import { useHasPermission } from "@/hooks/usePermissions";

function MyComponent() {
  const canUpdate = useHasPermission("update");
  
  return (
    <>
      {canUpdate && <button>Update Issue</button>}
    </>
  );
}
```

**Using PermissionGate Component:**
```typescript
import PermissionGate from "@/components/rbac/PermissionGate";

function MyComponent() {
  return (
    <PermissionGate permission="create">
      <button>Assign Issue</button>
    </PermissionGate>
  );
}
```

**Role & Permission Model:**
- **citizen**: `create`, `read` - Can report issues and view them
- **officer**: `read`, `update` - Can view and update issue progress
- **admin**: `create`, `read`, `update`, `delete` - Full access

**Note:** Frontend permission checks are for UI only. Backend always enforces permissions on API routes.

---

## 🔒 HTTPS & Secure Headers

The frontend enforces HTTPS and applies security headers for production.

### 1. HTTPS Enforcement

- **Production only**: HTTP requests redirect (308) to HTTPS.
- **Proxy-aware**: Uses `X-Forwarded-Proto` (Vercel, nginx, etc.).
- **Localhost exempt**: No redirect in development.

### 2. HSTS

- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- Production only; not applied on localhost.

### 3. Content Security Policy (CSP)

- **Production**: `default-src 'self'`, `script-src 'self' 'unsafe-inline'`, `frame-ancestors 'none'`, `object-src 'none'`.
- **Development**: Allows `unsafe-eval` and `ws:` for HMR and dev tools.
- `connect-src` includes `NEXT_PUBLIC_API_URL` if set.

### 4. Additional Headers

- **X-Content-Type-Options**: nosniff  
- **X-Frame-Options**: DENY  
- **Referrer-Policy**: strict-origin-when-cross-origin  
- **Permissions-Policy**: Restricts camera, microphone, geolocation, etc.

### Security vs Flexibility

- Production: strict CSP, no `unsafe-eval`, HSTS enabled.
- Development: Relaxed CSP for hot reload and dev tools.
- `script-src 'unsafe-inline'`: Required for Next.js hydration; CSP nonces can remove this in future.

### Verification

1. **Production build**: `npm run build && npm start`
2. **Headers**: `curl -I https://your-domain.com` — expect HSTS, CSP, X-Frame-Options.
3. **HTTPS redirect**: `curl -I http://your-domain.com` — expect `308` to HTTPS.

---

## ♿ Accessibility & Performance

### Accessibility

- **Semantic HTML** – Proper heading hierarchy, landmarks
- **ARIA labels** – All interactive elements labeled
- **Keyboard navigation** – Full keyboard support
- **Focus management** – Visible focus indicators
- **Color contrast** – WCAG AA compliant
- **Screen reader support** – Descriptive text and roles

### Performance

- **Code splitting** – Automatic via Next.js App Router
- **Image optimization** – Next.js Image component
- **Font optimization** – Next.js font loading
- **Minimal client JS** – Server components where possible
- **Skeleton loaders** – Better perceived performance
- **SWR caching** – Reduces API calls

---

## 🎨 Styling System

### Tailwind CSS

- **Utility-first** – Composable classes
- **CSS Variables** – Theme-aware colors (`var(--primary)`, etc.)
- **Responsive** – Mobile-first breakpoints
- **Dark mode** – System preference + manual toggle

### Design Tokens

Colors, spacing, and typography are defined via CSS variables in `globals.css`:
- `--primary`, `--secondary`, `--accent`
- `--foreground`, `--background`, `--muted-foreground`
- `--border`, `--card`, `--card-foreground`

---

## 🚀 Why This Architecture Scales

1. **Modular Components** – Reusable UI primitives reduce duplication
2. **Type Safety** – TypeScript catches errors at build time
3. **Centralized State** – Context API keeps state logic organized
4. **Efficient Data Fetching** – SWR caching reduces server load
5. **Form Validation** – Schema-driven validation is maintainable
6. **Route Protection** – Reusable component, not scattered logic
7. **Accessibility** – Built-in from the start, not retrofitted
8. **Performance** – Optimized by default (code splitting, caching)

---

## 📚 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set environment variables** (`.env.local`):
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
   JWT_SECRET=your-secret-key
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open** [http://localhost:3000](http://localhost:3000)

---

## 🧪 Testing the Architecture

### Test Authentication Flow

1. Visit `/signup` → Create account
2. Visit `/login` → Login with credentials
3. Check localStorage → Token and user data stored
4. Visit `/dashboard` → Should load (protected route)
5. Click "Logout" → Should redirect to home

### Test Data Fetching

1. Visit `/feed` → Issues load via SWR
2. Switch tabs → Data revalidates on focus
3. Check Network tab → Cached requests not duplicated

### Test Forms

1. Visit `/login` → Submit invalid email → See validation error
2. Submit valid form → Should proceed
3. Check console → No uncontrolled input warnings

---

---

## 🎬 Animation Philosophy & Rules

### Premium Animations with Framer Motion

The app uses **Framer Motion** for all animations, following a strict philosophy:

**Core Principles:**
1. **Animations communicate state** – Not decorative, but informative
2. **Respect motion preferences** – Automatically reduces/removes animations for users with `prefers-reduced-motion`
3. **Zero animation jank** – All animations use GPU-accelerated properties
4. **Intentional timing** – Custom easing curves for premium feel
5. **No layout shift** – Animations don't cause CLS issues

### Animation Components

- **PageTransition** – Smooth route-level transitions
- **AnimatedButton** – Micro-interactions on hover, tap, and loading states
- **AnimatedCard** – Depth and focus animations
- **SkeletonLoader** – Animated loading placeholders

### Usage Example

```typescript
import AnimatedButton from "@/components/animations/AnimatedButton";

<AnimatedButton
  variant="primary"
  isLoading={isSubmitting}
  onClick={handleSubmit}
>
  Submit Issue
</AnimatedButton>
```

**Animation Utilities** (`lib/animations.ts`):
- `safeVariants` – Motion-safe animation variants
- `pageTransition` – Page transition configuration
- `microTransitions` – Button, card, form transitions
- `prefersReducedMotion()` – Checks user motion preferences

---

## 🤖 AI-Assisted UX Features

### Real AI Integration (No Fake Logic)

The app uses **Google Gemini API** for real, production-grade AI assistance:

#### 1. **Smart Form Assistance** (`components/ai/AiFormAssistant.tsx`)

**Features:**
- **Auto-suggest category** – Analyzes user input text to suggest issue category
- **Department suggestions** – Recommends relevant department based on context
- **Confidence indicators** – Shows AI confidence level (0-100%)
- **Explainable AI** – Users understand why suggestions appeared

**How it works:**
- Debounced text analysis (500ms)
- Calls `/api/ai/nlp` endpoint
- Gracefully degrades if AI unavailable
- No hardcoded keyword matching

**Usage:**
```typescript
import AiFormAssistant from "@/components/ai/AiFormAssistant";

<AiFormAssistant
  text={description}
  locationName={location}
  onCategorySuggest={(category, confidence) => {
    setSuggestedCategory(category);
  }}
  onDepartmentSuggest={(dept, confidence) => {
    setSuggestedDepartment(dept);
  }}
/>
```

#### 2. **Input Quality Indicators** (`components/ai/InputQualityIndicator.tsx`)

**Features:**
- Real-time input quality hints
- Missing information detection
- Clarity suggestions
- Visual feedback with color coding

**AI Design Principles:**
- **Assists, never overrides** – User always has final control
- **Transparent** – Shows confidence and reasoning
- **Graceful degradation** – Works without AI
- **Explainable** – Users understand AI behavior

---

## 📱 PWA + Offline-First Experience

### Progressive Web App Features

The app is a fully installable PWA with comprehensive offline support:

#### Installation
- **Desktop** – Install via browser prompt or menu
- **Mobile** – Add to home screen
- **Manifest** – Configured with icons, theme colors, shortcuts

#### Offline Support

**Strategy:**
- **Network-first** for API calls (fresh data when online)
- **Cache-first** for static assets (images, fonts)
- **Stale-while-revalidate** for previously visited pages
- **Background sync** for queued actions

**Components:**
- **OfflineBanner** – Shows connection status
- **OfflineGuard** – Wraps components that need network
- **Service Worker** – Handles caching and offline logic

**Cache Configuration** (`next.config.ts`):
```typescript
runtimeCaching: [
  {
    urlPattern: /^https?.*/,
    handler: "NetworkFirst", // Try network, fallback to cache
    options: {
      cacheName: "offlineCache",
      expiration: { maxEntries: 200, maxAgeSeconds: 86400 },
      networkTimeoutSeconds: 10,
    },
  },
  {
    urlPattern: /\/api\/issues/,
    handler: "NetworkFirst", // API calls always try network first
    options: {
      cacheName: "apiCache",
      expiration: { maxEntries: 50, maxAgeSeconds: 300 },
    },
  },
]
```

**Offline Features:**
- ✅ Previously visited pages available offline
- ✅ Cached API responses (read-only)
- ✅ Static assets cached
- ✅ Graceful offline UI
- ✅ Background sync for queued actions

---

## ⚡ Performance Considerations

### Optimization Strategies

1. **Code Splitting** – Automatic via Next.js App Router
2. **Tree Shaking** – Unused code eliminated
3. **Image Optimization** – Next.js Image component
4. **Font Optimization** – Next.js font loading
5. **SWR Caching** – Reduces API calls
6. **Service Worker Caching** – Offline-first strategy
7. **Animation Performance** – GPU-accelerated transforms only
8. **Minimal Client JS** – Server components where possible

### Performance Metrics

- **Lighthouse PWA** – Ready (installable, offline support)
- **Lighthouse Performance** – Optimized (code splitting, caching)
- **No CLS** – Layout shift prevented
- **No Animation Jank** – 60fps animations
- **Fast TTI** – Time to Interactive optimized

---

## ♿ Accessibility Safeguards

### Motion & Animation Accessibility

- **`prefers-reduced-motion`** – Automatically respected
- **Keyboard navigation** – All animations keyboard-accessible
- **Screen reader support** – AI hints announced properly
- **Focus management** – Visible focus indicators
- **ARIA labels** – All interactive elements labeled

### AI Accessibility

- **Screen reader announcements** – AI suggestions announced
- **Confidence indicators** – Accessible via aria-label
- **Explainable AI** – Text explanations for all suggestions
- **User control** – AI never overrides user input

### PWA Accessibility

- **Offline indicators** – Clear status announcements
- **Keyboard shortcuts** – PWA shortcuts accessible
- **Focus management** – Proper focus handling offline

---

## 🚀 Why These Features Improve User Trust

### Premium Animations
- **Feels polished** – Professional, intentional interactions
- **Reduces cognitive load** – Visual feedback guides users
- **Builds confidence** – Smooth animations signal quality

### AI Assistance
- **Saves time** – Auto-suggestions reduce typing
- **Improves accuracy** – Better category/department selection
- **Transparent** – Confidence indicators build trust
- **User control** – AI assists, never forces

### Offline Support
- **Reliability** – Works even with poor connectivity
- **Faster perceived performance** – Cached content loads instantly
- **Better UX** – No "no internet" dead ends
- **Trust** – App works when users need it

---

## 📖 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [SWR Documentation](https://swr.vercel.app)
- [React Hook Form](https://react-hook-form.com)
- [Zod Documentation](https://zod.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [PWA Best Practices](https://web.dev/pwa/)
- [Google Gemini API](https://ai.google.dev/)
