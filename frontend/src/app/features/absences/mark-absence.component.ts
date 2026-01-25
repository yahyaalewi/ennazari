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
  selector: 'app-mark-absence',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="mark-absence-page">
      <div class="page-header">
        <h2>🕒 {{ 'ABSENCES.MARK_TITLE' | translate }}</h2>
        <button class="btn-back" (click)="goBack()">{{ 'ABSENCES.BACK_TO_ABSENCES' | translate }}</button>
      </div>

      <div class="form-card">
        <form (ngSubmit)="submitAbsence()">
          <div class="form-row">
            <div class="form-group">
              <label>{{ 'ABSENCES.SUBJECT_REQUIRED' | translate }}</label>
              <select [(ngModel)]="formData.subjectId" name="subject" required>
                <option value="">{{ 'ABSENCES.SELECT_SUBJECT' | translate }}</option>
                <option *ngFor="let subject of availableSubjects" [value]="subject._id">
                  {{ subject.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>{{ 'ABSENCES.CLASS_REQUIRED' | translate }}</label>
              <select [(ngModel)]="formData.classId" name="class" required (change)="onClassChange()">
                <option value="">{{ 'ABSENCES.SELECT_CLASS' | translate }}</option>
                <option *ngFor="let class of classes" [value]="class._id">
                  {{ class.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>{{ 'ABSENCES.STUDENT_REQUIRED' | translate }}</label>
            <select [(ngModel)]="formData.studentId" name="student" required [disabled]="!formData.classId">
              <option value="">{{ formData.classId ? ('ABSENCES.SELECT_STUDENT' | translate) : ('ABSENCES.SELECT_CLASS_FIRST' | translate) }}</option>
              <option *ngFor="let student of students" [value]="student._id">
                {{ student.firstName }} {{ student.lastName }}
              </option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>{{ 'ABSENCES.DATE_REQUIRED' | translate }}</label>
              <input type="date" [(ngModel)]="formData.date" name="date" required>
            </div>

            <div class="form-group">
              <label>{{ 'ABSENCES.DURATION_REQUIRED' | translate }}</label>
              <input type="number" [(ngModel)]="formData.durationHours" name="duration" 
                     min="1" max="8" step="1" required>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="goBack()">{{ 'COMMON.CANCEL' | translate }}</button>
            <button type="submit" class="btn-primary" [disabled]="loading">
              {{ (loading ? 'ABSENCES.SAVING' : 'ABSENCES.MARK_ABSENCE') | translate }}
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
    .mark-absence-page {
      max-width: 800px;
      margin: 0 auto;
      animation: fadeIn 0.4s ease-out;
    }

    [dir="rtl"] .btn-back { order: 2; }
    [dir="rtl"] .form-card { text-align: right; }

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

    .form-group input:disabled,
    .form-group select:disabled {
      background: #f8fafc;
      cursor: not-allowed;
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

    @media (max-width: 768px) {
      .form-group input,
      .form-group select {
        padding: 1rem;
        font-size: 1.1rem;
        height: 50px;
        background-color: #fff;
      }

      .form-row {
        flex-direction: column;
        gap: 0;
      }
      
      .btn-primary, .btn-secondary {
        width: 100%;
        padding: 1rem;
        font-size: 1.1rem;
      }

      .form-actions {
        flex-direction: column-reverse;
      }
    }
  `]
})
export class MarkAbsenceComponent implements OnInit {
  classes: Class[] = [];
  subjects: Subject[] = [];
  availableSubjects: Subject[] = [];
  students: User[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  currentUser: User | null = null;

  private translate = inject(TranslateService);
  private toastService = inject(ToastService);

  formData = {
    subjectId: '',
    classId: '',
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    durationHours: 1
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
          } else {
            this.availableSubjects = data;
          }
        },
        error: (err) => console.error(err)
      });
  }

  onClassChange() {
    if (this.formData.classId) {
      this.loadStudents();
    }
    this.formData.studentId = '';
  }

  loadStudents() {
    this.http.get<User[]>(`${ApiConstants.baseUrl}${ApiConstants.classes}/${this.formData.classId}/students`)
      .subscribe({
        next: (data) => this.students = data,
        error: (err) => console.error(err)
      });
  }

  submitAbsence() {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.post(ApiConstants.baseUrl + ApiConstants.absences, this.formData)
      .subscribe({
        next: () => {
          this.translate.get('ABSENCES.MARK_SUCCESS').subscribe(msg => {
            this.toastService.success(msg);
            this.successMessage = msg;
          });
          this.loading = false;
          setTimeout(() => this.goBack(), 1500);
        },
        error: (err) => {
          this.translate.get('ABSENCES.MARK_ERROR').subscribe(msg => {
            const errorMsg = err.error?.message || msg;
            this.toastService.error(errorMsg);
            this.errorMessage = errorMsg;
          });
          this.loading = false;
        }
      });
  }

  goBack() {
    this.router.navigate(['/dashboard/absences']);
  }
}
