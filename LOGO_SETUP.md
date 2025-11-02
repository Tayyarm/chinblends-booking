# Adding Your Chinblends Logo

## Quick Guide

### Step 1: Prepare Your Logo
1. Your logo should be a **square** image (e.g., 500x500px)
2. Supported formats: PNG, JPG, SVG
3. Recommended: PNG with transparent background

### Step 2: Add Logo to Project

1. **Save your logo file** as `logo.png` (or `logo.jpg`, `logo.svg`)

2. **Place it in the assets folder**:
   ```
   barber-booking/src/assets/logo.png
   ```

### Step 3: Update Header Component

Open `src/components/Header.jsx` and make these changes:

**Before** (current code with placeholder):
```jsx
import logo from '../assets/logo.png';

<div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
  <span className="text-white font-bold text-xl">CB</span>
</div>
```

**After** (with your logo):
```jsx
import logo from '../assets/logo.png';

// Replace the entire div with:
<img
  src={logo}
  alt="Chinblends Logo"
  className="w-12 h-12 rounded-full object-cover"
/>
```

### Complete Example

Here's the full updated Header component:

```jsx
import logo from '../assets/logo.png';  // Add this line at the top

function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Updated logo section */}
            <img
              src={logo}
              alt="Chinblends Logo"
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chinblends</h1>
              <p className="text-sm text-gray-500">Professional Barbering</p>
            </div>
          </div>
          <a
            href="https://www.instagram.com/chin_blends/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <span className="hidden sm:inline">@chin_blends</span>
          </a>
        </div>
      </div>
    </header>
  );
}

export default Header;
```

### Step 4: Test Locally

```bash
npm run dev
```

Visit `http://localhost:5173` and check if your logo appears!

### Step 5: Deploy

```bash
git add .
git commit -m "Add Chinblends logo"
git push
```

Vercel will automatically redeploy with your new logo!

## Logo Size Options

### Bigger Logo:
```jsx
className="w-16 h-16 rounded-full object-cover"  // 64px x 64px
```

### Smaller Logo:
```jsx
className="w-10 h-10 rounded-full object-cover"  // 40px x 40px
```

### Square Logo (not round):
```jsx
className="w-12 h-12 rounded-lg object-cover"  // Rounded corners
```

### No Rounding:
```jsx
className="w-12 h-12 object-cover"  // Square edges
```

## Troubleshooting

### Logo not showing?
1. Check file path: Make sure logo is in `src/assets/`
2. Check filename: Must match import (case-sensitive!)
3. Clear cache: `Ctrl + Shift + R` (or `Cmd + Shift + R` on Mac)
4. Check browser console for errors

### Logo looks stretched?
- Use `object-cover` class to maintain aspect ratio
- Make sure original image is square

### Logo too small/big?
- Change `w-12 h-12` to `w-16 h-16` (bigger) or `w-8 h-8` (smaller)

## Alternative: Use SVG Logo

If you have an SVG logo, you can use it directly:

```jsx
import logo from '../assets/logo.svg';

<img
  src={logo}
  alt="Chinblends Logo"
  className="w-12 h-12"
/>
```

SVGs scale perfectly at any size!

---

That's it! Your logo is now integrated. 🎉
