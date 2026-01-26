import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';
import { NotificationService } from '../../core/services/notification.service';
import { User, Notification } from '../../core/models/models';
import { ApiConstants } from '../../core/constants/api.constants';
import { TranslateModule } from '@ngx-translate/core';
import { UiService } from '../../core/services/ui.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="dashboard-layout" [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'">
      <!-- Mobile Overlay -->
      <div class="sidebar-overlay" *ngIf="isSidebarOpen" (click)="toggleSidebar()"></div>

      <!-- Sidebar -->
      <aside class="sidebar" [class.open]="isSidebarOpen">
        <div class="brand">
          <img src="logo.jpg" alt="Logo" class="logo-img">
          <span>{{ 'SIDEBAR.APP_NAME' | translate }}</span>
          <button class="close-sidebar show-on-mobile" (click)="toggleSidebar()">✕</button>
        </div>
        
        <nav class="nav-links">
          <div [class.active]="isActive('/dashboard/courses')" class="nav-item" (click)="navigate('/dashboard/courses')">
            <span class="icon">📚</span> {{ ('SIDEBAR.COURSES' | translate) || 'Cours' }}
          </div>
          <div [class.active]="isActive('/dashboard/grades')" class="nav-item" (click)="navigate('/dashboard/grades')">
            <span class="icon">📈</span> {{ ('SIDEBAR.GRADES' | translate) || 'Notes' }}
          </div>
          <div [class.active]="isActive('/dashboard/absences')" class="nav-item" (click)="navigate('/dashboard/absences')">
            <span class="icon">🕒</span> {{ ('SIDEBAR.ABSENCES' | translate) || 'Absences' }}
          </div>
          <div class="divider" *ngIf="user()?.role === 'manager'"></div>
          <div *ngIf="user()?.role === 'manager'" [class.active]="isActive('/dashboard/justifications')" class="nav-item" (click)="navigate('/dashboard/justifications')">
            <span class="icon">📋</span> {{ ('SIDEBAR.JUSTIFICATIONS' | translate) || 'Justifications' }}
          </div>
          <div *ngIf="user()?.role === 'manager'" [class.active]="isActive('/dashboard/users')" class="nav-item" (click)="navigate('/dashboard/users')">
            <span class="icon">👥</span> {{ ('SIDEBAR.USERS' | translate) || 'Utilisateurs' }}
          </div>
        </nav>

        <div class="lang-switcher">
          <button type="button" (click)="setLang('fr')" [class.active]="currentLang() === 'fr'">FR</button>
          <span class="separator">|</span>
          <button type="button" (click)="setLang('ar')" [class.active]="currentLang() === 'ar'">AR</button>
        </div>
        
        <div class="user-profile" [class.active]="isActive('/dashboard/profile')" style="cursor: pointer;" (click)="navigate('/dashboard/profile')">
          <img *ngIf="user()?.profilePicture && !imageLoadError" [src]="getProfilePicture()" (error)="handleImageError()" class="avatar-img shadow-sm">
          <div *ngIf="!user()?.profilePicture || imageLoadError" class="avatar-placeholder">{{ user()?.firstName?.charAt(0) }}</div>
          <div class="user-info">
            <span class="name">{{ user()?.firstName }}</span>
            <span class="role">{{ user()?.role }}</span>
          </div>
          <button (click)="logout($event)" class="logout-btn" [title]="'SIDEBAR.LOGOUT' | translate">🚪</button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <header class="top-header">
          <button class="menu-toggle show-on-mobile" (click)="toggleSidebar()">☰</button>
          <h1 class="page-title hide-on-mobile">{{ 'DASHBOARD.TITLE' | translate }}</h1>
          
          <!-- Notifications Bell (Only for Students) -->
          <div class="notifications-container" *ngIf="user()?.role === 'student'">
            <button class="notifications-btn" (click)="toggleNotifications($event)" [class.has-unread]="notificationService.unreadCount() > 0">
              🔔
              <span class="badge" *ngIf="notificationService.unreadCount() > 0">{{ notificationService.unreadCount() }}</span>
            </button>
            
            <!-- Notifications Dropdown -->
            <div class="notifications-dropdown" *ngIf="showNotifications" (click)="$event.stopPropagation()">
              <div class="dropdown-header">
                <h3>{{ 'NOTIFICATIONS.TITLE' | translate }}</h3>
                <button class="mark-all-read" (click)="markAllAsRead()" *ngIf="notificationService.unreadCount() > 0">
                  {{ 'NOTIFICATIONS.MARK_ALL_READ' | translate }}
                </button>
              </div>
              
              <div class="notifications-list" *ngIf="notifications.length > 0">
                <div class="notification-item" 
                     *ngFor="let notification of notifications" 
                     [class.unread]="!notification.read"
                     (click)="showNotificationDetails(notification)">
                  <div class="notification-icon">
                    {{ getNotificationIcon(notification.type) }}
                  </div>
                  <div class="notification-content">
                    <div class="notification-title">{{ getNotificationData(notification).titleKey | translate: getNotificationData(notification).titleParams }}</div>
                    <div class="notification-message">{{ getNotificationData(notification).msgKey | translate: getNotificationData(notification).msgParams }}</div>
                    <div class="notification-time">{{ notification.createdAt | date:'short' }}</div>
                  </div>
                  <button class="delete-btn" (click)="deleteNotification(notification._id, $event)">×</button>
                </div>
              </div>
              
              <div class="empty-notifications" *ngIf="notifications.length === 0">
                <div class="empty-icon">🔕</div>
                <p>{{ 'NOTIFICATIONS.EMPTY' | translate }}</p>
              </div>
            </div>
          </div>

          <!-- Notification Details Modal -->
          <div class="notification-modal" *ngIf="selectedNotification" (click)="closeNotificationModal()">
            <div class="modal-content" (click)="$event.stopPropagation()">
              <div class="modal-header">
                <div class="modal-icon">{{ getNotificationIcon(selectedNotification.type) }}</div>
                <h3>{{ getNotificationData(selectedNotification).titleKey | translate: getNotificationData(selectedNotification).titleParams }}</h3>
                <button class="close-modal-btn" (click)="closeNotificationModal()">×</button>
              </div>
              <div class="modal-body">
                <p class="notification-full-message">{{ getNotificationData(selectedNotification).msgKey | translate: getNotificationData(selectedNotification).msgParams }}</p>
                <div class="notification-meta">
                  <span class="meta-item">
                    <strong>📅 Date:</strong> {{ selectedNotification.createdAt | date:'full' }}
                  </span>
                  <span class="meta-item" [class.unread-badge]="!selectedNotification.read">
                    <strong>📌 Statut:</strong> {{ selectedNotification.read ? 'Lu' : 'Non lu' }}
                  </span>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn-secondary" (click)="closeNotificationModal()">Fermer</button>
                <button class="btn-danger" (click)="deleteNotification(selectedNotification._id, $event); closeNotificationModal()">Supprimer</button>
              </div>
            </div>
          </div>

          <div class="date-badge hide-on-mobile">{{ today | date:'fullDate':'':currentLang() }}</div>
        </header>

        <div class="content-scrollable">
          <router-outlet></router-outlet>
        </div>
        <footer class="app-footer">
          <p>Cette plateforme a été créée par <span class="author">Yahya El Mamy</span></p>
        </footer>
      </main>
    </div>

  `,
  styles: [`
    .dashboard-layout {
      display: flex;
      height: 100vh;
      background-color: var(--bg-body);
      overflow: hidden;
    }

    /* Sidebar Styles */
    .sidebar {
      width: 280px;
      background: var(--bg-sidebar);
      color: var(--text-light);
      display: flex;
      flex-direction: column;
      padding: 1.5rem;
      box-shadow: 4px 0 24px rgba(0,0,0,0.05);
      z-index: 100;
      transition: var(--transition);
    }

    .sidebar-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 90;
      backdrop-filter: blur(4px);
      animation: fadeIn 0.3s ease;
    }

    .close-sidebar {
      background: rgba(255,255,255,0.1);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: none; /* Hidden by default on PC */
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      margin-left: auto;
    }

    [dir="rtl"] .close-sidebar { margin-left: 0; margin-right: auto; }

    .menu-toggle {
      background: white;
      border: none;
      padding: 0.5rem;
      font-size: 1.5rem;
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-sm);
      margin-right: 1rem;
      line-height: 1;
    }

    [dir="rtl"] .menu-toggle { margin-right: 0; margin-left: 1rem; }


    .brand {
      display: flex;
      align-items: center;
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
      margin-bottom: 3rem;
      gap: 0.75rem;
    }
    .logo-img { width: 45px; height: 45px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.2); }

    .nav-links {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.85rem 1rem;
      color: var(--text-light);
      opacity: 0.8;
      text-decoration: none;
      border-radius: var(--radius-md);
      transition: var(--transition);
      font-weight: 500;
      white-space: nowrap;
      cursor: pointer; /* Ensure it looks clickable */
    }

    [dir="rtl"] .nav-item {
      gap: 1rem;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.05);
      opacity: 1;
      transform: translateX(5px);
    }

    [dir="rtl"] .nav-item:hover {
      transform: translateX(-5px);
    }

    .nav-item.active {
      background: var(--primary);
      color: white;
      opacity: 1;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
    }
    
    .divider { height: 1px; background: rgba(255,255,255,0.1); margin: 1rem 0; }

    /* User Profile Footer */
    .user-profile {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255,255,255,0.1);
    }

    [dir="rtl"] .user-profile {
      flex-direction: row;
    }

    .avatar-placeholder {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: white;
      box-shadow: var(--shadow-sm);
    }

    .avatar-img {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      border-radius: 12px;
      object-fit: cover;
      border: 2px solid rgba(255, 255, 255, 0.2);
    }

    .user-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    [dir="rtl"] .user-info {
      text-align: right;
    }

    .name { font-weight: 600; font-size: 0.95rem; color: white; }
    .role { font-size: 0.8rem; color: #94a3b8; text-transform: capitalize; }

    .logout-btn {
      background: none;
      border: none;
      font-size: 1.2rem;
      opacity: 0.7;
      transition: var(--transition);
      padding: 5px;
    }

    [dir="rtl"] .logout-btn {
      margin-right: auto;
      margin-left: 0;
    }

    .logout-btn:hover { opacity: 1; transform: scale(1.1); }

    .lang-switcher {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 2rem;
      padding: 0.5rem;
      background: rgba(255,255,255,0.05);
      border-radius: var(--radius-sm);
    }

    .lang-switcher button {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 0.8rem;
      font-weight: 700;
      padding: 0.25rem 0.5rem;
      transition: var(--transition);
    }

    .lang-switcher button.active {
      color: white;
      text-decoration: underline;
    }

    .lang-switcher .separator { color: rgba(255,255,255,0.2); font-size: 0.8rem; }

    /* Main Area */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .top-bar {
      padding: 1.5rem 2.5rem;
      background: transparent;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .page-title {
      font-size: 1.75rem;
      color: var(--text-main);
      margin: 0;
    }

    .date-badge {
      background: white;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-lg);
      font-size: 0.9rem;
      color: var(--text-muted);
      box-shadow: var(--shadow-sm);
      font-weight: 500;
      display: flex;
      gap: 0.5rem;
    }

    /* Notifications Styles */
    .notifications-container {
      position: relative;
    }

    .notifications-btn {
      position: relative;
      background: white;
      border: none;
      border-radius: 50%;
      width: 45px;
      height: 45px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1.5rem;
      box-shadow: var(--shadow-sm);
      transition: var(--transition);
    }

    .notifications-btn:hover {
      transform: scale(1.05);
      box-shadow: var(--shadow-md);
    }

    .notifications-btn.has-unread {
      animation: bellRing 2s ease-in-out infinite;
    }

    .notifications-btn .badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #ef4444;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
    }

    .notifications-dropdown {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 400px;
      max-height: 500px;
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      animation: slideDown 0.2s ease-out;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .dropdown-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
    }

    .dropdown-header h3 {
      margin: 0;
      font-size: 1.1rem;
      color: var(--text-main);
    }

    .mark-all-read {
      background: none;
      border: none;
      color: var(--primary);
      font-size: 0.85rem;
      cursor: pointer;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      transition: var(--transition);
    }

    .mark-all-read:hover {
      background: rgba(79, 70, 229, 0.1);
    }

    .notifications-list {
      flex: 1;
      overflow-y: auto;
      max-height: 400px;
    }

    .notification-item {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      gap: 1rem;
      cursor: pointer;
      transition: var(--transition);
      position: relative;
    }

    .notification-item:hover {
      background: #f8fafc;
    }

    .notification-item.unread {
      background: #eff6ff;
    }

    .notification-item.unread::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: var(--primary);
    }

    .notification-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-title {
      font-weight: 600;
      color: var(--text-main);
      margin-bottom: 0.25rem;
      font-size: 0.95rem;
    }

    .notification-message {
      color: var(--text-muted);
      font-size: 0.85rem;
      line-height: 1.4;
      margin-bottom: 0.5rem;
    }

    .notification-time {
      color: var(--text-muted);
      font-size: 0.75rem;
    }

    .delete-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: var(--transition);
      flex-shrink: 0;
    }

    .delete-btn:hover {
      background: #fee2e2;
      color: #ef4444;
    }

    .empty-notifications {
      padding: 3rem 2rem;
      text-align: center;
      color: var(--text-muted);
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    @keyframes bellRing {
      0%, 100% { transform: rotate(0deg); }
      10%, 30% { transform: rotate(-10deg); }
      20%, 40% { transform: rotate(10deg); }
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Notification Modal Styles */
    .notification-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      animation: fadeIn 0.2s ease-out;
    }

    .notification-modal .modal-content {
      background: white;
      border-radius: var(--radius-lg);
      width: 90%;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: var(--shadow-lg);
      animation: slideUp 0.3s ease-out;
    }

    .notification-modal .modal-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .notification-modal .modal-icon {
      font-size: 2rem;
      flex-shrink: 0;
    }

    .notification-modal .modal-header h3 {
      flex: 1;
      margin: 0;
      color: var(--text-main);
      font-size: 1.25rem;
    }

    .close-modal-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-muted);
      padding: 0.25rem;
      line-height: 1;
      transition: var(--transition);
    }

    .close-modal-btn:hover {
      color: var(--text-main);
    }

    .notification-modal .modal-body {
      padding: 1.5rem;
    }

    .notification-full-message {
      font-size: 1rem;
      line-height: 1.6;
      color: var(--text-main);
      margin-bottom: 1.5rem;
      white-space: pre-wrap;
    }

    .notification-meta {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: var(--radius-md);
    }

    .meta-item {
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    .meta-item strong {
      color: var(--text-main);
    }

    .unread-badge {
      color: var(--primary);
      font-weight: 600;
    }

    .notification-modal .modal-footer {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #f1f5f9;
      justify-content: flex-end;
    }

    .btn-secondary, .btn-danger {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: var(--radius-md);
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
    }

    .btn-secondary {
      background: #f1f5f9;
      color: var(--text-main);
    }

    .btn-secondary:hover {
      background: #e2e8f0;
    }

    .btn-danger {
      background: #fee2e2;
      color: #ef4444;
    }

    .btn-danger:hover {
      background: #fecaca;
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .content-scrollable {
      flex: 1;
      overflow-y: auto;
      padding: 0 2.5rem 2.5rem;
    }

    @media (max-width: 768px) {
      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        transform: translateX(-100%);
        width: 280px;
        opacity: 0;
        visibility: hidden;
      }
      [dir="rtl"] .sidebar {
        left: auto;
        right: 0;
        transform: translateX(100%);
      }
      .sidebar.open {
        transform: translateX(0);
        opacity: 1;
        visibility: visible;
      }
      /* Ensure RTL open state also works with higher specificity if needed */
      [dir="rtl"] .sidebar.open {
        transform: translateX(0);
      }
      /* Top Bar Fixes for Mobile */
      .top-header {
        padding: 0 1rem; /* Very small padding */
        background: white;
        box-shadow: var(--shadow-sm);
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 50;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        height: 60px; /* Reduced height */
      }
      
      .menu-toggle {
        margin-right: 0.5rem;
        padding: 0.25rem;
        font-size: 1.25rem; /* Smaller icon */
      }
      [dir="rtl"] .menu-toggle { margin-left: 0.5rem; margin-right: 0; }

      .page-title { 
        display: none !important; /* Hide title completely on mobile to save space */
      }
      
      /* Optimize date display - Centered */
      .date-badge {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        font-size: 0.75rem;
        padding: 0.2rem 0.5rem;
        background: #f1f5f9; /* softer bg */
        display: flex !important;
        white-space: nowrap;
        border-radius: 12px;
        font-weight: 600;
        color: var(--text-main);
      }
      
      @media (max-width: 340px) {
        .date-badge { display: none !important; }
      }

      .content-scrollable { 
        padding: 1rem; 
        margin-top: 60px;
        flex: 1;
        overflow-y: auto;
        min-height: 0;
      }

      .app-footer {
        padding: 1rem;
        background: transparent;
        text-align: center;
        border-top: 1px solid rgba(0,0,0,0.05);
        font-size: 0.9rem;
        color: var(--text-muted);
        flex-shrink: 0;
      }
      .app-footer .author {
        font-weight: 700;
        color: var(--primary);
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .brand { margin-bottom: 2rem; }
      
      .close-sidebar {
        display: flex;
      }

      /* Mobile Notifications: Aligned under icon */
      /* Note: The parent .notifications-container needs position: relative (already set globally) */
      .notifications-dropdown {
        position: absolute; /* Revert to absolute relative to parent container */
        top: 100%; /* Directly below icon */
        margin-top: 10px;
        right: -10px; /* Align to right edge for LTR */
        left: auto;
        transform: none; /* No centering transform needed */
        width: 300px; /* Fixed width reasonable for mobile */
        max-width: 90vw; /* Safety cap */
        max-height: 70vh;
        z-index: 2000;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(0,0,0,0.05);
        animation: slideDown 0.3s ease-out;
        border-radius: var(--radius-lg);
      }
      
      /* RTL Specific Adjustment for Mobile */
      [dir="rtl"] .notifications-dropdown {
        right: auto;
        left: -10px; /* Align to left edge for RTL */
      }

      .notifications-dropdown::before {
        display: none; 
      }
    }


    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})

