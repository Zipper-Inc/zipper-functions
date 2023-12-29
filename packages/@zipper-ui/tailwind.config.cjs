function genHslCollorPallet(var_name) {
  return [50, 100, 200, 300, 400, 500, 600, 800, 900, 950].reduce(
    (acc, curr) => ({
      ...acc,
      [curr]: `hsl(var(--${var_name}-${curr}))`,
    }),
    {},
  );
}

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    '../../packages/@zipper-ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        'primary-purple': genHslCollorPallet('primary-purple'),
        'primary-blue': genHslCollorPallet('primary-blue'),
        'primary-red': genHslCollorPallet('primary-red'),
        'secondary-gray': genHslCollorPallet('secondary-gray'),
        'secondary-blue': genHslCollorPallet('secondary-blue'),
        'secondary-purple': genHslCollorPallet('secondary-purple'),
        'secondary-pink': genHslCollorPallet('secondary-pink'),
        'secondary-green': genHslCollorPallet('secondary-green'),
        'secondary-yellow': genHslCollorPallet('secondary-yellow'),
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        success: 'hsl(var(--success))',
        success: 'hsl(var(---success))',
        error: 'hsl(var(---error))',
        warning: 'hsl(var(---warning))',
        destructive: 'hsl(var(---destructive))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--primary-red-600))',
          foreground: 'hsl(var(--foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      fontFamily: {
        body: ['var(--font-inter)'],
        heading: ['var(--font-plaak)', 'sans-serif'],
        mono: ['Monaco', 'Monaco', 'monospace'],
        plak: ['"Plaak"', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

module.exports = config;
