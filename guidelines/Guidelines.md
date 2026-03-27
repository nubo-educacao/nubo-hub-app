# Nubo Hub Design System Guidelines

Use this file to follow the rules and guidelines for the Nubo Hub App (Nubo Conecta).

# General guidelines

*   **Responsive Layouts**: Prioritize Flexbox and Grid over absolute positioning. Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) for a mobile-first approach.
*   **Code Cleanliness**: Refactor as you go. Keep components small, modular, and focused on a single responsibility.
*   **File Structure**: Place reusable UI components in `components/ui` (even if custom) and feature-specific components in their respective folders under `components/` or `app/chat/components/`.
*   **Accessibility**: Ensure all interactive elements have proper `aria-` labels and are keyboard-accessible.

--------------

# Design System Guidelines

## Typography
*   **Primary Font**: We use **Montserrat** (`font-montserrat` or `montserrat.className`) as the primary font for headings, UI controls, and most text elements.
*   **Headings**: Use `font-bold` for titles, with color `#3A424E` or `#38B1E4` (Sky Blue).
*   **Body Text**: Use text colors like `#636E7C` or `#707A7E` for descriptions and secondary text.
*   **Base Font Size**: Standard text is usually `text-[14px]` or `text-[16px]`.

## Colors & Theme
The app uses a **Light Theme** with a focus on White, Neutrals, and Brand Accents.
*   **Backgrounds**: Clean `bg-white`, `bg-gray-100`, or subtle light gradients.
*   **Brand Primary (Sky Blue)**: `#38B1E4` (used for links, primary text highlights, icons).
*   **Brand Dark Blue**: `#024F86` (used for primary solid buttons, e.g., "Inscreva-se").
*   **Accents**: `#FF9900` (Orange), `#9747FF` (Purple), `#25D366` (WhatsApp Green), and `#FF4D4D` (Red) are used for specific tags and icons.
*   **Text colors**: Dark slate (`#3A424E`) for primary text, gray (`#636E7C`) for secondary text.

## Glassmorphism 🪞
We heavily utilize **Glassmorphism** to create a modern, layered, and premium feel. 
*   **Headers & Navigation**: Use `bg-white/30 backdrop-blur-md border-b border-white/20 shadow-lg` for sticky or floating elements (e.g., `Header.tsx`).
*   **Badges & Floating Tags**: Use `bg-white/60 backdrop-blur-md border border-white/30 shadow-sm` for overlay tags on top of images or gradients (e.g., Match Score tags in `PartnerCard.tsx`).
*   **Modals & Overlays**: Use `bg-black/60 backdrop-blur-sm` for the backdrop of modals to focus attention on the content window.

## Animations
*   **CSS / Tailwind Animations**: Use Tailwind's `transition-all duration-300`, `animate-in fade-in zoom-in-95`, and `slide-in-from-top-2` for modals, dropdowns, and hover effects (as seen in `PartnerCard.tsx` and mobile menu in `Header.tsx`).
*   **Micro-animations**: Button hover states (`scale-110`, `active:scale-95`) and group hover transitions.

## Components

### Cards (`PartnerCard`, `OpportunityCard`)
*   Feature high-quality cover images or gradients, rounded corners (`rounded-2xl`), a white background (`bg-white`), and a shadow (`shadow-lg hover:shadow-xl`).
*   Include hover borders (e.g., `hover:border-[#FF9900]`).
*   Use floating badges with Glassmorphism for tags or scores.

### Buttons
*   **Primary Solid**: `bg-[#024F86] hover:bg-[#023F6B]` with `text-white` and `rounded-full`.
*   **Brand Action**: `bg-[#38B1E4] hover:bg-[#38B1E4]/90` with `text-white`.
*   **Outlined/Secondary**: `border border-[#38B1E4] text-[#38B1E4] hover:bg-[#38B1E4]/10`.

### Form Inputs
*   **Validation**: Pass technical error states through `uiFormState` context for the agent (e.g., Cloudinha) to handle empathetically via `passport_workflow.py`.

### Icons
*   **Library**: Use `lucide-react` (e.g., `User`, `MapPin`, `MessageCircle`, `Heart`).
*   **Sizing & Styling**: Usually `size={20}` or `size={16}` with explicit stroke width (`strokeWidth={2}` or `2.5`) and colored dynamically using hex codes.

## Development Patterns
*   **Backend**: Integrate with Supabase using `@supabase/supabase-js`.
*   **State Management**: Use React Context (e.g., `AuthContext`, `ChatContext`). Handle pending actions via context to trigger them post-login (e.g., `setPendingAction`).
*   **Modals via Portal**: For modals that need to cover the entire screen, use React's `createPortal` to render them into `document.body`.
