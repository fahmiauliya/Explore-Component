// ============================================================
// ALL CONTENT LIVES HERE. Edit this file to change the site.
//
// How to add a reference (one site):
//   Find the right tab and section below and add a line like:
//     { name: 'Site name', url: 'https://example.com', description: 'One short line.', tags: ['Tag', 'Tag'] },
//   `tags` is optional: 2 or 3 short words shown as chips at the top of the card.
//   Clicking a chip filters the tab by that tag.
//   `added: 'YYYY-MM-DD'` is optional: items added in the last 14 days show a "New" chip.
//   Then run `npm run previews` once so the card image gets captured.
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
// The Bookmarks tab is a tree instead of sections (it works like Chrome bookmarks):
//   Folder:   { type: 'folder', id: 'awards', name: 'Awards', children: [ ...folders and bookmarks... ] }
//   Bookmark: { type: 'bookmark', id: 'awwwards', name: 'Awwwards', url: 'https://…', tags: ['Tag'], thumbnail: '/previews/my.jpg' }
//   Folders nest at any depth. `thumbnail` is optional (same as `image` above); `added` works here too.
//   Ids are used in the URL (#bookmarks/galleries/awards), so keep them short, lowercase and unique inside their folder.
//
// How to add a social link (footer icons):
//   Add to `socials` below. Allowed ids: x | linkedin | instagram | threads | website
// ============================================================

