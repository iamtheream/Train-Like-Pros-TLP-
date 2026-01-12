
export type Sport = 'baseball' | 'softball';

export type LessonType = 'hitting' | 'fielding' | 'pitching' | 'small-group';

export type UserRole = 'athlete' | 'parent' | 'coach';

export interface TrainingSession {
  date: string;
  time: string;
  lessonType: LessonType;
  price: number;
}

export interface BookingState {
  userType: UserRole | null;
  sport: Sport | null;
  selectedSessions: TrainingSession[];
  playerInfo: {
    firstName: string;
    lastName: string;
    age: string;
    parentName: string;
    parentEmail: string;
    parentPhone: string;
    notes: string;
  };
}

export interface LessonInfo {
  id: LessonType;
  label: string;
  description: string;
  icon: string;
  price: string;
}