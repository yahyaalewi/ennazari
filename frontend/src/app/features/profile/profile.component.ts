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
      <div class="profile-wrapper">
        <!-- Main Card -->
        <div class="profile-card">
          <!-- Decorative Banner -->
          <div class="card-banner"></div>
          
          <div class="card-content">
            <!-- Header Section with Avatar -->
            <div class="profile-header">
              <div class="avatar-container">
                <div class="avatar-frame">
                  <img *ngIf="!imageLoadError" [src]="getProfilePicture()" (error)="handleImageError()" alt="Profile" class="profile-avatar">
                  <div *ngIf="imageLoadError" class="profile-avatar fallback">
                    {{ user()?.firstName?.charAt(0) }}
                  </div>
                  
                  <label for="avatar-input" class="edit-btn" title="{{ 'PROFILE.UPDATE_PHOTO' | translate }}">
                    <span class="icon">✏️</span>
                    <input type="file" id="avatar-input" (change)="onFileSelected($event)" accept="image/*" hidden>
                  </label>
                </div>
              </div>

              <div class="identity-section">
                <h2 class="user-name">{{ user()?.firstName }} {{ user()?.lastName }}</h2>
                <span class="role-badge" [ngClass]="user()?.role">
                  {{ ('USERS.' + user()?.role?.toUpperCase()) | translate }}
                </span>
              </div>
            </div>

            <!-- Body Section -->
            <div class="profile-body">
              <div class="upload-status" *ngIf="uploading">
                <div class="spinner"></div>
                <span>{{ 'PROFILE.UPLOAD_IN_PROGRESS' | translate }}</span>
              </div>

              <div class="error-message" *ngIf="errorMessage">⚠️ {{ errorMessage }}</div>
              <div class="success-message" *ngIf="successMessage">✅ {{ successMessage }}</div>

              <div class="actions-bar" style="margin-bottom: 1rem; text-align: right;">
                 <button class="btn-edit" *ngIf="!editMode" (click)="toggleEditMode()">
                    ✏️ {{ 'COMMON.EDIT' | translate }}
                 </button>
                 <div *ngIf="editMode" style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <button class="btn-cancel" (click)="toggleEditMode()">{{ 'COMMON.CANCEL' | translate }}</button>
                    <button class="btn-save" (click)="saveProfile()">{{ 'COMMON.SAVE' | translate }}</button>
                 </div>
              </div>

              <div class="info-grid">
                <div class="info-card">
                  <div class="info-icon">📧</div>
                  <div class="info-content">
                    <label>{{ 'PROFILE.EMAIL' | translate }}</label>
                    <div class="value">{{ user()?.email }}</div>
                  </div>
                </div>

                <div class="info-card">
                  <div class="info-icon">👤</div>
                  <div class="info-content">
                    <label>{{ 'PROFILE.FULL_NAME' | translate }}</label>
                    <div class="value" *ngIf="!editMode">{{ user()?.firstName }} {{ user()?.lastName }}</div>
                    <div class="edit-fields" *ngIf="editMode">
                       <input [(ngModel)]="editData.firstName" placeholder="Prénom" class="form-input">
                       <input [(ngModel)]="editData.lastName" placeholder="Nom" class="form-input">
                    </div>
                  </div>
                </div>

                <!-- Date of Birth Card -->
                <div class="info-card">
                  <div class="info-icon">🎂</div>
                  <div class="info-content">
                    <label>{{ 'PROFILE.DATE_OF_BIRTH' | translate }}</label>
                    <div class="value" *ngIf="!editMode">
                        {{ user()?.dateOfBirth ? (user()?.dateOfBirth | date:'longDate') : 'Non renseignée' }}
                    </div>
                    <div class="edit-fields" *ngIf="editMode">
                        <input type="date" [ngModel]="formatDateForInput(editData.dateOfBirth)" (ngModelChange)="editData.dateOfBirth = $event" class="form-input">
                    </div>
                  </div>
                </div>

                <div class="info-card" *ngIf="user()?.role === 'student'">
                  <div class="info-icon">🎓</div>
                  <div class="info-content">
                    <label>{{ 'PROFILE.CLASS' | translate }}</label>
                    <div class="value highlight">{{ getClassName() }}</div>
                  </div>
                </div>

                <div class="info-card full-width" *ngIf="user()?.role === 'professor'">
                  <div class="info-icon">📚</div>
                  <div class="info-content">
                    <label>{{ 'PROFILE.SUBJECTS' | translate }}</label>
                    <div class="value">{{ getSubjects() }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
      min-height: 100%;
      padding: 2rem;
      display: flex;
      justify-content: center;
      animation: fadeIn 0.5s ease-out;
    }

    .profile-wrapper {
      width: 100%;
      max-width: 800px;
    }

    .profile-card {
      background: white;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
      position: relative;
    }

    .card-banner {
      height: 160px;
      background: linear-gradient(120deg, var(--primary), #818cf8, #c084fc);
      position: relative;
    }

    /* RTL Support */
    [dir="rtl"] .info-content { text-align: right; }
    [dir="rtl"] .edit-btn { right: auto; left: 0; }
    [dir="rtl"] .info-icon { margin-right: 0; margin-left: 1rem; }

    .card-content {
      position: relative;
      padding: 0 2rem 3rem;
    }

    .profile-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: -80px; /* Overlap banner */
      margin-bottom: 3rem;
    }

    .avatar-container {
      position: relative;
      margin-bottom: 1.5rem;
    }

    .avatar-frame {
      width: 160px;
      height: 160px;
      border-radius: 50%;
      border: 6px solid white;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      position: relative;
      background: white;
    }

    .profile-avatar {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    .profile-avatar.fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 4rem;
      font-weight: 700;
      color: var(--primary);
      background: #f1f5f9;
    }

    .edit-btn {
      position: absolute;
      bottom: 5px;
      right: 5px;
      width: 32px; /* Smaller size */
      height: 32px;
      background: white; /* White background for contrast */
      color: var(--text-main);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      border: 1px solid #e2e8f0;
      transition: all 0.2s ease;
      font-size: 0.9rem; /* Smaller icon */
    }

    .edit-btn:hover {
      transform: scale(1.05);
      background: #f8fafc;
      color: var(--primary);
    }

    .identity-section {
      text-align: center;
    }

    .user-name {
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-main);
      margin: 0 0 0.5rem;
      letter-spacing: -0.5px;
    }

    .role-badge {
      display: inline-block;
      padding: 0.5rem 1.25rem;
      border-radius: 50px;
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }

    .student { background: #eff6ff; color: #3b82f6; border: 1px solid #dbeafe; }
    .professor { background: #fff7ed; color: #f97316; border: 1px solid #ffedd5; }
    .manager { background: #fbfbfe; color: #8b5cf6; border: 1px solid #e9d5ff; }

    .profile-body {
      max-width: 700px;
      margin: 0 auto;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .info-card {
      background: #f8fafc;
      padding: 1.5rem;
      border-radius: 16px;
      display: flex;
      align-items: flex-start;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      border: 1px solid transparent;
    }

    .info-card:hover {
      background: white;
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.05);
      border-color: #e2e8f0;
    }

    .info-card.full-width {
      grid-column: 1 / -1;
    }

    .info-icon {
      width: 48px;
      height: 48px;
      background: white;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      margin-right: 1rem;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
      flex-shrink: 0;
    }

    .info-content {
      flex: 1;
    }

    .info-content label {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 0.25rem;
      letter-spacing: 0.5px;
    }

    .info-content .value {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-main);
      word-break: break-word;
    }
    
    .form-input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        margin-bottom: 0.5rem;
        font-size: 1rem;
    }

    .value.highlight {
      color: var(--primary);
    }

    .upload-status, .error-message, .success-message {
      padding: 1rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .upload-status { background: #f0f9ff; color: #0284c7; }
    .error-message { background: #fef2f2; color: #dc2626; }
    .success-message { background: #f0fdf4; color: #16a34a; }

    .btn-edit {
        background: #f1f5f9;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        color: var(--text-main);
        transition: all 0.2s;
    }
    .btn-edit:hover { background: #e2e8f0; }

    .btn-save {
        background: var(--primary);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
    }
    .btn-save:hover { opacity: 0.9; }

    .btn-cancel {
        background: transparent;
        color: var(--text-muted);
        border: 1px solid #e2e8f0;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
    }
    .btn-cancel:hover { background: #f8fafc; }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid currentColor;
      border-bottom-color: transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 640px) {
      .profile-page { padding: 1rem; }
      .card-content { padding: 0 1.5rem 2rem; }
      .avatar-frame { width: 130px; height: 130px; }
      .profile-header { margin-top: -65px; }
      .info-grid { grid-template-columns: 1fr; }
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

  editMode = false;
  editData: any = {};

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
          localStorage.setItem('user', JSON.stringify(data));
          this.initEditData(data);
        },
        error: (err) => console.error('Error fetching profile:', err)
      });
  }

  initEditData(data: User) {
    this.editData = {
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth
    };
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
    if (this.editMode && this.user()) {
      this.initEditData(this.user()!);
    }
    this.errorMessage = '';
    this.successMessage = '';
  }

  saveProfile() {
    this.uploading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.put<User>(`${ApiConstants.baseUrl}/users/profile`, this.editData)
      .subscribe({
        next: (data) => {
          this.uploading = false;
          this.editMode = false;
          this.authService.currentUser.set(data);
          localStorage.setItem('user', JSON.stringify(data));
          this.translate.get('PROFILE.UPDATE_INFO_SUCCESS').subscribe(m => this.successMessage = m);
        },
        error: (err) => {
          this.uploading = false;
          this.translate.get('PROFILE.UPDATE_INFO_ERROR').subscribe(m => this.errorMessage = m);
          console.error(err);
        }
      });
  }

  formatDateForInput(date: string | Date | undefined): string {
    if (!date) return '';
    // If it's already a string in YYYY-MM-DD format
    if (typeof date === 'string' && date.includes('T')) {
      return date.split('T')[0];
    }
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date as string;
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
