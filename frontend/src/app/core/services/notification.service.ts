import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval } from 'rxjs';
import { tap, switchMap, startWith } from 'rxjs/operators';
import { ApiConstants } from '../constants/api.constants';
import { Notification } from '../models/models';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    unreadCount = signal<number>(0);
    private pollingInterval = 30000; // Poll every 30 seconds

    constructor(private http: HttpClient) {
        // Start polling for unread count
        this.startPolling();
    }

    private startPolling() {
        interval(this.pollingInterval)
            .pipe(
                startWith(0), // Immediate first call
                switchMap(() => this.getUnreadCount())
            )
            .subscribe({
                next: (response: any) => {
                    this.unreadCount.set(response.count);
                },
                error: (err) => console.error('Error polling notifications:', err)
            });
    }

    getNotifications(unreadOnly: boolean = false): Observable<Notification[]> {
        const url = `${ApiConstants.baseUrl}${ApiConstants.notifications}${unreadOnly ? '?unreadOnly=true' : ''}`;
        return this.http.get<Notification[]>(url);
    }

    getUnreadCount(): Observable<{ count: number }> {
        return this.http.get<{ count: number }>(`${ApiConstants.baseUrl}${ApiConstants.notifications}/unread-count`);
    }

    markAsRead(id: string): Observable<Notification> {
        return this.http.patch<Notification>(
            `${ApiConstants.baseUrl}${ApiConstants.notifications}/${id}/read`,
            {}
        ).pipe(
            tap(() => {
                // Decrement unread count
                this.unreadCount.update(count => Math.max(0, count - 1));
            })
        );
    }

    markAllAsRead(): Observable<any> {
        return this.http.patch(
            `${ApiConstants.baseUrl}${ApiConstants.notifications}/read-all`,
            {}
        ).pipe(
            tap(() => {
                this.unreadCount.set(0);
            })
        );
    }

    deleteNotification(id: string): Observable<any> {
        return this.http.delete(`${ApiConstants.baseUrl}${ApiConstants.notifications}/${id}`);
    }

    refreshUnreadCount() {
        this.getUnreadCount().subscribe({
            next: (response) => this.unreadCount.set(response.count),
            error: (err) => console.error('Error refreshing unread count:', err)
        });
    }
}
