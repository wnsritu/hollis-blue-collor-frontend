export const providers = [
  {
    id: "1",
    name: "Maria's Laundry Care",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face",
    rating: 4.8,
    distance: "2.3 miles",
    startingPrice: 3.99,
    services: ["Wash", "Fold", "Iron"],
    languages: ["English", "Spanish"],
    location: "Downtown, Miami",
    description: "With over 10 years of experience in professional laundry services, Maria's Laundry Care provides top-quality washing, folding, and ironing. We treat every garment as if it were our own, using eco-friendly detergents and careful handling for delicate fabrics.",
    availability: ["Morning", "Afternoon"],
  },
  {
    id: "2",
    name: "Fresh & Clean Co.",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    rating: 4.6,
    distance: "4.1 miles",
    startingPrice: 4.49,
    services: ["Wash", "Fold", "Iron", "Hang"],
    languages: ["English", "French"],
    location: "Midtown, Miami",
    description: "Fresh & Clean Co. specializes in premium laundry services with same-day turnaround. Our team of professionals ensures your clothes come back looking brand new every time.",
    availability: ["Morning", "Afternoon", "Evening"],
  },
  {
    id: "3",
    name: "Sparkle Wash Hub",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    rating: 4.9,
    distance: "1.8 miles",
    startingPrice: 5.99,
    services: ["Wash", "Iron", "Hang"],
    languages: ["English", "Portuguese"],
    location: "Brickell, Miami",
    description: "Sparkle Wash Hub brings premium care to your everyday laundry. We use state-of-the-art equipment and premium detergents to deliver spotless results every time.",
    availability: ["Afternoon", "Evening"],
  },
  {
    id: "4",
    name: "Quick Press Laundry",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    rating: 4.4,
    distance: "6.2 miles",
    startingPrice: 2.99,
    services: ["Wash", "Fold"],
    languages: ["English", "Haitian Creole"],
    location: "Little Haiti, Miami",
    description: "Quick Press Laundry offers affordable, reliable laundry services with fast turnaround times. Perfect for busy professionals who need their clothes done right.",
    availability: ["Morning", "Evening"],
  },
  {
    id: "5",
    name: "Elite Garment Care",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    rating: 4.7,
    distance: "3.5 miles",
    startingPrice: 6.99,
    services: ["Wash", "Fold", "Iron", "Hang"],
    languages: ["English", "Spanish", "Russian"],
    location: "Coral Gables, Miami",
    description: "Elite Garment Care provides luxury laundry services for discerning clients. From delicate silks to everyday cotton, we handle every fabric with expertise and care.",
    availability: ["Morning", "Afternoon", "Evening"],
  },
  {
    id: "6",
    name: "Sunshine Cleaners",
    photo: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&h=200&fit=crop&crop=face",
    rating: 4.5,
    distance: "8.0 miles",
    startingPrice: 3.49,
    services: ["Wash", "Fold", "Iron"],
    languages: ["English", "Swahili"],
    location: "North Miami",
    description: "Sunshine Cleaners brings warmth and care to every load. Family-owned and operated, we pride ourselves on consistent quality and friendly service.",
    availability: ["Morning", "Afternoon"],
  },
];

export const pricingData = [
  { item: "Shirt", wash: 3.99, fold: 1.99, iron: 2.99, hang: 1.49 },
  { item: "Pants", wash: 4.99, fold: 2.49, iron: 3.49, hang: 1.99 },
  { item: "Dress", wash: 6.99, fold: 3.49, iron: 4.99, hang: 2.49 },
  { item: "Bedsheet", wash: 7.99, fold: 3.99, iron: 5.99, hang: 2.99 },
];

export const mockOrders = [
  { id: "ORD-001", provider: "Maria's Laundry Care", customer: "Alex Johnson", customerPhone: "+1 (305) 555-0123", customerAddress: "123 Main St, Miami", date: "2026-03-08", serviceDate: "2026-03-10", timeSlot: "10–2 PM", status: "Delivering", amount: 24.97, items: [{ item: "Shirt", service: "Wash", quantity: 3, price: 11.97 }, { item: "Pants", service: "Iron", quantity: 2, price: 6.98 }, { item: "Dress", service: "Fold", quantity: 1, price: 3.49 }] },
  { id: "ORD-002", provider: "Fresh & Clean Co.", customer: "Alex Johnson", customerPhone: "+1 (305) 555-0123", customerAddress: "123 Main St, Miami", date: "2026-03-05", serviceDate: "2026-03-06", timeSlot: "6–10 AM", status: "Finished", amount: 18.47, items: [{ item: "Bedsheet", service: "Wash", quantity: 2, price: 15.98 }, { item: "Shirt", service: "Fold", quantity: 1, price: 1.99 }] },
  { id: "ORD-003", provider: "Sparkle Wash Hub", customer: "Alex Johnson", customerPhone: "+1 (305) 555-0123", customerAddress: "123 Main St, Miami", date: "2026-02-28", serviceDate: "2026-03-01", timeSlot: "2–6 PM", status: "Finished", amount: 32.94, items: [{ item: "Dress", service: "Iron", quantity: 4, price: 19.96 }, { item: "Pants", service: "Wash", quantity: 2, price: 9.98 }] },
  { id: "ORD-004", provider: "Quick Press Laundry", customer: "Alex Johnson", customerPhone: "+1 (305) 555-0123", customerAddress: "123 Main St, Miami", date: "2026-02-20", serviceDate: "2026-02-21", timeSlot: "6–10 PM", status: "Finished", amount: 11.97, items: [{ item: "Shirt", service: "Wash", quantity: 3, price: 11.97 }] },
];