export const tabs = [
  {
    id: 'bookmarks',
    label: 'Bookmarks',
    // A tree like Chrome bookmarks. A folder can hold folders and bookmarks at any depth.
    children: [
      {
        type: 'folder',
        id: 'galleries',
        name: 'Galleries',
        children: [
          {
            type: 'folder',
            id: 'awards',
            name: 'Awards',
            children: [{ type: 'bookmark', id: 'awwwards', name: 'Awwwards', url: 'https://www.awwwards.com', tags: ['Awards', 'Gallery', 'Web design'] }],
          },
          { type: 'bookmark', id: 'siteinspire', name: 'SiteInspire', url: 'https://www.siteinspire.com', tags: ['Gallery', 'Web design', 'Filters'] },
          { type: 'bookmark', id: 'land-book', name: 'Land-book', url: 'https://land-book.com', tags: ['Landing pages', 'Gallery', 'By industry'] },
          { type: 'bookmark', id: 'minimal-gallery', name: 'Minimal Gallery', url: 'https://minimal.gallery', tags: ['Minimal', 'Gallery', 'Web design'] },
          { type: 'bookmark', id: 'godly', name: 'Godly', url: 'https://godly.website', tags: ['Motion', 'Gallery', 'Web design'] },
          { type: 'bookmark', id: 'lapa-ninja', name: 'Lapa Ninja', url: 'https://www.lapa.ninja', tags: ['Landing pages', 'Gallery', 'Free'] },
        ],
      },
      {
        type: 'folder',
        id: 'landing-pages',
        name: 'Landing pages',
        children: [
          { type: 'bookmark', id: 'saaspo', name: 'Saaspo', url: 'https://www.saaspo.com', tags: ['SaaS', 'Landing pages', 'Gallery'] },
          { type: 'bookmark', id: 'landingfolio', name: 'Landingfolio', url: 'https://www.landingfolio.com', tags: ['Landing pages', 'Templates', 'Gallery'] },
          { type: 'bookmark', id: 'saas-landing-page', name: 'SaaS Landing Page', url: 'https://saaslandingpage.com', tags: ['SaaS', 'Landing pages'] },
          { type: 'bookmark', id: 'one-page-love', name: 'One Page Love', url: 'https://onepagelove.com', tags: ['One page', 'Gallery', 'Templates'] },
        ],
      },
      {
        type: 'folder',
        id: 'apps',
        name: 'Apps',
        children: [
          { type: 'bookmark', id: 'mobbin', name: 'Mobbin', url: 'https://mobbin.com', tags: ['Mobile', 'Web', 'User flows'] },
          { type: 'bookmark', id: 'screenlane', name: 'Screenlane', url: 'https://screenlane.com', tags: ['Mobile', 'Screens', 'Search'] },
          { type: 'bookmark', id: 'scrnshts', name: 'Scrnshts', url: 'https://scrnshts.club', tags: ['App Store', 'Screenshots', 'Mobile'] },
        ],
      },
      {
        type: 'folder',
        id: 'portfolios',
        name: 'Portfolios',
        children: [
          { type: 'bookmark', id: 'folios-gallery', name: 'Folios Gallery', url: 'https://folios.gallery', tags: ['Portfolios', 'Directory'] },
          { type: 'bookmark', id: 'wall-of-portfolios', name: 'Wall of Portfolios', url: 'https://www.wallofportfolios.in', tags: ['Portfolios', 'Product', 'Engineering'] },
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
          { name: 'shadcn/ui', url: 'https://ui.shadcn.com', description: 'Copy-paste components on Radix and Tailwind.', tags: ['React', 'Tailwind', 'Radix'] },
          { name: 'Radix UI', url: 'https://www.radix-ui.com', description: 'Unstyled, accessible React primitives.', tags: ['React', 'Accessible', 'Unstyled'] },
          { name: 'Aceternity UI', url: 'https://ui.aceternity.com', description: 'Animated React and Tailwind components.', tags: ['React', 'Tailwind', 'Animated'] },
          { name: 'Magic UI', url: 'https://magicui.design', description: 'Animated components for landing pages.', tags: ['React', 'Animated', 'Landing pages'] },
          { name: 'HeroUI', url: 'https://www.heroui.com', description: 'React UI library built on Tailwind CSS.', tags: ['React', 'Tailwind', 'Library'] },
          { name: 'React Aria', url: 'https://react-spectrum.adobe.com/react-aria', description: 'Accessible component hooks from Adobe.', tags: ['React', 'Accessible', 'Hooks'] },
        ],
      },
      {
        id: 'patterns',
        title: 'Patterns',
        description: 'How components should behave.',
        items: [
          { name: 'UI Playbook', url: 'https://uiplaybook.dev', description: 'Guide to common UI component states.', tags: ['Patterns', 'States', 'Guide'] },
          { name: 'Inclusive Components', url: 'https://inclusive-components.design', description: 'Accessible component patterns, explained.', tags: ['Accessible', 'Patterns', 'Guide'] },
          { name: 'Laws of UX', url: 'https://lawsofux.com', description: 'Psychology principles behind usable UI.', tags: ['Psychology', 'Principles', 'UX'] },
        ],
      },
      {
        id: 'motion',
        title: 'Motion',
        description: 'Animation and micro-interactions.',
        items: [
          { name: 'Motion', url: 'https://motion.dev', description: 'Animation library for React and JavaScript.', tags: ['Animation', 'React', 'JavaScript'] },
          { name: 'UI Labs', url: 'https://www.uilabs.dev', description: 'Animated UI components, deconstructed.', tags: ['Animated', 'Components', 'React'] },
          { name: 'Details', url: 'https://www.details.so', description: 'Micro-interaction analysis of top products.', tags: ['Micro-interactions', 'Analysis', 'Products'] },
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
          { name: 'Radix Primitives', url: 'https://github.com/radix-ui/primitives', description: 'Accessible, unstyled React primitives.', tags: ['React', 'Accessible', 'GitHub'] },
          { name: 'shadcn/ui', url: 'https://github.com/shadcn-ui/ui', description: 'Source for the shadcn/ui components.', tags: ['React', 'Components', 'GitHub'] },
          { name: 'cmdk', url: 'https://github.com/pacocoursey/cmdk', description: 'Fast command menu for React.', tags: ['Command menu', 'React', 'GitHub'] },
          { name: 'Sonner', url: 'https://github.com/emilkowalski/sonner', description: 'Toast component for React.', tags: ['Toast', 'React', 'GitHub'] },
          { name: 'Vaul', url: 'https://github.com/emilkowalski/vaul', description: 'Drawer component for React.', tags: ['Drawer', 'React', 'GitHub'] },
        ],
      },
      {
        id: 'icons',
        title: 'Icons',
        description: 'Free icon sets you can use anywhere.',
        items: [
          { name: 'Lucide', url: 'https://github.com/lucide-icons/lucide', description: 'Clean, consistent open-source icons.', tags: ['Icons', 'SVG', 'Open source'] },
          { name: 'Phosphor', url: 'https://github.com/phosphor-icons', description: 'Flexible icon family in six weights.', tags: ['Icons', 'Six weights', 'Open source'] },
          { name: 'Tabler Icons', url: 'https://github.com/tabler/tabler-icons', description: 'Large set of free MIT-licensed SVG icons.', tags: ['Icons', 'MIT', 'SVG'] },
        ],
      },
      {
        id: 'tools',
        title: 'Tools',
        description: 'Open-source design and drawing tools.',
        items: [
          { name: 'Penpot', url: 'https://github.com/penpot/penpot', description: 'Open-source design and prototyping.', tags: ['Design tool', 'Prototyping', 'Open source'] },
          { name: 'Excalidraw', url: 'https://github.com/excalidraw/excalidraw', description: 'Hand-drawn style whiteboard.', tags: ['Whiteboard', 'Drawing', 'Open source'] },
          { name: 'tldraw', url: 'https://github.com/tldraw/tldraw', description: 'Infinite canvas SDK for React.', tags: ['Canvas', 'SDK', 'React'] },
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
          { name: 'Google Fonts', url: 'https://fonts.google.com', description: 'Free, open-source font library.', tags: ['Fonts', 'Free', 'Open source'] },
          { name: 'Fontshare', url: 'https://www.fontshare.com', description: 'Free quality fonts by Indian Type Foundry.', tags: ['Fonts', 'Free', 'Foundry'] },
          { name: 'Uncut', url: 'https://uncut.wtf', description: 'Curated free and open-source typefaces.', tags: ['Fonts', 'Free', 'Curated'] },
          { name: 'Pangram Pangram', url: 'https://pangrampangram.com', description: 'Independent foundry with free trials.', tags: ['Fonts', 'Foundry', 'Free trials'] },
        ],
      },
      {
        id: 'colors',
        title: 'Colors',
        description: 'Palettes and color tools.',
        items: [
          { name: 'Coolors', url: 'https://coolors.co', description: 'Fast color palette generator.', tags: ['Palettes', 'Generator', 'Colors'] },
          { name: 'Realtime Colors', url: 'https://www.realtimecolors.com', description: 'Preview palettes on a real layout.', tags: ['Palettes', 'Live preview', 'Colors'] },
          { name: 'Radix Colors', url: 'https://www.radix-ui.com/colors', description: 'Accessible color scales for UI.', tags: ['Color scales', 'Accessible', 'Colors'] },
        ],
      },
      {
        id: 'image-style',
        title: 'Image style',
        description: 'Photos and moodboards.',
        items: [
          { name: 'Unsplash', url: 'https://unsplash.com', description: 'Free high-resolution photos.', tags: ['Photos', 'Free', 'Stock'] },
          { name: 'Cosmos', url: 'https://www.cosmos.so', description: 'Visual moodboarding and inspiration.', tags: ['Moodboards', 'Curation', 'Visual'] },
          { name: 'Are.na', url: 'https://www.are.na', description: 'Collaborative visual research boards.', tags: ['Boards', 'Research', 'Collaborative'] },
        ],
      },
      {
        id: 'illustration-style',
        title: 'Illustration style',
        description: 'Illustration libraries and styles.',
        items: [
          { name: 'unDraw', url: 'https://undraw.co', description: 'Open-source illustrations, any color.', tags: ['Illustrations', 'Free', 'SVG'] },
          { name: 'Open Peeps', url: 'https://www.openpeeps.com', description: 'Hand-drawn people illustrations.', tags: ['Illustrations', 'People', 'Hand-drawn'] },
          { name: 'Humaaans', url: 'https://www.humaaans.com', description: 'Mix-and-match people illustrations.', tags: ['Illustrations', 'People', 'Mix and match'] },
          { name: 'Blush', url: 'https://blush.design', description: 'Customizable illustrations by many artists.', tags: ['Illustrations', 'Customizable', 'Artists'] },
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
