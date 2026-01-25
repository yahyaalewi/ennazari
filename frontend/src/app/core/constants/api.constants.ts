import { environment } from '../../../environments/environment';

export const ApiConstants = {
    baseUrl: environment.apiUrl,
    auth: {
        login: '/auth/login',
        register: '/auth/register'
    },
    courses: '/courses',
    grades: '/grades',
    absences: '/absences',
    users: '/users',
    classes: '/classes',
    subjects: '/subjects',
    notifications: '/notifications'
};
