import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { ApiConstants } from '../../core/constants/api.constants';
import { User } from '../../core/models/models';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="profile-page">
      <div class="page-header">
        <div>
          <h2>👤 {{ 'PROFILE.TITLE' | translate }}</h2>
          <p class="subtitle">{{ 'PROFILE.SUBTITLE' | translate }}</p>
        </div>
      </div>

      <div class="profile-container">
        <div class="profile-card shadow-lg">
          <div class="profile-header">
            <div class="avatar-wrapper">
              <img *ngIf="!imageLoadError" [src]="getProfilePicture()" (error)="handleImageError()" alt="Profile" class="profile-avatar shadow-md">
              <div *ngIf="imageLoadError" class="profile-avatar shadow-md fallback">
                {{ user()?.firstName?.charAt(0) }}
              </div>
              <label for="avatar-input" class="edit-overlay shadow-sm">
                <span class="icon">📷</span>
                <input type="file" id="avatar-input" (change)="onFileSelected($event)" accept="image/*" hidden>
              </label>
            </div>
            
            <div class="user-info">
              <h3>{{ user()?.firstName }} {{ user()?.lastName }}</h3>
              <span class="role-badge" [ngClass]="user()?.role">{{ ('USERS.' + user()?.role?.toUpperCase()) | translate }}</span>
              <p class="email">{{ user()?.email }}</p>
            </div>
          </div>

          <div class="profile-body">
            <div class="upload-status" *ngIf="uploading">
              <div class="spinner"></div>
              <span>{{ 'PROFILE.UPLOAD_IN_PROGRESS' | translate }}</span>
            </div>

            <div class="error-message" *ngIf="errorMessage">
              ⚠️ {{ errorMessage }}
            </div>

            <div class="success-message" *ngIf="successMessage">
              ✅ {{ 'PROFILE.UPLOAD_SUCCESS' | translate }}
            </div>

            <div class="info-grid">
              <div class="info-item">
                <label>{{ 'PROFILE.FULL_NAME' | translate }}</label>
                <div class="value">{{ user()?.firstName }} {{ user()?.lastName }}</div>
              </div>
              <div class="info-item">
                <label>{{ 'PROFILE.EMAIL' | translate }}</label>
                <div class="value">{{ user()?.email }}</div>
              </div>
              <div class="info-item" *ngIf="user()?.role === 'student'">
                <label>{{ 'PROFILE.CLASS' | translate }}</label>
                <div class="value">{{ getClassName() }}</div>
              </div>
              <div class="info-item" *ngIf="user()?.role === 'professor'">
                <label>{{ 'PROFILE.SUBJECTS' | translate }}</label>
                <div class="value">{{ getSubjects() }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
      padding: 2rem;
      animation: fadeIn 0.4s ease-out;
    }

    [dir="rtl"] .profile-header { flex-direction: row-reverse; text-align: right; }
    [dir="rtl"] .user-info { text-align: right; }
    [dir="rtl"] .edit-overlay { right: auto; left: 5px; }
    [dir="rtl"] .info-item label { text-align: right; }
    [dir="rtl"] .info-item .value { text-align: right; }

    .page-header {
      margin-bottom: 2rem;
    }

    h2 {
      font-size: 2.25rem;
      color: var(--text-main);
      margin-bottom: 0.5rem;
      font-weight: 800;
    }

    .subtitle {
      color: var(--text-muted);
      font-size: 1.1rem;
    }

    .profile-container {
      max-width: 800px;
      margin: 0 auto;
    }

    .profile-card {
      background: white;
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid rgba(0, 0, 0, 0.05);
    }

    .profile-header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      padding: 3rem 2rem;
      display: flex;
      align-items: center;
      gap: 2rem;
      color: white;
    }

    .avatar-wrapper {
      position: relative;
      width: 150px;
      height: 150px;
      flex-shrink: 0;
    }

    .profile-avatar {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid rgba(255, 255, 255, 0.3);
      background: #f1f5f9;
      display: block;
    }
    
    .profile-avatar.fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      font-weight: bold;
      color: #cbd5e1;
    }

    .edit-overlay {
      position: absolute;
      bottom: 5px;
      right: 5px;
      background: white;
      color: var(--primary);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .edit-overlay:hover {
      transform: scale(1.1);
      background: #f8fafc;
    }

    .user-info h3 {
      font-size: 2rem;
      margin: 0 0 0.5rem 0;
      font-weight: 700;
    }

    .role-badge {
      display: inline-block;
      padding: 0.35rem 1rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(4px);
      margin-bottom: 0.75rem;
    }

    .email {
      opacity: 0.9;
      font-size: 1.1rem;
      margin: 0;
    }

    .profile-body {
      padding: 2.5rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
    }

    .info-item label {
      display: block;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-item .value {
      font-size: 1.1rem;
      color: var(--text-main);
      font-weight: 500;
      padding: 0.75rem 1rem;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid #f1f5f9;
    }

    .upload-status {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      color: var(--primary);
      font-weight: 600;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 3px solid #e2e8f0;
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .error-message {
      padding: 1rem;
      background: #fef2f2;
      border-radius: 12px;
      color: #991b1b;
      margin-bottom: 1.5rem;
      font-weight: 500;
      border-left: 4px solid #ef4444;
    }

    .success-message {
      padding: 1rem;
      background: #eff6ff;
      border-radius: 12px;
      color: #1e40af;
      margin-bottom: 1.5rem;
      font-weight: 500;
      border-left: 4px solid #3b82f6;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .profile-page { padding: 1rem; }
      .profile-header {
        flex-direction: column;
        padding: 2rem 1.5rem;
        text-align: center;
        gap: 1.5rem;
      }
      .avatar-wrapper { width: 120px; height: 120px; }
      .user-info h3 { font-size: 1.5rem; }
      .profile-body { padding: 1.5rem; }
      .info-grid { grid-template-columns: 1fr; gap: 1rem; }
      h2 { font-size: 1.75rem; }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  user = this.authService.currentUser;
  uploading = false;
  errorMessage = '';
  successMessage = '';
  imageLoadError = false;

  private translate = inject(TranslateService);

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.fetchProfile();
  }

  fetchProfile() {
    this.http.get<User>(`${ApiConstants.baseUrl}/users/profile`)
      .subscribe({
        next: (data) => {
          this.authService.currentUser.set(data);
          // Also update localStorage to keep it in sync
          localStorage.setItem('user', JSON.stringify(data));
        },
        error: (err) => console.error('Error fetching profile:', err)
      });
  }

  getClassName(): string {
    const user = this.user();
    if (user?.classId) {
      return typeof user.classId === 'object' ? user.classId.name : user.classId;
    }
    let val = '';
    this.translate.get('PROFILE.NOT_ASSIGNED').subscribe(m => val = m);
    return val;
  }

  getSubjects(): string {
    const user = this.user();
    if (user?.subjects && user.subjects.length > 0) {
      return user.subjects.map((s: any) => typeof s === 'object' ? s.name : s).join(', ');
    }
    let val = '';
    this.translate.get('PROFILE.NO_SUBJECTS').subscribe(m => val = m);
    return val;
  }

  getProfilePicture(): string {
    const user = this.user();
    if (user?.profilePicture) {
      const path = user.profilePicture.startsWith('/') ? user.profilePicture : `/${user.profilePicture}`;
      return `${ApiConstants.baseUrl.replace('/api', '')}${path}`;
    }
    return `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=4f46e5&color=fff&size=200`;
  }

  handleImageError() {
    this.imageLoadError = true;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.uploadFile(file);
    }
  }

  uploadFile(file: File) {
    const formData = new FormData();
    formData.append('image', file);

    this.uploading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.patch<any>(`${ApiConstants.baseUrl}/users/profile-picture`, formData)
      .subscribe({
        next: (res) => {
          this.uploading = false;
          this.imageLoadError = false; // Reset error flag for new image
          this.translate.get('PROFILE.UPLOAD_SUCCESS').subscribe(msg => {
            this.successMessage = msg;
          });
          const user = this.user();
          if (user) {
            // Update the user in localStorage via authService
            const userStr = localStorage.getItem('user');
            if (userStr) {
              const currentUser = JSON.parse(userStr);
              currentUser.profilePicture = res.profilePicture;
              localStorage.setItem('user', JSON.stringify(currentUser));
              // Update the signal in AuthService to refresh other components
              this.authService.currentUser.set(currentUser);
            }
          }
        },
        error: (err) => {
          this.uploading = false;
          this.translate.get('PROFILE.UPLOAD_ERROR').subscribe(msg => {
            this.errorMessage = err.error?.message || msg;
          });
        }
      });
  }
}
