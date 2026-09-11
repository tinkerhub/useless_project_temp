export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
};

export const MOCK_MENU: FoodItem[] = [
  {
    id: "f1",
    name: "One Single French Fry (Aesthetic)",
    description: "Placed precisely in the center of a giant box. Comes with a single grain of sea salt.",
    price: 499,
    imageUrl: "https://api.dicebear.com/7.x/icons/svg?seed=fry&backgroundColor=fdf5e6"
  },
  {
    id: "f2",
    name: "Just the Samosa Crust",
    description: "All the crispy corners, absolutely none of the aloo filling. Don't ask how we made it.",
    price: 250,
    imageUrl: "https://api.dicebear.com/7.x/icons/svg?seed=samosa&backgroundColor=fdf5e6"
  },
  {
    id: "f3",
    name: "Deconstructed Pani Puri",
    description: "Puri in one bag, pani in another, ragda in a third. Assembly is your problem.",
    price: 800,
    imageUrl: "https://api.dicebear.com/7.x/icons/svg?seed=panipuri&backgroundColor=fdf5e6"
  },
  {
    id: "f4",
    name: "Extra Elaichi for Biryani",
    description: "A small packet of pure disappointment, ready to ruin someone's day.",
    price: 50,
    imageUrl: "https://api.dicebear.com/7.x/icons/svg?seed=elaichi&backgroundColor=fdf5e6"
  },
  {
    id: "f5",
    name: "Dosa Batter (Unfermented)",
    description: "You'll have to wait 12 hours before you can eat it. Good luck.",
    price: 150,
    imageUrl: "https://api.dicebear.com/7.x/icons/svg?seed=dosa&backgroundColor=fdf5e6"
  }
];
