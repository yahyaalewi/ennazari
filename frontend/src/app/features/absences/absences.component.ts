import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiConstants } from '../../core/constants/api.constants';
import { Absence, User } from '../../core/models/models';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmationService } from '../../core/services/confirmation.service';

@Component({
  selector: 'app-absences',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="absences-page">
      <div class="page-header">
        <div>
          <h2>🕒 {{ 'ABSENCES.TITLE' | translate }}</h2>
          <p class="subtitle" *ngIf="user?.role === 'student'">{{ 'ABSENCES.SUBTITLE' | translate }}</p>
        </div>
        <div class="header-actions">
          <button *ngIf="user?.role !== 'student'" class="btn-add" (click)="navigateToMarkAbsence()">
            <span class="icon">➕</span> {{ 'ABSENCES.MARK_ABSENCE' | translate }}
          </button>
          <div class="stats-summary" *ngIf="absences.length > 0">
            <div class="stat-card justified">
              <span class="stat-value">{{ getJustifiedCount() }}</span>
              <span class="stat-label">{{ 'JUSTIFIED' | translate }}</span>
            </div>
            <div class="stat-card unjustified">
              <span class="stat-value">{{ getUnjustifiedCount() }}</span>
              <span class="stat-label">{{ 'UNJUSTIFIED' | translate }}</span>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ 'LOADING' | translate }}</p>
      </div>

      <div *ngIf="!loading && absences.length === 0" class="empty-state">
        <div class="empty-icon">✅</div>
        <h3>{{ 'ABSENCES.EMPTY' | translate }}</h3>
        <p>{{ 'ABSENCES.EMPTY' | translate }}</p>
      </div>

      <!-- Justification Modal -->
      <div class="modal" *ngIf="showJustifyModal" (click)="closeJustifyModal($event)">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ 'ABSENCES.JUSTIFY_TITLE' | translate }}</h3>
            <button class="close-btn" (click)="closeJustifyModal($event)">✕</button>
          </div>

          <form (ngSubmit)="submitJustification()">
            <div class="modal-body">
              <div class="form-group">
                <label>{{ 'ABSENCES.JUSTIFY_LABEL' | translate }}</label>
                <textarea [(ngModel)]="justificationReason" name="reason" rows="4"
                          [placeholder]="'ABSENCES.JUSTIFY_PLACEHOLDER' | translate" required></textarea>
              </div>

              <div class="form-group">
                <label>{{ 'ABSENCES.DOCUMENT_LABEL' | translate }} ({{ 'COMMON.OPTIONAL' | translate }})</label>
                <input type="file" #fileInput (change)="onFileSelected($event)" 
                       accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" class="file-input">
                <div class="file-info" *ngIf="selectedFile">
                  📎 {{ selectedFile.name }} ({{ (selectedFile.size / 1024).toFixed(1) }} KB)
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="closeJustifyModal($event)">{{ 'COMMON.CANCEL' | translate }}</button>
              <button type="submit" class="btn-primary" [disabled]="loadingJustify">
                {{ (loadingJustify ? 'ABSENCES.SENDING' : 'ABSENCES.SEND') | translate }}
              </button>
            </div>

            <div class="error-message" *ngIf="errorMessage">
              ⚠️ {{ errorMessage }}
            </div>
          </form>
        </div>
      </div>

      <!-- Professor/Manager View: Grouped by class and student -->
      <div *ngIf="!loading && absences.length > 0 && user?.role !== 'student'">
        <div *ngFor="let classGroup of groupedAbsences" class="class-group">
          <div class="class-header">
            <h2>🎓 {{ classGroup.className }}</h2>
            <span class="total-count">{{ 'ABSENCES.COUNT_ABSENCES' | translate:{count: getTotalAbsencesInClass(classGroup)} }}</span>
          </div>

          <div *ngFor="let studentGroup of classGroup.students" class="student-group">
            <div class="student-header">
              <div class="student-info">
                <h3>👤 {{ studentGroup.studentName }}</h3>
                <span class="absence-badge-count">{{ 'ABSENCES.COUNT_ABSENCES' | translate:{count: studentGroup.absences.length} }}</span>
              </div>
              <div class="student-stat">
                <span class="unjustified-text">{{ getUnjustifiedCountForStudent(studentGroup.absences) }} {{ 'ABSENCES.UNJUSTIFIED' | translate }}</span>
              </div>
            </div>
            
            <div class="absences-grid">
              <div class="absence-card-compact" *ngFor="let absence of studentGroup.absences" 
                   [ngClass]="absence.justified ? 'justified' : 'unjustified'">
                <div class="absence-compact-header">
                  <span class="subject-name">{{ absence.subject?.name || ('COMMON.GENERAL' | translate) }}</span>
                  <span class="status-indicator-dot"></span>
                  <button *ngIf="user?.role === 'manager'" class="delete-absence-btn" (click)="deleteAbsence(absence._id)" title="{{ 'COMMON.DELETE' | translate }}">
                    🗑️
                  </button>
                </div>
                <div class="absence-compact-details">
                  <span class="date-text">{{ absence.date | date:'shortDate' }}</span>
                  <span class="duration-text">{{ absence.durationHours }}h</span>
                </div>
                <div class="justification-bubble" *ngIf="absence.justified && absence.justificationReason">
                  <span class="icon">💬</span>
                  <div class="reason-tooltip">{{ absence.justificationReason }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Student View: Simple list -->
      <div class="absences-list" *ngIf="!loading && absences.length > 0 && user?.role === 'student'">
        <div class="absence-card" *ngFor="let absence of absences" [ngClass]="getAbsenceStatusClass(absence)">
          <div class="status-indicator"></div>
          
          <div class="absence-content">
            <div class="absence-header">
              <h3>{{ absence.subject?.name || ('ABSENCES.GENERAL_ABSENCE' | translate) }}</h3>
              <span class="status-badge" [ngClass]="getStatusBadgeClass(absence)">
                {{ getStatusText(absence) | translate }}
              </span>
            </div>
            
            <div class="absence-details">
              <span class="detail-item">
                <span class="icon">📅</span>
                {{ absence.date | date:'fullDate' }}
              </span>
              <span class="detail-item">
                <span class="icon">⏱️</span>
                {{ absence.durationHours }}h
              </span>
            </div>

            <div class="absence-reason" *ngIf="absence.justificationReason">
              <strong>{{ 'ABSENCES.REASON' | translate }}:</strong> {{ absence.justificationReason }}
            </div>

            <div class="absence-reason warning" *ngIf="absence.justificationStatus === 'rejected' && absence.justificationReviewComment">
              <strong>{{ 'ABSENCES.REJECTION_REASON' | translate }}:</strong> {{ absence.justificationReviewComment }}
            </div>

            <div class="absence-actions" *ngIf="canJustify(absence)">
              <button class="btn-justify" (click)="openJustifyModal(absence)">
                📝 {{ 'ABSENCES.JUSTIFY_ACTION' | translate }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .absences-page {
      animation: fadeIn 0.4s ease-out;
    }

    [dir="rtl"] .btn-add .icon { order: 2; }
    [dir="rtl"] .class-header h2 { order: 2; }
    [dir="rtl"] .student-info h3 { order: 2; }
    [dir="rtl"] .absence-card { border-left: none; border-right: none; }
    [dir="rtl"] .status-indicator { order: 2; width: 5px; }
    [dir="rtl"] .absence-card-compact { border-left: none; border-right: 3px solid var(--success); }
    [dir="rtl"] .absence-card-compact.unjustified { border-right-color: var(--warning); }
    [dir="rtl"] .reason-tooltip { left: auto; right: 50%; margin-left: 0; margin-right: -100px; }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .btn-add {
      padding: 0.75rem 1.5rem;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      box-shadow: var(--shadow-sm);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-add:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
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

    .stats-summary {
      display: flex;
      gap: 1rem;
    }

    .stat-card {
      background: white;
      padding: 1rem 1.5rem;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 100px;
    }

    .stat-card.justified {
      border-top: 3px solid var(--success);
    }

    .stat-card.unjustified {
      border-top: 3px solid var(--warning);
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
    }

    .stat-card.justified .stat-value {
      color: var(--success);
    }

    .stat-card.unjustified .stat-value {
      color: var(--warning);
    }

    .stat-label {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    /* Loading & Empty States */
    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--bg-body);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    /* Absences List */
    .absences-list {
      display: grid;
      gap: 1rem;
    }

    .absence-card {
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
      transition: var(--transition);
      display: flex;
      position: relative;
    }

    .absence-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateX(4px);
    }

    .status-indicator {
      width: 5px;
      background: var(--success);
    }

    .absence-card.unjustified .status-indicator {
      background: var(--warning);
    }

    .absence-content {
      flex: 1;
      padding: 1.25rem 1.5rem;
    }

    .absence-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .absence-header h3 {
      font-size: 1.1rem;
      color: var(--text-main);
      margin: 0;
    }

    .status-badge {
      padding: 0.35rem 0.85rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .badge-success {
      background: #d1fae5;
      color: #065f46;
    }

    .badge-warning {
      background: #fef3c7;
      color: #92400e;
    }

    .absence-details {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    .absence-reason {
      margin-top: 1rem;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      color: var(--text-main);
    }

    .absence-actions {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #f1f5f9;
    }

    .btn-justify {
      padding: 0.6rem 1.25rem;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      font-size: 0.9rem;
    }

    .btn-justify:hover {
      background: var(--primary-dark);
      transform: translateY(-2px);
    }

    /* Grouped View Styles */
    .class-group {
      margin-bottom: 3rem;
      padding: 1.5rem;
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
    }

    .class-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 4px solid #f59e0b;
    }

    .class-header h2 {
      font-size: 1.75rem;
      color: var(--text-main);
      margin: 0;
      font-weight: 700;
    }

    .total-count {
      background: #f59e0b;
      color: white;
      padding: 0.5rem 1.25rem;
      border-radius: 25px;
      font-size: 0.9rem;
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
    }

    .student-group {
      margin-bottom: 2rem;
      padding: 1rem;
      background: #fdfbf7;
      border-radius: var(--radius-md);
      border: 1px solid #fef3c7;
    }

    .student-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #fef3c7;
    }

    .student-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .student-info h3 {
      font-size: 1.1rem;
      color: var(--text-main);
      margin: 0;
      font-weight: 600;
    }

    .absence-badge-count {
      background: white;
      color: var(--text-muted);
      padding: 0.25rem 0.75rem;
      border-radius: 15px;
      font-size: 0.8rem;
      font-weight: 600;
      border: 1px solid #e2e8f0;
    }

    .unjustified-text {
      color: #b45309;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .absences-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.75rem;
    }

    .absence-card-compact {
      background: white;
      border-radius: var(--radius-md);
      padding: 0.75rem;
      box-shadow: var(--shadow-sm);
      position: relative;
      border-left: 3px solid var(--success);
      transition: var(--transition);
    }

    .absence-card-compact.unjustified {
      border-left-color: var(--warning);
    }

    .delete-absence-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 50%;
      transition: var(--transition);
      opacity: 0;
      z-index: 10;
    }

    .absence-card-compact:hover .delete-absence-btn {
      opacity: 1;
    }

    .delete-absence-btn:hover {
      background: #fee2e2;
      transform: scale(1.1);
    }

    .absence-compact-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .subject-name {
      font-weight: 700;
      font-size: 0.85rem;
      color: var(--text-main);
      flex: 1; /* Take available space */
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .delete-absence-btn {
      background: none;
      border: none;
      font-size: 1.1rem;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 50%;
      transition: var(--transition);
      opacity: 0;
      position: relative !important;
      margin-left: 0.5rem;
    }

    [dir="rtl"] .delete-absence-btn {
        margin-left: 0;
        margin-right: 0.5rem;
    }

    .absence-card-compact:hover .delete-absence-btn {
      opacity: 1;
    }
    
    .delete-absence-btn:hover {
      background: rgba(239, 68, 68, 0.1); /* Red tint */
      transform: scale(1.1);
    }

    .status-indicator-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--success);
      flex-shrink: 0; /* Prevent shrinking */
    }

    .unjustified .status-indicator-dot {
      background: var(--warning);
    }

    .absence-compact-details {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .justification-bubble {
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: var(--primary);
      cursor: help;
      position: relative;
    }

    .reason-tooltip {
      visibility: hidden;
      width: 200px;
      background-color: #334155;
      color: #fff;
      text-align: center;
      border-radius: 6px;
      padding: 8px;
      position: absolute;
      z-index: 10;
      bottom: 125%;
      left: 50%;
      margin-left: -100px;
      opacity: 0;
      transition: opacity 0.3s;
      font-size: 0.75rem;
      box-shadow: var(--shadow-lg);
    }

    .justification-bubble:hover .reason-tooltip {
      visibility: visible;
      opacity: 1;
    }

    .reason-tooltip::after {
      content: "";
      position: absolute;
      top: 100%;
      left: 50%;
      margin-left: -5px;
      border-width: 5px;
      border-style: solid;
      border-color: #334155 transparent transparent transparent;
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
      max-width: 500px;
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

    .modal-body {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--text-main);
      font-size: 0.9rem;
    }

    .form-group textarea {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #f1f5f9;
      border-radius: var(--radius-md);
      font-size: 1rem;
      font-family: inherit;
      resize: vertical;
      transition: var(--transition);
    }

    .form-group textarea:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .modal-footer {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      padding: 1.5rem;
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

    .file-input {
      width: 100%;
      padding: 0.75rem;
      border: 2px dashed #cbd5e1;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: var(--transition);
      font-size: 0.9rem;
    }

    .file-input:hover {
      border-color: var(--primary);
      background: #f8fafc;
    }

    .file-info {
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: #f0f9ff;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      color: var(--primary);
    }

    .badge-pending {
      background: #dbeafe;
      color: #1e40af;
    }

    .badge-rejected {
      background: #fee2e2;
      color: #991b1b;
    }

    .absence-card.pending .status-indicator {
      background: #3b82f6;
    }

    .absence-card.rejected .status-indicator {
      background: #ef4444;
    }

    .absence-reason.warning {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      color: #991b1b;
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .delete-absence-btn { opacity: 1; }
      
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
      .header-actions {
        width: 100%;
        flex-direction: column;
        align-items: stretch;
      }
      .stats-summary {
        display: grid;
        grid-template-columns: 1fr 1fr;
        width: 100%;
      }
      .stat-card {
        padding: 0.75rem;
        min-width: 0;
      }
      .stat-value { font-size: 1.25rem; }
      h2 { font-size: 1.5rem; }
      .absences-grid {
        grid-template-columns: 1fr;
      }
      .class-header h2 { font-size: 1.25rem; }
      .loading-state, .empty-state { padding: 2rem; }
      .absence-header h3 { font-size: 1rem; }
    }
  `]
})

export class AbsencesComponent implements OnInit {
  absences: Absence[] = [];
  groupedAbsences: {
    className: string;
    students: { studentName: string; absences: Absence[] }[];
  }[] = [];
  loading = false;
  user: User | null = null;
  showJustifyModal = false;
  selectedAbsence: Absence | null = null;
  justificationReason = '';
  selectedFile: File | null = null;
  loadingJustify = false;
  errorMessage = '';

  private translate = inject(TranslateService);
  private toastService = inject(ToastService);
  private confirmation = inject(ConfirmationService);

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {
    this.user = this.authService.currentUser();
  }

  ngOnInit() {
    this.loading = true;
    this.http.get<Absence[]>(ApiConstants.baseUrl + ApiConstants.absences)
      .subscribe({
        next: (data) => {
          this.absences = data;
          if (this.user?.role !== 'student') {
            this.groupAbsencesByClassAndStudent();
          }
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
  }

  getJustifiedCount(): number {
    return this.absences.filter(a => a.justified).length;
  }

  getUnjustifiedCount(): number {
    return this.absences.filter(a => !a.justified).length;
  }

  navigateToMarkAbsence() {
    this.router.navigate(['/dashboard/absences/mark']);
  }

  openJustifyModal(absence: Absence) {
    this.selectedAbsence = absence;
    this.justificationReason = '';
    this.selectedFile = null;
    this.errorMessage = '';
    this.showJustifyModal = true;
  }

  closeJustifyModal(event: Event) {
    event.preventDefault();
    this.showJustifyModal = false;
    this.selectedAbsence = null;
    this.justificationReason = '';
    this.selectedFile = null;
    this.errorMessage = '';
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        this.translate.get('ABSENCES.ERROR_FILE_TOO_LARGE').subscribe(msg => {
          this.errorMessage = msg;
        });
        return;
      }
      this.selectedFile = file;
      this.errorMessage = '';
    }
  }

  submitJustification() {
    if (!this.selectedAbsence || !this.justificationReason.trim()) {
      this.translate.get('ABSENCES.ERROR_REASON_REQUIRED').subscribe(msg => {
        this.errorMessage = msg;
      });
      return;
    }

    this.loadingJustify = true;
    this.errorMessage = '';

    const formData = new FormData();
    formData.append('justificationReason', this.justificationReason);
    if (this.selectedFile) {
      formData.append('document', this.selectedFile);
    }

    this.http.patch(
      `${ApiConstants.baseUrl}${ApiConstants.absences}/${this.selectedAbsence._id}/submit-justification`,
      formData
    ).subscribe({
      next: () => {
        this.ngOnInit();
        this.showJustifyModal = false;
        this.loadingJustify = false;
      },
      error: (err) => {
        this.translate.get('ABSENCES.ERROR_JUSTIFY').subscribe(msg => {
          this.errorMessage = err.error?.message || msg;
        });
        this.loadingJustify = false;
      }
    });
  }

  canJustify(absence: Absence): boolean {
    if (this.user?.role !== 'student') return false;
    // Can justify if not yet justified or if rejected
    return !absence.justified || absence.justificationStatus === 'rejected';
  }

  getAbsenceStatusClass(absence: Absence): string {
    if (absence.justificationStatus === 'pending') return 'pending';
    if (absence.justificationStatus === 'rejected') return 'rejected';
    if (absence.justified) return 'justified';
    return 'unjustified';
  }

  getStatusBadgeClass(absence: Absence): string {
    if (absence.justificationStatus === 'pending') return 'badge-pending';
    if (absence.justificationStatus === 'rejected') return 'badge-rejected';
    if (absence.justified) return 'badge-success';
    return 'badge-warning';
  }

  getStatusText(absence: Absence): string {
    if (absence.justificationStatus === 'pending') return 'ABSENCES.STATUS_PENDING';
    if (absence.justificationStatus === 'rejected') return 'ABSENCES.STATUS_REJECTED';
    if (absence.justified) return 'ABSENCES.JUSTIFIED';
    return 'ABSENCES.UNJUSTIFIED';
  }

  getUnjustifiedCountForStudent(absences: Absence[]): number {
    return absences.filter(a => !a.justified).length;
  }

  getTotalAbsencesInClass(classGroup: any): number {
    return classGroup.students.reduce((total: number, student: any) =>
      total + student.absences.length, 0);
  }

  getClassName(absence: Absence): string {
    if (absence.student && typeof absence.student === 'object') {
      const student = absence.student as any;
      if (student.classId && typeof student.classId === 'object') {
        return student.classId.name || this.getTranslation('COMMON.UNKNOWN');
      }
    }
    return this.getTranslation('COMMON.UNKNOWN');
  }

  getStudentName(absence: Absence): string {
    if (absence.student && typeof absence.student === 'object') {
      const student = absence.student as any;
      const name = `${student.firstName || ''} ${student.lastName || ''}`.trim();
      return name || this.getTranslation('COMMON.UNKNOWN');
    }
    return this.getTranslation('COMMON.UNKNOWN');
  }

  private getTranslation(key: string): string {
    let val = '';
    this.translate.get(key).subscribe(v => val = v);
    return val;
  }

  groupAbsencesByClassAndStudent() {
    const classMap = new Map<string, Map<string, Absence[]>>();

    this.absences.forEach(absence => {
      const className = this.getClassName(absence);
      const studentName = this.getStudentName(absence);

      if (!classMap.has(className)) {
        classMap.set(className, new Map<string, Absence[]>());
      }

      const studentMap = classMap.get(className)!;
      if (!studentMap.has(studentName)) {
        studentMap.set(studentName, []);
      }

      studentMap.get(studentName)!.push(absence);
    });

    const getClassOrder = (className: string): number => {
      const match = className.match(/(\d+)/);
      return match ? parseInt(match[1]) : 999;
    };

    this.groupedAbsences = Array.from(classMap.entries())
      .map(([className, studentMap]) => ({
        className,
        students: Array.from(studentMap.entries())
          .map(([studentName, absences]) => ({ studentName, absences }))
          .sort((a, b) => a.studentName.localeCompare(b.studentName))
      }))
      .sort((a, b) => getClassOrder(a.className) - getClassOrder(b.className));
  }

  deleteAbsence(absenceId: string) {
    this.translate.get(['ABSENCES.DELETE_CONFIRM', 'COMMON.DELETE']).subscribe(msgs => {
      this.confirmation.confirm(msgs['COMMON.DELETE'], msgs['ABSENCES.DELETE_CONFIRM'])
        .then(confirmed => {
          if (confirmed) {
            this.http.delete(`${ApiConstants.baseUrl}${ApiConstants.absences}/${absenceId}`)
              .subscribe({
                next: () => {
                  // Remove from local array
                  this.absences = this.absences.filter(a => a._id !== absenceId);
                  // Regroup if needed
                  if (this.user?.role !== 'student') {
                    this.groupAbsencesByClassAndStudent();
                  }
                  this.translate.get('ABSENCES.DELETE_SUCCESS').subscribe(msg => {
                    this.toastService.success(msg || 'Absence supprimée avec succès');
                  });
                },
                error: (err) => {
                  this.translate.get('ABSENCES.DELETE_ERROR').subscribe(errMsg => {
                    this.toastService.error(err.error?.message || errMsg);
                  });
                }
              });
          }
        });
    });
  }
}
