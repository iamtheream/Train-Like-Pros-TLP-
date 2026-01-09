
import { LessonInfo } from './types';

export const LESSONS: LessonInfo[] = [
  {
    id: 'hitting',
    label: 'Hitting Fundamentals',
    description: 'Focus on swing mechanics, bat speed, and plate discipline.',
    icon: 'fa-baseball-bat-ball',
    price: '$75'
  },
  {
    id: 'pitching',
    label: 'Pitching & Velocity',
    description: 'Develop mechanics, accuracy, and arm health.',
    icon: 'fa-mound',
    price: '$85'
  },
  {
    id: 'fielding',
    label: 'Elite Fielding',
    description: 'Master footwork, glove work, and throwing accuracy.',
    icon: 'fa-baseball',
    price: '$65'
  },
  {
    id: 'small-group',
    label: 'Small Group Training',
    description: 'Competitive 4-player sessions focusing on game scenarios.',
    icon: 'fa-users',
    price: '$50'
  }
];

export const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', 
  '01:00 PM', '02:00 PM', '03:00 PM', 
  '04:00 PM', '05:00 PM', '06:00 PM'
];

export const SPORTS_OPTIONS = [
  { id: 'baseball', label: 'Baseball', icon: 'fa-baseball-bat-ball', color: 'bg-blue-600' },
  { id: 'softball', label: 'Softball', icon: 'fa-softball', color: 'bg-yellow-400' }
];
