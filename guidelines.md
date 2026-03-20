**Add your own guidelines here**
<!--

System Guidelines

Use this file to provide the AI with rules and guidelines you want it to follow.
This template outlines a few examples of things you can add. You can add your own sections and format it to suit your needs

TIP: More context isn't always better. It can confuse the LLM. Try and add the most important rules you need

# General guidelines

* Use Tailwind CSS for all styling, following the utility-first approach.
* Prefer Lucide React for icons, maintaining a stroke width of 2 or 2.5.
* Use Framer Motion for smooth transitions and interactive micro-animations.
* Ensure all interactive elements have hover and active states for better affordance.
* Maintain a mobile-first approach, using responsive utilities for larger screens.
* Use `container mx-auto px-4` for consistent page alignment.

--------------

# Design system guidelines

## Colors & Theme
* **Primary Blue**: `#38B1E4` (Sky Blue) - Use for buttons, primary actions, and highlights.
* **Secondary Blue**: `#024F86` (Deep Blue) - Use for text, headers, and secondary backgrounds.
* **Accent Orange**: `#FF9900` - Use for specific status indicators (like "Nota de Corte") and hover borders on cards.
* **Backgrounds**: Use `bg-neutral-950` for dark themes or white for cards and standard sections.
* **Badges**: 
  * Purple (`#9747FF`) for opportunity types.
  * Green (`#10B981`) for "Vagas Ociosas".

## Typography
* **Primary Font**: Montserrat (`var(--font-montserrat)`). Use for all headers, buttons, and system UI.
* **Secondary Font**: Lora (`var(--font-lora)`). Use for specific serif accents or long-form text if needed.
* **Base Size**: Maintain standard responsive sizes with focus on readability (`text-lg` for section headers, `text-sm` or `text-base` for body).

## Components

### Button
Our buttons are highly rounded and provide clear visual feedback.
* **Primary Button**: Filled with `#38B1E4`, white text, `rounded-full`.
* **Secondary Button**: Outlined with `#38B1E4`, transparent background, `rounded-full`.
* **Link Button**: Text only in `#38B1E4` with `hover:text-[#2da0d1]`.

### Card (Opportunity/Partner)
* **Shape**: Always use `rounded-2xl` for cards.
* **Style**: White background, `shadow-lg`, and thin border.
* **Interaction**: Add a `hover:shadow-xl` and `transition-all`. Use an orange border (`hover:border-[#FF9900]`) to highlight the active/hovered card.
* **Content**: Keep information dense but organized with icons (Lucide) for metadata like location and dates.

### Header & Navigation
* **Style**: Use `backdrop-blur-md` and semi-transparent backgrounds (`bg-white/30` or `bg-white/95`) for a modern "glassmorphism" feel.
* **Height**: Standard header height is `h-20`.
-->
