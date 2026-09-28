import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── NutriAI Vitality Design Tokens ──────────────────────────
        primary:                    '#006c49',
        'on-primary':               '#ffffff',
        'primary-container':        '#10b981',
        'on-primary-container':     '#00422b',
        'inverse-primary':          '#4edea3',
        'primary-fixed':            '#6ffbbe',
        'primary-fixed-dim':        '#4edea3',
        'on-primary-fixed':         '#002113',
        'on-primary-fixed-variant': '#005236',

        secondary:                  '#006591',
        'on-secondary':             '#ffffff',
        'secondary-container':      '#39b8fd',
        'on-secondary-container':   '#004666',
        'secondary-fixed':          '#c9e6ff',
        'secondary-fixed-dim':      '#89ceff',
        'on-secondary-fixed':       '#001e2f',
        'on-secondary-fixed-variant': '#004c6e',

        tertiary:                   '#855300',
        'on-tertiary':              '#ffffff',
        'tertiary-container':       '#e29100',
        'on-tertiary-container':    '#523200',
        'tertiary-fixed':           '#ffddb8',
        'tertiary-fixed-dim':       '#ffb95f',
        'on-tertiary-fixed':        '#2a1700',
        'on-tertiary-fixed-variant': '#653e00',

        error:                      '#ba1a1a',
        'on-error':                 '#ffffff',
        'error-container':          '#ffdad6',
        'on-error-container':       '#93000a',

        surface:                    '#f8f9ff',
        'surface-dim':              '#ccdbf3',
        'surface-bright':           '#f8f9ff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low':    '#eff4ff',
        'surface-container':        '#e6eeff',
        'surface-container-high':   '#dce9ff',
        'surface-container-highest':'#d5e3fc',
        'surface-tint':             '#006c49',
        'surface-variant':          '#d5e3fc',

        'on-surface':               '#0d1c2e',
        'on-surface-variant':       '#3c4a42',
        'inverse-surface':          '#233144',
        'inverse-on-surface':       '#eaf1ff',

        outline:                    '#6c7a71',
        'outline-variant':          '#bbcabf',

        background:                 '#f8f9ff',
        'on-background':            '#0d1c2e',

        // ── Semantic botanical shortcuts ─────────────────────────────
        emerald:        '#10B981',
        'emerald-deep': '#059669',
        forest:         '#064E3B',
        'sky-blue':     '#0EA5E9',
        amber:          '#F59E0B',
        mint:           '#A7F3D0',
        'mint-mist':    '#ECFDF5',
        teal:           '#0D9488',
      },

      borderRadius: {
        sm:      '0.5rem',
        DEFAULT: '1rem',
        md:      '1.5rem',
        lg:      '2rem',
        xl:      '3rem',
        full:    '9999px',
      },

      spacing: {
        'gutter':    '1.5rem',
        'gutter-sm': '1rem',
        'margin':    '2rem',
        'margin-sm': '1rem',
        'space-xs':  '0.25rem',
        'space-sm':  '0.5rem',
        'space-md':  '1rem',
        'space-lg':  '1.5rem',
        'space-xl':  '2.5rem',
      },

      fontFamily: {
        'headline-xl':        ['Literata', 'serif'],
        'headline-xl-mobile': ['Literata', 'serif'],
        'headline-lg':        ['Literata', 'serif'],
        'headline-lg-mobile': ['Literata', 'serif'],
        'headline-md':        ['Literata', 'serif'],
        'headline-sm':        ['Literata', 'serif'],
        'body-lg':            ['Literata', 'serif'],
        'body-md':            ['Literata', 'serif'],
        'body-sm':            ['Literata', 'serif'],
        'label-lg':           ['DM Sans', 'sans-serif'],
        'label-md':           ['DM Sans', 'sans-serif'],
        'label-sm':           ['DM Sans', 'sans-serif'],
        'caption':            ['DM Sans', 'sans-serif'],
        display:              ['Literata', 'serif'],
        sans:                 ['DM Sans', 'sans-serif'],
      },

      fontSize: {
        'headline-xl':        ['40px', { lineHeight: '52px', letterSpacing: '-0.02em',  fontWeight: '600' }],
        'headline-xl-mobile': ['30px', { lineHeight: '40px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'headline-lg':        ['32px', { lineHeight: '42px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'headline-lg-mobile': ['24px', { lineHeight: '34px', letterSpacing: '-0.01em',  fontWeight: '600' }],
        'headline-md':        ['24px', { lineHeight: '34px', letterSpacing: '-0.01em',  fontWeight: '500' }],
        'headline-sm':        ['20px', { lineHeight: '28px',                            fontWeight: '500' }],
        'body-lg':            ['18px', { lineHeight: '30px',                            fontWeight: '400' }],
        'body-md':            ['16px', { lineHeight: '26px',                            fontWeight: '400' }],
        'body-sm':            ['14px', { lineHeight: '22px',                            fontWeight: '400' }],
        'label-lg':           ['16px', { lineHeight: '24px', letterSpacing: '0.01em',   fontWeight: '600' }],
        'label-md':           ['14px', { lineHeight: '20px', letterSpacing: '0.01em',   fontWeight: '500' }],
        'label-sm':           ['12px', { lineHeight: '16px', letterSpacing: '0.04em',   fontWeight: '600' }],
        'caption':            ['11px', { lineHeight: '14px', letterSpacing: '0.02em',   fontWeight: '400' }],
      },

      boxShadow: {
        'glass-1': '0 4px 20px -2px rgba(6, 78, 59, 0.04)',
        'glass-2': '0 12px 32px -4px rgba(6, 78, 59, 0.08), 0 2px 6px -1px rgba(6, 78, 59, 0.03)',
        'glass-3': '0 20px 48px -8px rgba(6, 78, 59, 0.12), 0 4px 12px -2px rgba(16, 185, 129, 0.06)',
        'emerald': '0 6px 16px -2px rgba(16, 185, 129, 0.25)',
      },
    },
  },
  plugins: [],
}

export default config
