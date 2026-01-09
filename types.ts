
export type Sport = 'baseball' | 'softball';

export type LessonType = 'hitting' | 'fielding' | 'pitching' | 'small-group';

export interface BookingState {
  sport: Sport | null;
  lessonType: LessonType | null;
  date: string | null;
  time: string | null;
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
