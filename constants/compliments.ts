export type Category =
  | 'presence'
  | 'everyday'
  | 'gratitude'
  | 'joy'
  | 'strength'
  | 'family'
  | 'beauty'
  | 'character'
  | 'devotion'
  | 'mind';

export interface Compliment {
  text: string;
  category: Category;
}

export const compliments: Compliment[] = [
  { text: "The way you move through a room — I still notice it like the first time.", category: "presence" },
  { text: "You make ordinary days feel like something worth remembering.", category: "everyday" },
  { text: "I'm a better man because you chose me.", category: "gratitude" },
  { text: "Your laugh is the best sound in this house.", category: "joy" },
  { text: "You handle hard things with so much grace. I see it, even when you don't.", category: "strength" },
  { text: "The way you love our kids — it floors me.", category: "family" },
  { text: "You are genuinely beautiful. Not just to me — to everyone in the room.", category: "beauty" },
  { text: "I don't take for granted what it feels like to come home to you.", category: "gratitude" },
  { text: "You have this way of making people feel seen. It's a rare gift.", category: "character" },
  { text: "I'd choose you again. Every single time.", category: "devotion" },
  { text: "The life we're building together — you're the reason it's good.", category: "everyday" },
  { text: "You are more capable than you give yourself credit for.", category: "strength" },
  { text: "Your heart is one of the most beautiful things about you.", category: "character" },
  { text: "I love the way your mind works — how you see things I would have missed.", category: "mind" },
  { text: "You make me want to be more present. You deserve that.", category: "devotion" },
  { text: "Thank you for carrying so much, so quietly.", category: "gratitude" },
  { text: "You are someone worth fighting for. I never forget that.", category: "devotion" },
  { text: "The kindness you show without thinking — it's one of my favorite things about you.", category: "character" },
  { text: "I feel lucky. Still. After everything.", category: "gratitude" },
  { text: "When you walk into a room, it's still you I look for first.", category: "presence" },
  { text: "You are exactly who our family needed.", category: "family" },
  { text: "Your strength doesn't make you hard — it makes you extraordinary.", category: "strength" },
  { text: "I'm proud to be your husband.", category: "devotion" },
  { text: "You bring warmth into every space you enter.", category: "presence" },
  { text: "The way you care for people — it's one of the things I admire most.", category: "character" },
];

export const CALIBRATION_PHRASE = `I love you — and I mean that in the quiet, everyday way, not just when it's easy to say. The way you move through a room, the way you laugh, the way you handle hard things without making a big deal of it — I notice all of it. I always have. You make ordinary days feel like something worth holding onto. I'm proud to be your husband, and I'd choose you again, every single time, without hesitation.`;
