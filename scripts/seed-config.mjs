import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBtuS1_ODSdtYisLf_27elxf2cjphfmwNc",
  authDomain: "mindtrack-app-c00c1.firebaseapp.com",
  projectId: "mindtrack-app-c00c1",
  storageBucket: "mindtrack-app-c00c1.firebasestorage.app",
  messagingSenderId: "941135851018",
  appId: "1:941135851018:web:4378f435edc255a3da79f3",
  measurementId: "G-MVC8ESZL21",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const moodOptions = [
  {
    value: 1,
    label: "Very Unpleasant",
    translations: { en: "Very Unpleasant", he: "מאוד לא נעים" },
    icon: "mood-very-unpleasant",
    color: "purple",
    order: 1,
  },
  {
    value: 2,
    label: "Unpleasant",
    translations: { en: "Unpleasant", he: "לא נעים" },
    icon: "mood-unpleasant",
    color: "indigo",
    order: 2,
  },
  {
    value: 3,
    label: "Slightly Unpleasant",
    translations: { en: "Slightly Unpleasant", he: "קצת לא נעים" },
    icon: "mood-slightly-unpleasant",
    color: "blue",
    order: 3,
  },
  {
    value: 4,
    label: "Neutral",
    translations: { en: "Neutral", he: "ניטרלי" },
    icon: "mood-neutral",
    color: "teal",
    order: 4,
  },
  {
    value: 5,
    label: "Slightly Pleasant",
    translations: { en: "Slightly Pleasant", he: "קצת נעים" },
    icon: "mood-slightly-pleasant",
    color: "green",
    order: 5,
  },
  {
    value: 6,
    label: "Pleasant",
    translations: { en: "Pleasant", he: "נעים" },
    icon: "mood-pleasant",
    color: "orange",
    order: 6,
  },
  {
    value: 7,
    label: "Very Pleasant",
    translations: { en: "Very Pleasant", he: "מאוד נעים" },
    icon: "mood-very-pleasant",
    color: "yellow",
    order: 7,
  },
];

const emotionMoodRanges = {
  Amazed: [6, 7],
  Amused: [5, 6, 7],
  Calm: [4, 5, 6],
  Confident: [5, 6, 7],
  Content: [4, 5, 6],
  Excited: [6, 7],
  Grateful: [5, 6, 7],
  Happy: [5, 6, 7],
  Hopeful: [4, 5, 6],
  Loved: [5, 6, 7],
  Proud: [5, 6, 7],
  Relaxed: [4, 5, 6],
  Relieved: [4, 5, 6],
  Satisfied: [5, 6, 7],

  Bored: [2, 3, 4],
  Distracted: [3, 4],
  Indifferent: [3, 4],
  Neutral: [4],
  Tired: [2, 3, 4],

  Afraid: [1, 2],
  Angry: [1, 2],
  Annoyed: [2, 3],
  Anxious: [1, 2, 3],
  Ashamed: [1, 2, 3],
  Disappointed: [2, 3],
  Embarrassed: [2, 3],
  Frustrated: [1, 2, 3],
  Guilty: [1, 2, 3],
  Irritated: [2, 3],
  Lonely: [1, 2, 3],
  Overwhelmed: [1, 2],
  Sad: [1, 2, 3],
  Stressed: [1, 2, 3],
  Worried: [1, 2, 3],
};

const emotionTranslations = {
  Amazed: "נדהם",
  Amused: "משועשע",
  Calm: "רגוע",
  Confident: "בטוח בעצמי",
  Content: "מסופק",
  Excited: "נרגש",
  Grateful: "אסיר תודה",
  Happy: "שמח",
  Hopeful: "מלא תקווה",
  Loved: "אהוב",
  Proud: "גאה",
  Relaxed: "נינוח",
  Relieved: "חש הקלה",
  Satisfied: "מרוצה",

  Bored: "משועמם",
  Distracted: "מוסח",
  Indifferent: "אדיש",
  Neutral: "ניטרלי",
  Tired: "עייף",

  Afraid: "מפחד",
  Angry: "כועס",
  Annoyed: "מוטרד",
  Anxious: "חרד",
  Ashamed: "מתבייש",
  Disappointed: "מאוכזב",
  Embarrassed: "נבוך",
  Frustrated: "מתוסכל",
  Guilty: "חש אשמה",
  Irritated: "עצבני",
  Lonely: "בודד",
  Overwhelmed: "מוצף",
  Sad: "עצוב",
  Stressed: "לחוץ",
  Worried: "מודאג",
};