export const mockProviderOrders = [
  { id: "ORD-101", customer: "Alex Johnson", customerPhone: "+1 (305) 555-0123", customerAddress: "123 Main St, Miami", serviceDate: "2026-03-10", timeSlot: "10–2 PM", status: "In Process", amount: 24.97, items: [{ item: "Shirt", service: "Wash", quantity: 3, price: 11.97 }, { item: "Pants", service: "Iron", quantity: 2, price: 6.98 }] },
  { id: "ORD-102", customer: "Sarah Williams", customerPhone: "+1 (305) 555-0456", customerAddress: "456 Oak Ave, Miami", serviceDate: "2026-03-11", timeSlot: "6–10 AM", status: "Received", amount: 15.98, items: [{ item: "Bedsheet", service: "Wash", quantity: 2, price: 15.98 }] },
  { id: "ORD-103", customer: "Mike Chen", customerPhone: "+1 (305) 555-0789", customerAddress: "789 Pine St, Miami", serviceDate: "2026-03-09", timeSlot: "2–6 PM", status: "Finished", amount: 32.94, items: [{ item: "Dress", service: "Iron", quantity: 4, price: 19.96 }, { item: "Pants", service: "Wash", quantity: 2, price: 9.98 }] },
  { id: "ORD-104", customer: "Emma Davis", customerPhone: "+1 (305) 555-0321", customerAddress: "321 Elm Blvd, Miami", serviceDate: "2026-03-08", timeSlot: "6–10 PM", status: "Ready", amount: 11.97, items: [{ item: "Shirt", service: "Wash", quantity: 3, price: 11.97 }] },
  { id: "ORD-105", customer: "James Wilson", customerPhone: "+1 (305) 555-0654", customerAddress: "654 Maple Dr, Miami", serviceDate: "2026-03-07", timeSlot: "10–2 PM", status: "Finished", amount: 22.45, items: [{ item: "Pants", service: "Fold", quantity: 3, price: 7.47 }, { item: "Shirt", service: "Iron", quantity: 5, price: 14.95 }] },
];

export const mockTransactions = [
  { date: "2026-03-10", order: "ORD-101", amount: 24.97, status: "Pending" },
  { date: "2026-03-09", order: "ORD-103", amount: 32.94, status: "Paid" },
  { date: "2026-03-08", order: "ORD-104", amount: 11.97, status: "Paid" },
  { date: "2026-03-07", order: "ORD-105", amount: 22.45, status: "Paid" },
  { date: "2026-03-05", order: "ORD-106", amount: 18.50, status: "Paid" },
];

export const mockMessages = [
  {
    id: "1",
    provider: "Maria's Laundry Care",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face",
    lastMessage: "Your order is ready for delivery!",
    time: "10:30 AM",
    unread: true,
    messages: [
      { id: "m1", sender: "provider", text: "Hello! I received your order.", time: "9:00 AM" },
      { id: "m2", sender: "customer", text: "Great, thank you! How long will it take?", time: "9:05 AM" },
      { id: "m3", sender: "provider", text: "About 3 hours. I'll let you know when it's done.", time: "9:10 AM" },
      { id: "m4", sender: "provider", text: "Your order is ready for delivery!", time: "10:30 AM" },
    ],
  },
  {
    id: "2",
    provider: "Fresh & Clean Co.",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    lastMessage: "Thanks for using our service!",
    time: "Yesterday",
    unread: false,
    messages: [
      { id: "m1", sender: "customer", text: "Hi, do you handle silk garments?", time: "2:00 PM" },
      { id: "m2", sender: "provider", text: "Yes, we do! We have a special gentle cycle for silk.", time: "2:15 PM" },
      { id: "m3", sender: "customer", text: "Perfect, I'll book a service then.", time: "2:20 PM" },
      { id: "m4", sender: "provider", text: "Thanks for using our service!", time: "4:00 PM" },
    ],
  },
  {
    id: "3",
    provider: "Sparkle Wash Hub",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    lastMessage: "We'll pick up at 10 AM tomorrow.",
    time: "Mar 6",
    unread: false,
    messages: [
      { id: "m1", sender: "provider", text: "Hi! When would you like us to pick up?", time: "11:00 AM" },
      { id: "m2", sender: "customer", text: "Tomorrow morning would be great.", time: "11:30 AM" },
      { id: "m3", sender: "provider", text: "We'll pick up at 10 AM tomorrow.", time: "11:35 AM" },
    ],
  },
];

export const languages = [
  "English",
  "Spanish",
  "Russian",
  "Portuguese",
  "French",
  "Swahili",
  "Haitian Creole",
];
