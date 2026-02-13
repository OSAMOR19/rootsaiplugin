# Auth System - Usage Guide

## Overview
Beautiful authentication UI pages and modal system for prompting users after free usage.

## Created Files

### Auth Pages
- `/app/auth/login/page.tsx` - Login page with email/password
- `/app/auth/signup/page.tsx` - Signup page with validation
- `/app/auth/forgot-password/page.tsx` - Password reset page

### Components
- `/components/AuthPromptModal.tsx` - Modal to prompt signup after 2nd free use

## How to Use the Auth Prompt Modal

### Step 1: Track Usage in Local Storage

Add this to your results page or wherever users use AI features:

```typescript
// At the top of your component
const [showAuthModal, setShowAuthModal] = useState(false)

// When user performs an AI action (e.g., search, upload audio)
useEffect(() => {
  const trackUsage = () => {
    const usageCount = parseInt(localStorage.getItem('ai_usage_count') || '0')
    const newCount = usageCount + 1
    localStorage.setItem('ai_usage_count', newCount.toString())
    
    // Show modal on 2nd use
    if (newCount === 2) {
      setShowAuthModal(true)
    }
  }
  
  trackUsage()
}, [/* when AI action happens */])
```

### Step 2: Add the Modal to Your Page

```typescript
import AuthPromptModal from '@/components/AuthPromptModal'

export default function YourPage() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  
  return (
    <div>
      {/* Your page content */}
      
      {/* Auth Prompt Modal */}
      <AuthPromptModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        usageCount={2}
      />
    </div>
  )
}
```

### Step 3: Check if User is Logged In (Later with Supabase)

```typescript
// When you implement Supabase auth, add this:
import { supabase } from '@/lib/supabase'

const [user, setUser] = useState(null)

useEffect(() => {
  // Check current session
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user ?? null)
  })
  
  // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null)
  })
  
  return () => subscription.unsubscribe()
}, [])

// Only track/show modal if user is NOT logged in
if (!user) {
  // ...track usage and show modal
}
```

## Features

### Login Page (`/auth/login`)
- Email & password inputs
- Show/hide password toggle
- "Forgot password?" link
- Link to signup page
- Animated background
- Dark mode support

### Signup Page (`/auth/signup`)
- Full name, email, password inputs
- Password confirmation
- Client-side validation
- Link to login page
- Beautiful gradient design

### Forgot Password Page (`/auth/forgot-password`)
- Email input for reset
- Success state with confirmation
- Back to login link

### Auth Prompt Modal
- Shows benefits of signing up
- "Create Free Account" button
- "Already Have an Account" button
- "Maybe later" skip option
- Animated entrance
- Beautiful gradient icon

## Design Features
✅ Matches existing ROOTS design system
✅ Green gradient buttons
✅ Animated backgrounds (rotating orbs)
✅ Dark mode support
✅ Framer Motion animations
✅ Responsive design
✅ Glass morphism effects

## Next Steps (Implementation)
1. Integrate Supabase Auth in the pages (replace TODO comments)
2. Add usage tracking to your AI features
3. Add the AuthPromptModal to results page
4. (Optional) Add social login buttons (Google, etc.)

## Route Structure
```
/auth/login          → Login page
/auth/signup         → Signup page
/auth/forgot-password → Password reset page
```

The Login button on the home page now correctly routes to `/auth/login`.
