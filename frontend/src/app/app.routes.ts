import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'courses', pathMatch: 'full' },
            {
                path: 'courses',
                children: [
                    { path: '', loadComponent: () => import('./features/courses/courses.component').then(m => m.CoursesComponent) },
                    { path: 'upload', loadComponent: () => import('./features/courses/upload-course.component').then(m => m.UploadCourseComponent) }
                ]
            },
            {
                path: 'grades',
                children: [
                    { path: '', loadComponent: () => import('./features/grades/grades.component').then(m => m.GradesComponent) },
                    { path: 'add', loadComponent: () => import('./features/grades/add-grade.component').then(m => m.AddGradeComponent) }
                ]
            },
            {
                path: 'absences',
                children: [
                    { path: '', loadComponent: () => import('./features/absences/absences.component').then(m => m.AbsencesComponent) },
                    { path: 'mark', loadComponent: () => import('./features/absences/mark-absence.component').then(m => m.MarkAbsenceComponent) }
                ]
            },
            { path: 'users', loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent) },
            { path: 'justifications', loadComponent: () => import('./features/justifications/justifications.component').then(m => m.JustificationsComponent) },
            { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) }
        ]
    }
];
