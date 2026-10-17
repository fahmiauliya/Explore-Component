// ============================================================
// ALL CONTENT LIVES HERE. Edit this file to change the site.
//
// How to add a reference (one site):
//   Find the right tab and section below and add a line like:
//     { name: 'Site name', url: 'https://example.com', description: 'One short line.' },
//   Then run `npm run previews` once so the hover image gets captured.
//
// How to add a section:
//   Inside a tab's `sections` list, add:
//     { id: 'my-section', title: 'My section', description: 'One line.', items: [ ... ] },
//   A section pill, number and count appear automatically.
//
// How to use your own preview image instead of the automatic one:
//   Either drop a 16:10 image in public/previews/ with the same file name the
//   script would use (e.g. awwwards-com.webp), or add `image` to the item:
//     { name: 'Awwwards', url: 'https://www.awwwards.com', description: '...', image: '/previews/my-image.jpg' },
//
// How to add a social link (footer icons):
//   Add to `socials` below. Allowed ids: x | linkedin | instagram | threads | website
// ============================================================

export const tabs = [
  {
    id: 'websites',
    label: 'Websites',
    sections: [
      {
        id: 'galleries',
        title: 'Galleries',
        description: 'Web design inspiration, sorted by style.',
        items: [
          { name: 'Awwwards', url: 'https://www.awwwards.com', description: 'Awards for standout web design and development.' },
          { name: 'SiteInspire', url: 'https://www.siteinspire.com', description: 'Showcase of fine web design, filterable by style.' },
          { name: 'Land-book', url: 'https://land-book.com', description: 'Landing pages organized by industry and style.' },
          { name: 'Minimal Gallery', url: 'https://minimal.gallery', description: 'Minimal and restrained website designs.' },
          { name: 'Godly', url: 'https://godly.website', description: 'Hand-picked, motion-rich web design.' },
          { name: 'Lapa Ninja', url: 'https://www.lapa.ninja', description: 'Curated gallery of landing pages.' },
        ],
      },
      {
        id: 'landing-pages',
        title: 'Landing pages',
        description: 'SaaS and product marketing pages.',
        items: [
          { name: 'Saaspo', url: 'https://www.saaspo.com', description: 'Curated SaaS landing page designs.' },
          { name: 'Landingfolio', url: 'https://www.landingfolio.com', description: 'Landing page designs and templates.' },
          { name: 'SaaS Landing Page', url: 'https://saaslandingpage.com', description: 'Showcase of top SaaS landing pages.' },
          { name: 'One Page Love', url: 'https://onepagelove.com', description: 'Single-page website showcase.' },
        ],
      },
      {
        id: 'apps',
        title: 'Apps',
        description: 'Real mobile and web app screens.',
        items: [
          { name: 'Mobbin', url: 'https://mobbin.com', description: 'Real mobile and web app flows.' },
          { name: 'Screenlane', url: 'https://screenlane.com', description: 'Searchable gallery of app screens.' },
          { name: 'Scrnshts', url: 'https://scrnshts.club', description: 'App Store screenshot designs.' },
        ],
      },
      {
        id: 'portfolios',
        title: 'Portfolios',
        description: 'Designer and builder portfolios.',
        items: [
          { name: 'Folios Gallery', url: 'https://folios.gallery', description: 'Directory of designer portfolios.' },
          { name: 'Wall of Portfolios', url: 'https://www.wallofportfolios.in', description: 'Product and design engineering portfolios.' },
        ],
      },
    ],
  },
  {
    id: 'components',
    label: 'Components',
    sections: [
      {
        id: 'libraries',
        title: 'UI libraries',
        description: 'Ready-made components for React.',
        items: [
          { name: 'shadcn/ui', url: 'https://ui.shadcn.com', description: 'Copy-paste components on Radix and Tailwind.' },
          { name: 'Radix UI', url: 'https://www.radix-ui.com', description: 'Unstyled, accessible React primitives.' },
          { name: 'Aceternity UI', url: 'https://ui.aceternity.com', description: 'Animated React and Tailwind components.' },
          { name: 'Magic UI', url: 'https://magicui.design', description: 'Animated components for landing pages.' },
          { name: 'HeroUI', url: 'https://www.heroui.com', description: 'React UI library built on Tailwind CSS.' },
          { name: 'React Aria', url: 'https://react-spectrum.adobe.com/react-aria', description: 'Accessible component hooks from Adobe.' },
        ],
      },
      {
        id: 'patterns',
        title: 'Patterns',
        description: 'How components should behave.',
        items: [
          { name: 'UI Playbook', url: 'https://uiplaybook.dev', description: 'Guide to common UI component states.' },
          { name: 'Inclusive Components', url: 'https://inclusive-components.design', description: 'Accessible component patterns, explained.' },
          { name: 'Laws of UX', url: 'https://lawsofux.com', description: 'Psychology principles behind usable UI.' },
        ],
      },
      {
        id: 'motion',
        title: 'Motion',
        description: 'Animation and micro-interactions.',
        items: [
          { name: 'Motion', url: 'https://motion.dev', description: 'Animation library for React and JavaScript.' },
          { name: 'UI Labs', url: 'https://www.uilabs.dev', description: 'Animated UI components, deconstructed.' },
          { name: 'Details', url: 'https://www.details.so', description: 'Micro-interaction analysis of top products.' },
        ],
      },
    ],
  },
  {
    id: 'open-source',
    label: 'Open Source',
    sections: [
      {
        id: 'ui',
        title: 'UI building blocks',
        description: 'Open-source React components on GitHub.',
        items: [
          { name: 'Radix Primitives', url: 'https://github.com/radix-ui/primitives', description: 'Accessible, unstyled React primitives.' },
          { name: 'shadcn/ui', url: 'https://github.com/shadcn-ui/ui', description: 'Source for the shadcn/ui components.' },
          { name: 'cmdk', url: 'https://github.com/pacocoursey/cmdk', description: 'Fast command menu for React.' },
          { name: 'Sonner', url: 'https://github.com/emilkowalski/sonner', description: 'Toast component for React.' },
          { name: 'Vaul', url: 'https://github.com/emilkowalski/vaul', description: 'Drawer component for React.' },
        ],
      },
      {
        id: 'icons',
        title: 'Icons',
        description: 'Free icon sets you can use anywhere.',
        items: [
          { name: 'Lucide', url: 'https://github.com/lucide-icons/lucide', description: 'Clean, consistent open-source icons.' },
          { name: 'Phosphor', url: 'https://github.com/phosphor-icons', description: 'Flexible icon family in six weights.' },
          { name: 'Tabler Icons', url: 'https://github.com/tabler/tabler-icons', description: 'Large set of free MIT-licensed SVG icons.' },
        ],
      },
      {
        id: 'tools',
        title: 'Tools',
        description: 'Open-source design and drawing tools.',
        items: [
          { name: 'Penpot', url: 'https://github.com/penpot/penpot', description: 'Open-source design and prototyping.' },
          { name: 'Excalidraw', url: 'https://github.com/excalidraw/excalidraw', description: 'Hand-drawn style whiteboard.' },
          { name: 'tldraw', url: 'https://github.com/tldraw/tldraw', description: 'Infinite canvas SDK for React.' },
        ],
      },
    ],
  },
  {
    id: 'visuals',
    label: 'Visuals',
    sections: [
      {
        id: 'fonts',
        title: 'Fonts',
        description: 'Typefaces, free and paid.',
        items: [
          { name: 'Google Fonts', url: 'https://fonts.google.com', description: 'Free, open-source font library.' },
          { name: 'Fontshare', url: 'https://www.fontshare.com', description: 'Free quality fonts by Indian Type Foundry.' },
          { name: 'Uncut', url: 'https://uncut.wtf', description: 'Curated free and open-source typefaces.' },
          { name: 'Pangram Pangram', url: 'https://pangrampangram.com', description: 'Independent foundry with free trials.' },
        ],
      },
      {
        id: 'colors',
        title: 'Colors',
        description: 'Palettes and color tools.',
        items: [
          { name: 'Coolors', url: 'https://coolors.co', description: 'Fast color palette generator.' },
          { name: 'Realtime Colors', url: 'https://www.realtimecolors.com', description: 'Preview palettes on a real layout.' },
          { name: 'Radix Colors', url: 'https://www.radix-ui.com/colors', description: 'Accessible color scales for UI.' },
        ],
      },
      {
        id: 'image-style',
        title: 'Image style',
        description: 'Photos and moodboards.',
        items: [
          { name: 'Unsplash', url: 'https://unsplash.com', description: 'Free high-resolution photos.' },
          { name: 'Cosmos', url: 'https://www.cosmos.so', description: 'Visual moodboarding and inspiration.' },
          { name: 'Are.na', url: 'https://www.are.na', description: 'Collaborative visual research boards.' },
        ],
      },
      {
        id: 'illustration-style',
        title: 'Illustration style',
        description: 'Illustration libraries and styles.',
        items: [
          { name: 'unDraw', url: 'https://undraw.co', description: 'Open-source illustrations, any color.' },
          { name: 'Open Peeps', url: 'https://www.openpeeps.com', description: 'Hand-drawn people illustrations.' },
          { name: 'Humaaans', url: 'https://www.humaaans.com', description: 'Mix-and-match people illustrations.' },
          { name: 'Blush', url: 'https://blush.design', description: 'Customizable illustrations by many artists.' },
        ],
      },
    ],
  },
];

// Footer social icons. Allowed ids: x | linkedin | instagram | threads | website
export const socials = [
  { id: 'x', label: 'X', url: 'https://x.com/fahmiauliyaa' },
  { id: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/fahmiauliya' },
  { id: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/mickwaz' },
  { id: 'threads', label: 'Threads', url: 'https://www.threads.net/@fahmiauliyaa' },
  { id: 'website', label: 'Website', url: 'https://fahmiauliya.com' },
];
