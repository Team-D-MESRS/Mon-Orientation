import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bj-green': '#008751',
        'bj-yellow': '#FCD116',
        'bj-red': '#E8112D',
        'bj-ochre': '#C8842A',
        'bj-ochre-fonce': '#8C5A14',
        'bj-blue': '#1B6B93',
        'bj-gray': {
          50: '#161616',
          100: '#1E1E1E',
          200: '#2A2A2A',
          425: '#3A3A3A',
          500: '#585858',
          625: '#7B7B7B',
          750: '#A8A8A8',
          850: '#CECECE',
          900: '#DDDDDD',
          925: '#E5E5E5',
          950: '#EEEEEE',
          975: '#F6F6F6',
          1000: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        serif: ['Spectral', 'Georgia', 'serif'],
      },
      spacing: {
        '1v': '4px',
        '2v': '8px',
        '3v': '12px',
        '4v': '16px',
        '6v': '24px',
        '8v': '32px',
        '12v': '48px',
        '16v': '64px',
      },
      borderRadius: {
        'bj-sm': '4px',
        'bj-md': '8px',
        'bj-lg': '12px',
      },
    },
  },
  plugins: [],
};

export default config;
