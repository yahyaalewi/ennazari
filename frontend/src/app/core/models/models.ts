export interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'student' | 'professor' | 'manager';
    token?: string;
    classId?: any; // Can be string ID or populated Class object
    subjects?: any[]; // Can be string IDs or populated Subject objects
    profilePicture?: string;
}

export interface Class {
    _id: string;
    name: string;
    academicYear: string;
}

export interface Subject {
    _id: string;
    name: string;
    code: string;
}

export interface Course {
    _id: string;
    title: string;
    description: string;
    fileUrl: string;
    subject: Subject | string;
    class: Class | string;
    professor: User | string;
    createdAt: Date;
}

export interface Grade {
    _id: string;
    value: number;
    coefficient: number;
    evaluationType: string;
    subject: Subject;
    student: User;
}

export interface Absence {
    _id: string;
    date: Date;
    durationHours: number;
    justified: boolean;
    justificationReason?: string;
    justificationDocument?: string;
    justificationStatus?: 'none' | 'pending' | 'approved' | 'rejected';
    justificationSubmittedAt?: Date;
    justificationReviewedBy?: User;
    justificationReviewedAt?: Date;
    justificationReviewComment?: string;
    student?: User;
    subject?: Subject;
}

export interface Notification {
    _id: string;
    user: string | User;
    type: 'course_added' | 'grade_added' | 'absence_marked' | 'justification_reviewed';
    title: string;
    message: string;
    relatedId?: string;
    relatedModel?: 'Course' | 'Grade' | 'Absence';
    read: boolean;
    readAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
