import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { ApiConstants } from '../constants/api.constants';
import { User } from '../models/models';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private baseUrl = ApiConstants.baseUrl;
    currentUser = signal<User | null>(this.getUserFromStorage());

    constructor(private http: HttpClient, private router: Router) { }

    login(credentials: { email: string, password: string }) {
        return this.http.post<User>(this.baseUrl + ApiConstants.auth.login, credentials)
            .pipe(
                tap(user => {
                    this.storeUser(user);
                    this.currentUser.set(user);
                })
            );
    }

    logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        this.currentUser.set(null);
        this.router.navigate(['/login']);
    }

    isAuthenticated(): boolean {
        return !!this.currentUser();
    }

    private storeUser(user: User) {
        localStorage.setItem('user', JSON.stringify(user));
        if (user.token) {
            localStorage.setItem('token', user.token);
        }
    }

    private getUserFromStorage(): User | null {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }
}
