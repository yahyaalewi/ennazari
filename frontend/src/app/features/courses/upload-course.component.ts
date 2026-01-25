import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ApiConstants } from '../../core/constants/api.constants';
import { User, Class, Subject } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-upload-course',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="upload-course-page">
      <div class="page-header">
        <h2>📤 {{ 'COURSES.UPLOAD_TITLE' | translate }}</h2>
        <button class="btn-back" (click)="goBack()">{{ 'COURSES.BACK_TO_COURSES' | translate }}</button>
      </div>

      <div class="form-card">
        <form (ngSubmit)="submitCourse()">
          <div class="form-group">
            <label>{{ 'COURSES.TITLE_REQUIRED' | translate }}</label>
            <input type="text" [(ngModel)]="formData.title" name="title" 
                   [placeholder]="'COURSES.TITLE_PLACEHOLDER' | translate" required>
          </div>

          <div class="form-group">
            <label>{{ 'COURSES.DESCRIPTION_REQUIRED' | translate }}</label>
            <textarea [(ngModel)]="formData.description" name="description" rows="3"
                      [placeholder]="'COURSES.DESCRIPTION_PLACEHOLDER' | translate" required></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>{{ 'COURSES.SUBJECT_REQUIRED' | translate }}</label>
              <select [(ngModel)]="formData.subjectId" name="subject" required>
                <option value="">{{ 'COURSES.SELECT_SUBJECT' | translate }}</option>
                <option *ngFor="let subject of availableSubjects" [value]="subject._id">
                  {{ subject.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>{{ 'COURSES.CLASS_REQUIRED' | translate }}</label>
              <select [(ngModel)]="formData.classId" name="class" required>
                <option value="">{{ 'COURSES.SELECT_CLASS' | translate }}</option>
                <option *ngFor="let class of classes" [value]="class._id">
                  {{ class.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>{{ 'COURSES.PDF_FILE_REQUIRED' | translate }}</label>
            <div class="file-upload-area" [class.has-file]="selectedFile">
              <input type="file" id="fileInput" (change)="onFileSelected($event)" 
                     accept=".pdf" required hidden>
              <label for="fileInput" class="file-upload-label">
                <span class="icon">📎</span>
                <span *ngIf="!selectedFile">{{ 'COURSES.CLICK_TO_SELECT' | translate }}</span>
                <span *ngIf="selectedFile" class="file-name">{{ selectedFile.name }}</span>
              </label>
            </div>
            <small class="help-text">{{ 'COURSES.ONLY_PDF_ACCEPTED' | translate }}</small>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="goBack()">{{ 'COMMON.CANCEL' | translate }}</button>
            <button type="submit" class="btn-primary" [disabled]="loading || !selectedFile">
              {{ (loading ? 'COURSES.UPLOADING' : 'COURSES.UPLOAD_COURSE') | translate }}
            </button>
          </div>

          <div class="error-message" *ngIf="errorMessage">
            ⚠️ {{ errorMessage }}
          </div>
          <div class="success-message" *ngIf="successMessage">
            ✅ {{ successMessage }}
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .upload-course-page {
      max-width: 800px;
      margin: 0 auto;
      animation: fadeIn 0.4s ease-out;
    }

    [dir="rtl"] .btn-back { order: 2; }
    [dir="rtl"] .form-card { text-align: right; }
    [dir="rtl"] .file-upload-area { text-align: center; }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    h2 {
      font-size: 2rem;
      color: var(--text-main);
      margin: 0;
    }

    .btn-back {
      padding: 0.75rem 1.5rem;
      background: #f1f5f9;
      color: var(--text-main);
      border: none;
      border-radius: var(--radius-md);
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
    }

    .btn-back:hover {
      background: #e2e8f0;
    }

    .form-card {
      background: white;
      padding: 2rem;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--text-main);
      font-size: 0.9rem;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #f1f5f9;
      border-radius: var(--radius-md);
      font-size: 1rem;
      font-family: inherit;
      transition: var(--transition);
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .form-group textarea {
      resize: vertical;
      min-height: 80px;
    }

    .file-upload-area {
      border: 2px dashed #e2e8f0;
      border-radius: var(--radius-md);
      padding: 2rem;
      text-align: center;
      transition: var(--transition);
      cursor: pointer;
    }

    .file-upload-area:hover {
      border-color: var(--primary);
      background: #f8fafc;
    }

    .file-upload-area.has-file {
      border-color: var(--success);
      background: #f0fdf4;
    }

    .file-upload-label {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      color: var(--text-muted);
    }

    .file-upload-label .icon {
      font-size: 2rem;
    }

    .file-name {
      color: var(--text-main);
      font-weight: 600;
    }

    .help-text {
      display: block;
      margin-top: 0.5rem;
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
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

    .error-message, .success-message {
      margin-top: 1rem;
      padding: 0.75rem;
      border-radius: 6px;
      font-size: 0.9rem;
    }

    .error-message {
      background: #fef2f2;
      border-left: 4px solid var(--danger);
      color: #991b1b;
    }

    .success-message {
      background: #f0fdf4;
      border-left: 4px solid var(--success);
      color: #166534;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class UploadCourseComponent implements OnInit {
  classes: Class[] = [];
  subjects: Subject[] = [];
  availableSubjects: Subject[] = [];
  selectedFile: File | null = null;
  loading = false;
  errorMessage = '';
  successMessage = '';
  currentUser: User | null = null;

  private translate = inject(TranslateService);
  private toastService = inject(ToastService);

  formData = {
    title: '',
    description: '',
    subjectId: '',
    classId: ''
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {
    this.currentUser = this.authService.currentUser();
  }

  ngOnInit() {
    this.loadClasses();
    this.loadSubjects();
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
        },
        error: (err) => console.error(err)
      });
  }

  loadSubjects() {
    this.http.get<Subject[]>(ApiConstants.baseUrl + ApiConstants.subjects)
      .subscribe({
        next: (data) => {
          this.subjects = data;
          // Filter subjects based on professor's assignments
          if (this.currentUser?.role === 'professor') {
            const professorSubjectIds = this.currentUser?.subjects?.map((s: any) =>
              typeof s === 'string' ? s : s._id
            ) || [];

            this.availableSubjects = data.filter(subject =>
              professorSubjectIds.includes(subject._id)
            );

            console.log('Professor subjects:', professorSubjectIds);
            console.log('Available subjects:', this.availableSubjects);
          } else {
            this.availableSubjects = data;
          }
        },
        error: (err) => console.error(err)
      });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedFile = file;
      this.errorMessage = '';
    } else {
      this.translate.get('COURSES.VALID_PDF_ERROR').subscribe(msg => {
        this.errorMessage = msg;
      });
      this.selectedFile = null;
    }
  }

  submitCourse() {
    if (!this.selectedFile) {
      this.translate.get('COURSES.VALID_PDF_ERROR').subscribe(msg => {
        this.toastService.error(msg);
        this.errorMessage = msg;
      });
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('title', this.formData.title);
    formData.append('description', this.formData.description);
    formData.append('subjectId', this.formData.subjectId);
    formData.append('classId', this.formData.classId);

    this.http.post(ApiConstants.baseUrl + ApiConstants.courses, formData)
      .subscribe({
        next: () => {
          this.translate.get('COURSES.UPLOAD_SUCCESS').subscribe(msg => {
            this.toastService.success(msg);
            this.successMessage = msg;
          });
          this.loading = false;
          setTimeout(() => this.goBack(), 1500);
        },
        error: (err) => {
          this.translate.get('COURSES.UPLOAD_ERROR').subscribe(msg => {
            const errorMsg = err.error?.message || msg;
            this.toastService.error(errorMsg);
            this.errorMessage = errorMsg;
          });
          this.loading = false;
        }
      });
  }

  goBack() {
    this.router.navigate(['/dashboard/courses']);
  }
}
