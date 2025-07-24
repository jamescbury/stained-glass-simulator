// Glass texture definitions shared across the application
export const GLASS_TEXTURES = {
  clear: { 
    name: 'Clear', 
    opacity: 0.1,
    pattern: 'none',
    description: 'Transparent glass with minimal texture'
  },
  cathedral: { 
    name: 'Cathedral', 
    opacity: 0.2,
    pattern: 'subtle',
    description: 'Lightly textured, semi-transparent'
  },
  opalescent: { 
    name: 'Opalescent', 
    opacity: 0.15,
    pattern: 'milky',
    description: 'Milky, semi-opaque with color variations'
  },
  streaky: { 
    name: 'Streaky', 
    opacity: 0.25,
    pattern: 'streaks',
    description: 'Streaks of color variation'
  },
  wispy: { 
    name: 'Wispy', 
    opacity: 0.3,
    pattern: 'wispy',
    description: 'Wispy white streaks through color'
  },
  textured: { 
    name: 'Textured', 
    opacity: 0.05,
    pattern: 'rough',
    description: 'Heavily textured surface'
  },
  other: {
    name: 'Other',
    opacity: 0.2,
    pattern: 'custom',
    description: 'Custom texture type'
  }
};