export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  notificationService = inject(NotificationService);
  private http = inject(HttpClient);
  user = this.authService.currentUser;
  today = new Date();
  isSidebarOpen = false;
  showNotifications = false;
  notifications: Notification[] = [];
  selectedNotification: Notification | null = null;
  private i18nService = inject(I18nService);
  currentLang = this.i18nService.currentLang;

  constructor() {
    // Close notifications dropdown when clicking outside
    if (typeof document !== 'undefined') {
      document.addEventListener('click', () => {
        this.showNotifications = false;
      });
    }
  }

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.notificationService.getNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
      },
      error: (err) => console.error('Error loading notifications:', err)
    });
  }

  toggleNotifications(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.loadNotifications();
    }
  }

  markNotificationAsRead(notification: Notification) {
    if (!notification.read) {
      this.notificationService.markAsRead(notification._id).subscribe({
        next: () => {
          notification.read = true;
          this.loadNotifications();
        },
        error: (err) => console.error('Error marking as read:', err)
      });
    }
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.loadNotifications();
      },
      error: (err) => console.error('Error marking all as read:', err)
    });
  }

  deleteNotification(id: string, event: Event) {
    event.stopPropagation();
    this.notificationService.deleteNotification(id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n._id !== id);
        this.notificationService.refreshUnreadCount();
      },
      error: (err) => console.error('Error deleting notification:', err)
    });
  }

  getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'course_added': '📚',
      'grade_added': '📊',
      'absence_marked': '🕒',
      'justification_reviewed': '✅'
    };
    return icons[type] || '📬';
  }

  showNotificationDetails(notification: Notification) {
    console.log('Showing notification details:', notification);
    this.selectedNotification = notification;
    this.showNotifications = false;

    // Mark as read if not already
    if (!notification.read) {
      this.notificationService.markAsRead(notification._id).subscribe({
        next: () => {
          notification.read = true;
          this.loadNotifications();
        },
        error: (err) => console.error('Error marking as read:', err)
      });
    }
  }

  closeNotificationModal() {
    this.selectedNotification = null;
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  protected uiService = inject(UiService);

  navigate(path: string) {
    if (window.innerWidth <= 768) {
      this.isSidebarOpen = false;
    }
    // Only trigger splash if we are actually changing routes or user explicit click
    if (!this.isActive(path)) {
      this.uiService.triggerSplash();
    }
    this.router.navigate([path]).catch(err => console.error('Nav error', err));
  }

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  closeSidebarOnMobile() {
    if (window.innerWidth <= 768) {
      this.isSidebarOpen = false;
    }
  }

  setLang(lang: 'fr' | 'ar') {
    this.i18nService.setLanguage(lang);
  }

  getProfilePicture(): string {
    const user = this.user();
    if (user?.profilePicture) {
      const baseUrl = ApiConstants.baseUrl.replace('/api', '');
      const path = user.profilePicture.startsWith('/') ? user.profilePicture : `/${user.profilePicture}`;
      return `${baseUrl}${path}`;
    }
    return '';
  }

  imageLoadError = false;
  handleImageError() {
    this.imageLoadError = true;
  }

  logout(event?: Event) {
    if (event) event.stopPropagation();
    this.authService.logout();
  }

  getNotificationData(notification: any): { titleKey: string, titleParams: any, msgKey: string, msgParams: any } {
    // New Logic: Use params from backend if available
    if (notification.params && Object.keys(notification.params).length > 0) {
      return {
        titleKey: notification.title,
        titleParams: notification.params,
        msgKey: notification.message,
        msgParams: notification.params
      };
    }

    // Fallback logic for old notifications (Regex parsing)
    const result = {
      titleKey: notification.title,
      titleParams: {},
      msgKey: notification.message,
      msgParams: {}
    };

    if (notification.type === 'grade_added') {
      if (!notification.title.includes('NOTIFICATIONS.')) result.titleKey = 'NOTIFICATIONS.GRADE_ADDED_TITLE';
      // Match: "Professor Name a ajouté une note de 15/20 en Math (Devoir)"
      const match = notification.message.match(/note de ([\d\.]+)\/20 en (.*?) \((.*)\)/);
      if (match) {
        result.msgKey = 'NOTIFICATIONS.GRADE_ADDED_MSG';
        result.msgParams = { value: match[1], subject: match[2], type: match[3] };
      }
    } else if (notification.type === 'absence_marked') {
      if (!notification.title.includes('NOTIFICATIONS.')) result.titleKey = 'NOTIFICATIONS.ABSENCE_MARKED_TITLE';
      // Match: "... absence de 2h en Math le 25/01/2026"
      const match = notification.message.match(/absence de (.*?)h en (.*?) le (.*)/);
      if (match) {
        result.msgKey = 'NOTIFICATIONS.ABSENCE_MARKED_MSG';
        result.msgParams = { duration: match[1], subject: match[2], date: match[3] };
      }
    } else if (notification.type === 'course_added') {
      if (!notification.title.includes('NOTIFICATIONS.')) result.titleKey = 'NOTIFICATIONS.COURSE_ADDED_TITLE';
      // Match: "... cours: Titre du cours en Math"
      const match = notification.message.match(/cours: (.*?) en (.*)/);
      if (match) {
        result.msgKey = 'NOTIFICATIONS.COURSE_ADDED_MSG';
        result.msgParams = { title: match[1], subject: match[2] };
      }
    }

    return result;
  }
}
