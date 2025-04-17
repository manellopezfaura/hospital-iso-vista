
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				hospital: {
					bed: {
						// Colors for both dark and light mode
						available: {
							DEFAULT: '#4ade80', // green-400
							light: '#22c55e', // green-500 for light mode
							dark: '#4ade80', // green-400 for dark mode
						},
						occupied: {
							DEFAULT: '#f97316', // orange-500
							light: '#f97316', // orange-500 for light mode
							dark: '#f97316', // orange-500 for dark mode
						},
						cleaning: {
							DEFAULT: '#60a5fa', // blue-400
							light: '#3b82f6', // blue-500 for light mode
							dark: '#60a5fa', // blue-400 for dark mode
						},
					},
					patient: {
						critical: {
							DEFAULT: '#ef4444', // red-500
							light: '#dc2626', // red-600 for light mode
							dark: '#ef4444', // red-500 for dark mode
						},
						stable: {
							DEFAULT: '#22c55e', // green-500
							light: '#15803d', // green-700 for light mode
							dark: '#22c55e', // green-500 for dark mode
						},
						discharged: {
							DEFAULT: '#6b7280', // gray-500
							light: '#4b5563', // gray-600 for light mode
							dark: '#6b7280', // gray-500 for dark mode
						},
					},
					floor: {
						base: {
							DEFAULT: '#d1d5db', // gray-300
							light: '#f3f4f6', // gray-100 for light mode
							dark: '#374151', // gray-700 for dark mode
						},
						grid: {
							DEFAULT: '#9ca3af', // gray-400
							light: '#d1d5db', // gray-300 for light mode
							dark: '#6b7280', // gray-500 for dark mode
						},
						wall: {
							DEFAULT: '#e5e7eb', // gray-200
							light: '#ffffff', // white for light mode
							dark: '#1f2937', // gray-800 for dark mode
						},
					},
					equipment: {
						normal: {
							DEFAULT: '#14b8a6', // teal-500
							light: '#0d9488', // teal-600 for light mode
							dark: '#14b8a6', // teal-500 for dark mode
						},
						inactive: {
							DEFAULT: '#6b7280', // gray-500
							light: '#4b5563', // gray-600 for light mode
							dark: '#6b7280', // gray-500 for dark mode
						},
						warning: {
							DEFAULT: '#eab308', // yellow-500
							light: '#ca8a04', // yellow-600 for light mode
							dark: '#eab308', // yellow-500 for dark mode
						}
					}
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'pulse-soft': {
					'0%, 100%': {
						opacity: '1',
					},
					'50%': {
						opacity: '0.7',
					},
				},
				'float': {
					'0%, 100%': {
						transform: 'translateY(0)',
					},
					'50%': {
						transform: 'translateY(-5px)',
					},
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'scale-in': {
					'0%': {
						transform: 'scale(0.95)',
						opacity: '0'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
				'slide-up': {
					'0%': {
						transform: 'translateY(20px)',
						opacity: '0'
					},
					'100%': {
						transform: 'translateY(0)',
						opacity: '1'
					}
				},
				'slide-down': {
					'0%': {
						transform: 'translateY(-20px)',
						opacity: '0'
					},
					'100%': {
						transform: 'translateY(0)',
						opacity: '1'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
				'float': 'float 3s ease-in-out infinite',
				'fade-in': 'fade-in 0.4s ease-out forwards',
				'scale-in': 'scale-in 0.3s ease-out forwards',
				'slide-up': 'slide-up 0.5s ease-out forwards',
				'slide-down': 'slide-down 0.5s ease-out forwards'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
