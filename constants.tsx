
import React from 'react';
import { Task, Project, User, Comment, Reminder } from './types.ts';

export const COMMON_SKILLS = [
  "Reading", "Writing", "Basic Math", "Self-Awareness", "Time Management",
  "Critical Thinking", "Problem Solving", "Decision Making", "Emotional Intelligence", "Adaptability",
  "Resilience", "Goal Setting", "Self-Discipline", "Empathy", "Communication Skills",
  "Active Listening", "Public Speaking", "Conflict Resolution", "Negotiation", "Networking",
  "Teamwork", "Leadership", "Cooking", "Cleaning", "Laundry",
  "Home Repairs", "Basic Plumbing", "Basic Carpentry", "Sewing", "Home Safety",
  "Pet Care", "Home Organization", "Gardening", "Personal Hygiene", "Healthy Eating",
  "Exercise", "First Aid", "CPR", "Stress Management", "Meditation",
  "Swimming", "Cycling", "Self-Defense", "Computer Literacy", "Typing",
  "Internet Research", "Online Communication", "Word Processing", "Spreadsheet Skills", "Budgeting",
  "Saving Money", "Investing Basics", "Credit Management", "Tax Preparation", "Debt Management",
  "Retirement Planning", "Resume Writing", "Job Interview Skills", "Project Management", "Professional Etiquette",
  "Business Writing", "Playing a Musical Instrument", "Drawing or Painting", "Photography", "Dancing",
  "Creative Writing", "Fire Building", "Camping", "Navigation (Map Reading)", "Fishing",
  "Changing a Flat Tire", "Jump-Starting a Car", "Driving", "Parallel Parking", "Foreign Language",
  "Basic Tool Use", "Changing a Light Bulb", "Assembling Furniture", "Tie a Necktie", "Driving a Manual Transmission",
  "Checking Oil and Tire Pressure", "Changing a Car Battery", "Interior Decorating", "Etiquette and Manners", "Packing",
  "Cultural Awareness", "Patience", "Study Skills", "Creative Thinking", "Travel Planning",
  "Assertiveness", "Setting Boundaries", "Persuasion", "Situational Awareness", "Using Public Transportation",
  "Self-Confidence", "Prioritization", "Ironing Clothes", "Smartphone Usage", "Personal Grooming"
];

export const INITIAL_USERS: User[] = [
  { 
    id: 'u1', 
    name: 'User', 
    email: 'me@lifephysics.io', 
    avatarUrl: 'https://i.pravatar.cc/150?u=u1',
    level: 1,
    xp: 0,
    totalXp: 0
  }
];

export const INITIAL_PROJECTS: Project[] = [
  { id: 'p1', title: 'Mindful Perspective', description: 'Looking at how your past shapes your time.', color: '#3b82f6', ownerId: 'u1' }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: '2',
    projectId: 'p1',
    title: 'Notice Your Life',
    category: 'Habits',
    status: 'pending',
    description: 'Insert the tasks that occupy your current spacetime to visualize their weight.',
    difficulty: 'Some Weight',
    assigneeId: 'u1',
    createdAt: new Date().toISOString(),
    prerequisites: [
      { id: '2-initial', label: '', completed: false }
    ]
  }
];

export const INITIAL_COMMENTS: Comment[] = [];
export const INITIAL_REMINDERS: Reminder[] = [];

export const ICONS = {
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Info: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  Rocket: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Project: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
    </svg>
  )
};
