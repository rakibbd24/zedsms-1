// The landing-page FAQ. Shared by the visible section (Faq.tsx) and the FAQPage structured
// data on the home page (src/app/page.tsx), so Google always sees exactly what's on screen.
export const faqs: { q: string; a: string }[] = [
  {
    q: "What's the difference between a private number and a shared number?",
    a: "A private number is yours alone and works with any service. A shared number is tied to one specific service (like WhatsApp or Google) and drawn from a shared pool — it's cheaper, but only receives codes for that one service.",
  },
  {
    q: "What is Zedsms?",
    a: "Zedsms is a virtual phone number app that lets you get a real phone number in the US, UK, Canada, or Australia — without a SIM card. Make and receive calls and SMS from anywhere using the web, app on iOS, Android.",
  },
  {
    q: "Can I use my number for both calls and texts?",
    a: "Private numbers support both SMS and voice. Shared numbers are SMS-only, since they're optimized for one-time verification codes.",
  },
  {
    q: "Which countries are supported?",
    a: "United Kingdom, United States, Canada and Australia today, with US numbers available by state. More countries are added regularly — sign up to see live availability.",
  },
  {
    q: "Does it work when I travel?",
    a: "Yes. Your virtual number works anywhere with an internet connection. There are no roaming fees — just connect via Wi-Fi or mobile data and you're ready to call, text, and receive messages.",
  },
  {
    q: "Will it work for SMS verification on apps and websites?",
    a: "Yes. Zedsms numbers work with most platforms and services for SMS verification. Some financial institutions may have restrictions on virtual numbers.",
  },
];