const emotionOptions = [
  ["Amazed", "pleasant"],
  ["Amused", "pleasant"],
  ["Calm", "pleasant"],
  ["Confident", "pleasant"],
  ["Content", "pleasant"],
  ["Excited", "pleasant"],
  ["Grateful", "pleasant"],
  ["Happy", "pleasant"],
  ["Hopeful", "pleasant"],
  ["Loved", "pleasant"],
  ["Proud", "pleasant"],
  ["Relaxed", "pleasant"],
  ["Relieved", "pleasant"],
  ["Satisfied", "pleasant"],

  ["Bored", "neutral"],
  ["Distracted", "neutral"],
  ["Indifferent", "neutral"],
  ["Neutral", "neutral"],
  ["Tired", "neutral"],

  ["Afraid", "unpleasant"],
  ["Angry", "unpleasant"],
  ["Annoyed", "unpleasant"],
  ["Anxious", "unpleasant"],
  ["Ashamed", "unpleasant"],
  ["Disappointed", "unpleasant"],
  ["Embarrassed", "unpleasant"],
  ["Frustrated", "unpleasant"],
  ["Guilty", "unpleasant"],
  ["Irritated", "unpleasant"],
  ["Lonely", "unpleasant"],
  ["Overwhelmed", "unpleasant"],
  ["Sad", "unpleasant"],
  ["Stressed", "unpleasant"],
  ["Worried", "unpleasant"],
].map(([label, category], index) => ({
  label,
  category,
  translations: {
    en: label,
    he: emotionTranslations[label],
  },
  moodRange: emotionMoodRanges[label],
  order: index + 1,
}));

const influenceTranslations = {
  Family: "משפחה",
  Partner: "בן/בת זוג",
  Friends: "חברים",
  Dating: "דייטינג",
  Work: "עבודה",
  School: "לימודים",
  Health: "בריאות",
  Fitness: "כושר",
  Sleep: "שינה",
  Food: "אוכל",
  Weather: "מזג אוויר",
  Money: "כסף",
  "Current Events": "אקטואליה",
  "Social Media": "רשתות חברתיות",
  Hobbies: "תחביבים",
  Travel: "נסיעות",
  Spirituality: "רוחניות",
  "Self-care": "טיפוח עצמי",
  Tasks: "משימות",
  Other: "אחר",
};

const influenceOptions = [
  "Family",
  "Partner",
  "Friends",
  "Dating",
  "Work",
  "School",
  "Health",
  "Fitness",
  "Sleep",
  "Food",
  "Weather",
  "Money",
  "Current Events",
  "Social Media",
  "Hobbies",
  "Travel",
  "Spirituality",
  "Self-care",
  "Tasks",
  "Other",
].map((label, index) => ({
  label,
  translations: {
    en: label,
    he: influenceTranslations[label],
  },
  order: index + 1,
}));

function idFromLabel(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function seedCollection(collectionName, items, idFactory) {
  for (const item of items) {
    const id = idFactory(item);

    await setDoc(
      doc(collection(db, collectionName), id),
      {
        ...item,
        isActive: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`Seeded ${collectionName}/${id}`);
  }
}

async function main() {
  await seedCollection("moodOptions", moodOptions, (item) => `mood-${item.value}`);
  await seedCollection("emotionOptions", emotionOptions, (item) => idFromLabel(item.label));
  await seedCollection("influenceOptions", influenceOptions, (item) => idFromLabel(item.label));

  console.log("✅ Config seed completed with EN/HE translations");
}

main().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});