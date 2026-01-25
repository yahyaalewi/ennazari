import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ApiConstants } from '../../core/constants/api.constants';
import { User, Class, Subject } from '../../core/models/models';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmationService } from '../../core/services/confirmation.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="users-page">
      <div class="page-header">
        <div>
          <h2>👥 {{ 'USERS.TITLE' | translate }}</h2>
          <p class="subtitle">{{ 'USERS.SUBTITLE' | translate }}</p>
        </div>
        <div class="header-actions">
          <!-- Search Bar -->
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input type="text" [placeholder]="'COMMON.SEARCH' | translate" 
                   [(ngModel)]="searchQuery" (input)="filterUsers()"
                   class="search-input">
          </div>
          
          <button class="btn-add" (click)="showCreateForm = true">
            <span class="icon">➕</span> {{ 'USERS.ADD_USER' | translate }}
          </button>
        </div>
      </div>

      <!-- Create/Edit Form Modal -->
      <div class="modal" *ngIf="showCreateForm" (click)="closeModal($event)">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ (editingUser ? 'USERS.EDIT_USER' : 'USERS.CREATE_USER') | translate }}</h3>
            <button class="close-btn" (click)="closeModal($event)">✕</button>
          </div>

          <form (ngSubmit)="saveUser()" class="user-form">
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'USERS.FIRST_NAME' | translate }} *</label>
                <input type="text" [(ngModel)]="formData.firstName" name="firstName" required>
              </div>
              <div class="form-group">
                <label>{{ 'USERS.LAST_NAME' | translate }} *</label>
                <input type="text" [(ngModel)]="formData.lastName" name="lastName" required>
              </div>
            </div>

            <div class="form-group">
              <label>{{ 'USERS.EMAIL' | translate }} *</label>
              <input type="email" [(ngModel)]="formData.email" name="email" required>
            </div>

            <div class="form-group" *ngIf="!editingUser">
              <label>{{ 'USERS.PASSWORD' | translate }} *</label>
              <input type="password" [(ngModel)]="formData.password" name="password" required>
            </div>

            <div class="form-group">
              <label>{{ 'USERS.ROLE' | translate }} *</label>
              <select [(ngModel)]="formData.role" name="role" required (change)="onRoleChange()">
                <option value="">{{ 'USERS.SELECT_ROLE' | translate }}</option>
                <option value="student">{{ 'USERS.STUDENT' | translate }}</option>
                <option value="professor">{{ 'USERS.PROFESSOR' | translate }}</option>
              </select>
            </div>

            <!-- Student specific fields -->
            <div class="form-group" *ngIf="formData.role === 'student'">
              <label>{{ 'USERS.CLASS' | translate }}</label>
              <select [(ngModel)]="formData.classId" name="classId">
                <option value="">{{ 'USERS.SELECT_CLASS' | translate }}</option>
                <option *ngFor="let class of classes" [value]="class._id">{{ class.name }}</option>
              </select>
            </div>

            <!-- Professor specific fields -->
            <div class="form-group" *ngIf="formData.role === 'professor'">
              <label>{{ 'USERS.SUBJECTS' | translate }}</label>
              <div class="checkbox-group">
                <label *ngFor="let subject of subjects" class="checkbox-label">
                  <input type="checkbox" [value]="subject._id" 
                         [checked]="isSubjectSelected(subject._id)"
                         (change)="toggleSubject(subject._id)">
                  {{ subject.name }}
                </label>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn-secondary" (click)="closeModal($event)">{{ 'COMMON.CANCEL' | translate }}</button>
              <button type="submit" class="btn-primary" [disabled]="loading">
                {{ (loading ? 'USERS.SAVING' : 'USERS.SAVE_USER') | translate }}
              </button>
            </div>

            <div class="error-message" *ngIf="errorMessage">
              ⚠️ {{ errorMessage }}
            </div>
          </form>
        </div>
      </div>

      <!-- Professors Section -->
      <div class="section-container" *ngIf="!loading && professors.length > 0">
        <div class="section-header">
          <h3>👨‍🏫 {{ 'USERS.PROFESSORS' | translate }} ({{ professors.length }})</h3>
        </div>
        <div class="users-grid">
          <div class="user-card" *ngFor="let user of professors">
            <div class="user-header">
              <img *ngIf="user.profilePicture" [src]="getProfilePicture(user.profilePicture)" class="user-avatar-img shadow-sm">
              <div *ngIf="!user.profilePicture" class="user-avatar shadow-sm">{{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}</div>
              <div class="user-info">
                <h3>{{ user.firstName }} {{ user.lastName }}</h3>
                <p class="email">{{ user.email }}</p>
              </div>
              <span class="role-badge role-professor">{{ 'USERS.PROFESSOR' | translate }}</span>
            </div>
            <div class="user-details">
              <span class="detail-item">
                <span class="icon">📚</span> {{ 'USERS.SUBJECTS' | translate }}: {{ user.subjects?.length || 0 }}
              </span>
            </div>
            <div class="user-actions">
              <button class="btn-edit" (click)="editUser(user)">✏️ {{ 'COMMON.EDIT' | translate }}</button>
              <button class="btn-delete" (click)="deleteUser(user._id)">🗑️ {{ 'COMMON.DELETE' | translate }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Students Section Grouped by Class -->
      <div class="section-container" *ngIf="!loading && groupedStudents.length > 0">
        <div class="section-header">
          <h3>🎓 {{ 'USERS.STUDENTS_BY_CLASS' | translate }}</h3>
        </div>
        
        <div *ngFor="let group of groupedStudents" class="class-group">
          <div class="class-title">
            <h4>{{ group.className }}</h4>
            <span class="count">{{ 'USERS.COUNT_STUDENTS' | translate:{count: group.users.length} }}</span>
          </div>

          <div class="users-grid">
            <div class="user-card" *ngFor="let user of group.users">
              <div class="user-header">
                <img *ngIf="user.profilePicture" [src]="getProfilePicture(user.profilePicture)" class="user-avatar-img shadow-sm">
                <div *ngIf="!user.profilePicture" class="user-avatar shadow-sm">{{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}</div>
                <div class="user-info">
                  <h3>{{ user.firstName }} {{ user.lastName }}</h3>
                  <p class="email">{{ user.email }}</p>
                </div>
                <span *ngIf="user.isLocked" class="locked-badge" title="{{ 'USERS.LOCKED' | translate }}">🔒</span>
                <span class="role-badge role-student">{{ 'USERS.STUDENT' | translate }}</span>
              </div>
              <div class="user-actions">
                <button *ngIf="user.isLocked" class="btn-unlock" (click)="unlockUser(user)" title="{{ 'USERS.UNLOCK' | translate }}">
                  🔓 {{ 'USERS.UNLOCK' | translate }}
                </button>
                <button class="btn-edit" (click)="editUser(user)">✏️ {{ 'COMMON.EDIT' | translate }}</button>
                <button class="btn-delete" (click)="deleteUser(user._id)">🗑️ {{ 'COMMON.DELETE' | translate }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ 'USERS.LOADING' | translate }}</p>
      </div>
    </div>
  `,
  styles: [`
    .users-page {
      animation: fadeIn 0.4s ease-out;
    }

    [dir="rtl"] .btn-add .icon { order: 2; }
    [dir="rtl"] .modal-header h3 { order: 2; }
    [dir="rtl"] .class-group { border-left: none; border-right: 4px solid var(--primary); padding-left: 0; padding-right: 1.5rem; }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .search-bar {
      position: relative;
      display: flex;
      align-items: center;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 50px; /* Pillow shape */
      padding: 0.5rem 1rem;
      transition: all 0.3s ease;
      box-shadow: var(--shadow-sm);
    }

    .search-bar:focus-within {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
      transform: translateY(-1px);
    }

    .search-icon {
      margin-right: 0.75rem;
      color: var(--text-muted);
      font-size: 1.1rem;
      opacity: 1; /* Reset opacity */
      padding: 0; /* Reset padding */
    }

    /* RTL */
    [dir="rtl"] .search-icon {
      margin-right: 0;
      margin-left: 0.75rem;
      padding: 0;
    }

    .search-input {
      border: none;
      background: transparent;
      padding: 0;
      width: 200px;
      outline: none;
      font-size: 0.95rem;
      color: var(--text-main);
    }
    
    .search-input:focus {
      width: 250px; /* Expand on focus */
    }

    /* Mobile Responsive Search */
    @media (max-width: 600px) {
      .header-actions {
        width: 100%;
        flex-direction: column;
        align-items: stretch;
      }
      .search-bar {
        width: 100%;
      }
      .search-input {
        width: 100%;
      }
      .search-input:focus {
        width: 100%;
      }
      .btn-add {
        justify-content: center;
      }
    }

    h2 {
      font-size: 2rem;
      color: var(--text-main);
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: var(--text-muted);
      font-size: 1rem;
    }

    .btn-add {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      font-weight: 600;
      transition: var(--transition);
      box-shadow: var(--shadow-sm);
      cursor: pointer;
    }

    .btn-add:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    /* Modal */
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease-out;
    }

    .modal-content {
      background: white;
      border-radius: var(--radius-lg);
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: var(--shadow-lg);
      animation: slideUp 0.3s ease-out;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .modal-header h3 {
      margin: 0;
      color: var(--text-main);
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-muted);
      padding: 0.25rem;
      line-height: 1;
    }

    .close-btn:hover {
      color: var(--text-main);
    }

    /* Form */
    .user-form {
      padding: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--text-main);
      font-size: 0.9rem;
    }

    .form-group input,
    .form-group select {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #f1f5f9;
      border-radius: var(--radius-md);
      font-size: 1rem;
      font-family: inherit;
      transition: var(--transition);
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: var(--transition);
    }

    .checkbox-label:hover {
      background: #f8fafc;
    }

    .checkbox-label input[type="checkbox"] {
      width: auto;
      cursor: pointer;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #f1f5f9;
    }

    .btn-primary, .btn-secondary {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: var(--radius-md);
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
    }

    .btn-primary {
      background: var(--primary);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--primary-dark);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: var(--text-main);
    }

    .btn-secondary:hover {
      background: #e2e8f0;
    }

    .error-message {
      margin-top: 1rem;
      padding: 0.75rem;
      background: #fef2f2;
      border-left: 4px solid var(--danger);
      color: #991b1b;
      border-radius: 6px;
      font-size: 0.9rem;
    }

    .section-container {
      margin-bottom: 3rem;
    }

    .section-header {
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #e2e8f0;
    }

    .section-header h3 {
      font-size: 1.5rem;
      color: var(--text-main);
      font-weight: 700;
    }

    .class-group {
      margin-bottom: 2.5rem;
      padding-left: 1.5rem;
      border-left: 4px solid var(--primary);
    }

    .class-title {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .class-title h4 {
      font-size: 1.25rem;
      color: var(--text-main);
      margin: 0;
      font-weight: 600;
    }

    .class-title .count {
      background: #f1f5f9;
      color: var(--text-muted);
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    /* Users Grid */
    .users-grid {
      display: grid;
      gap: 1rem;
    }

    .user-card {
      background: white;
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
      transition: var(--transition);
    }

    .user-card:hover {
      box-shadow: var(--shadow-md);
    }

    .user-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .user-avatar {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 1.1rem;
      box-shadow: var(--shadow-sm);
    }

    .user-avatar-img {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      object-fit: cover;
      border: 2px solid white;
      box-shadow: var(--shadow-sm);
    }

    .user-info {
      flex: 1;
    }

    .user-info h3 {
      margin: 0 0 0.25rem 0;
      color: var(--text-main);
      font-size: 1.1rem;
    }

    .email {
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .role-badge {
      padding: 0.35rem 0.85rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: capitalize;
    }

    .role-student {
      background: #dbeafe;
      color: #1e40af;
    }

    .role-professor {
      background: #fef3c7;
      color: #92400e;
    }

    .role-manager {
      background: #f3e8ff;
      color: #6b21a8;
    }

    .user-details {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: var(--radius-sm);
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    .locked-badge {
      font-size: 1.2rem;
      margin-right: 0.5rem;
      cursor: help;
    }

    [dir="rtl"] .locked-badge {
      margin-right: 0;
      margin-left: 0.5rem;
    }

    .btn-unlock {
      padding: 0.6rem 1rem;
      border: none;
      border-radius: var(--radius-md);
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      font-size: 0.9rem;
      background: #fef9c3;
      color: #854d0e;
      border: 1px solid #fde047;
    }

    .btn-unlock:hover {
      background: #fde047;
    }

    .user-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn-edit, .btn-delete {
      flex: 1;
      padding: 0.6rem 1rem;
      border: none;
      border-radius: var(--radius-md);
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      font-size: 0.9rem;
    }

    .btn-edit {
      background: #f1f5f9;
      color: var(--text-main);
    }

    .btn-edit:hover {
      background: #e2e8f0;
    }

    .btn-delete {
      background: #fef2f2;
      color: var(--danger);
    }

    .btn-delete:hover {
      background: #fee2e2;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      color: var(--text-muted);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--bg-body);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  allUsers: User[] = []; // Backup for filtering
  professors: User[] = [];
  groupedStudents: { className: string, users: User[] }[] = [];
  classes: Class[] = [];
  subjects: Subject[] = [];
  loading = true;
  showCreateForm = false;
  editingUser: User | null = null;
  errorMessage = '';
  searchQuery = '';

  formData = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: '',
    classId: '',
    subjects: [] as string[]
  };

  private translate = inject(TranslateService);
  private toastService = inject(ToastService);
  private confirmation = inject(ConfirmationService);

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.loadUsers();
    this.loadClasses();
    this.loadSubjects();
  }

  loadUsers() {
    this.http.get<User[]>(ApiConstants.baseUrl + ApiConstants.users)
      .subscribe({
        next: (data) => {
          this.allUsers = data.filter(u => u.role !== 'manager');
          this.filterUsers(); // Initial group
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
  }

  filterUsers() {
    const query = this.searchQuery.toLowerCase().trim();

    if (!query) {
      this.users = [...this.allUsers];
    } else {
      this.users = this.allUsers.filter(user => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const role = user.role.toLowerCase();

        let className = '';
        if (user.role === 'student' && user.classId && typeof user.classId === 'object') {
          className = (user.classId as Class).name.toLowerCase();
        }

        return fullName.includes(query) || role.includes(query) || className.includes(query);
      });
    }

    this.groupUsers();
  }

  loadClasses() {
    this.http.get<Class[]>(ApiConstants.baseUrl + ApiConstants.classes)
      .subscribe({
        next: (data) => {
          // Sort classes by ordinal numbers (1ère, 2ème, 3ème, etc.)
          this.classes = data.sort((a, b) => {
            const getOrder = (name: string): number => {
              const ordinalMatch = name.match(/(\d+)(ère|ème|e)/i);
              if (ordinalMatch) {
                return parseInt(ordinalMatch[1]);
              }
              const match = name.match(/(\d+)/);
              return match ? parseInt(match[1]) : 999;
            };
            return getOrder(a.name) - getOrder(b.name);
          });
          if (this.users.length > 0) this.groupUsers();
        },
        error: (err) => console.error(err)
      });
  }

  loadSubjects() {
    this.http.get<Subject[]>(ApiConstants.baseUrl + ApiConstants.subjects)
      .subscribe({
        next: (data) => this.subjects = data,
        error: (err) => console.error(err)
      });
  }

  onRoleChange() {
    this.formData.classId = '';
    this.formData.subjects = [];
  }

  isSubjectSelected(subjectId: string): boolean {
    return this.formData.subjects.includes(subjectId);
  }

  toggleSubject(subjectId: string) {
    const index = this.formData.subjects.indexOf(subjectId);
    if (index > -1) {
      this.formData.subjects.splice(index, 1);
    } else {
      this.formData.subjects.push(subjectId);
    }
  }

  saveUser() {
    this.loading = true;
    this.errorMessage = '';

    const payload: any = {
      firstName: this.formData.firstName,
      lastName: this.formData.lastName,
      email: this.formData.email,
      role: this.formData.role
    };

    if (!this.editingUser) {
      payload.password = this.formData.password;
    }

    if (this.formData.role === 'student' && this.formData.classId) {
      payload.classId = this.formData.classId;
    }

    if (this.formData.role === 'professor' && this.formData.subjects.length > 0) {
      payload.subjects = this.formData.subjects;
    }

    const request = this.editingUser
      ? this.http.put(`${ApiConstants.baseUrl}${ApiConstants.users}/${this.editingUser._id}`, payload)
      : this.http.post(ApiConstants.baseUrl + ApiConstants.users, payload);

    request.subscribe({
      next: () => {
        const msgKey = this.editingUser ? 'USERS.UPDATE_SUCCESS' : 'USERS.CREATE_SUCCESS';
        this.translate.get(msgKey).subscribe(msg => {
          this.toastService.success(msg || 'Utilisateur enregistré avec succès');
        });
        this.loadUsers();
        this.closeModal(new Event('click'));
        this.loading = false;
      },
      error: (err) => {
        this.translate.get('USERS.SAVE_ERROR').subscribe(msg => {
          const errorMsg = err.error?.message || msg;
          this.toastService.error(errorMsg);
          this.errorMessage = errorMsg;
        });
        this.loading = false;
      }
    });
  }

  editUser(user: User) {
    this.editingUser = user;
    this.formData = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      role: user.role,
      classId: user.classId || '',
      subjects: user.subjects || []
    };
    this.showCreateForm = true;
  }

  deleteUser(userId: string) {
    this.translate.get(['USERS.DELETE_CONFIRM', 'COMMON.DELETE']).subscribe(msgs => {
      this.confirmation.confirm(msgs['COMMON.DELETE'], msgs['USERS.DELETE_CONFIRM'])
        .then(confirmed => {
          if (confirmed) {
            this.http.delete(`${ApiConstants.baseUrl}${ApiConstants.users}/${userId}`)
              .subscribe({
                next: () => {
                  this.translate.get('USERS.DELETE_SUCCESS').subscribe(msg => {
                    this.toastService.success(msg || 'Utilisateur supprimé avec succès');
                  });
                  this.loadUsers();
                },
                error: (err: any) => {
                  this.toastService.error(err.error?.message || 'Erreur lors de la suppression');
                  console.error(err);
                }
              });
          }
        });
    });
  }

  unlockUser(user: User) {
    this.translate.get(['USERS.UNLOCK_CONFIRM', 'USERS.UNLOCK']).subscribe(msgs => {
      this.confirmation.confirm(msgs['USERS.UNLOCK'], msgs['USERS.UNLOCK_CONFIRM'] || 'Voulez-vous débloquer cet utilisateur ?')
        .then(confirmed => {
          if (confirmed) {
            this.http.put(`${ApiConstants.baseUrl}${ApiConstants.users}/${user._id}/unlock`, {})
              .subscribe({
                next: (res: any) => {
                  user.isLocked = false;
                  // Update backup list too if needed
                  const u = this.allUsers.find(au => au._id === user._id);
                  if (u) u.isLocked = false;

                  this.translate.get('USERS.UNLOCK_SUCCESS').subscribe(msg => {
                    this.toastService.success(msg || 'Compte débloqué avec succès');
                  });
                },
                error: (err) => {
                  this.translate.get('USERS.UNLOCK_ERROR').subscribe(msg => {
                    this.toastService.error(err.error?.message || msg || 'Erreur lors du déblocage');
                  });
                }
              });
          }
        });
    });
  }

  closeModal(event: Event) {
    event.preventDefault();
    this.showCreateForm = false;
    this.editingUser = null;
    this.errorMessage = '';
    this.formData = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: '',
      classId: '',
      subjects: []
    };
  }

  getClassName(classId?: any): string {
    const na = this.getTranslation('COMMON.NA');
    if (!classId) return na;
    if (typeof classId === 'object') return classId.name || na;
    const cls = this.classes.find(c => c._id === classId);
    return cls?.name || na;
  }

  private getTranslation(key: string): string {
    let val = '';
    this.translate.get(key).subscribe((v: any) => val = v);
    return val;
  }

  groupUsers() {
    this.professors = this.users.filter(u => u.role === 'professor');
    const students = this.users.filter(u => u.role === 'student');

    const groups = new Map<string, User[]>();
    students.forEach(student => {
      const className = this.getClassName(student.classId);
      if (!groups.has(className)) {
        groups.set(className, []);
      }
      groups.get(className)?.push(student);
    });

    const getClassOrder = (className: string): number => {
      const match = className.match(/(\d+)/);
      return match ? parseInt(match[1]) : 999;
    };

    this.groupedStudents = Array.from(groups.entries())
      .map(([className, users]) => ({ className, users }))
      .sort((a, b) => getClassOrder(a.className) - getClassOrder(b.className));
  }

  getProfilePicture(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = ApiConstants.baseUrl.replace('/api', '');
    return `${baseUrl}${path}`;
  }
}
