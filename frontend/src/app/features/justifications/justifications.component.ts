import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiConstants } from '../../core/constants/api.constants';
import { Absence } from '../../core/models/models';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-justifications',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule],
    template: `
    <div class="justifications-page">
      <div class="page-header">
        <div>
          <h2>📋 {{ 'JUSTIFICATIONS.TITLE' | translate }}</h2>
          <p class="subtitle">{{ 'JUSTIFICATIONS.SUBTITLE' | translate }}</p>
        </div>
        <div class="stats-badge">
          <span class="count">{{ pendingJustifications.length }}</span>
          <span class="label">{{ 'JUSTIFICATIONS.PENDING' | translate }}</span>
        </div>
      </div>

      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ 'COMMON.LOADING' | translate }}</p>
      </div>

      <div *ngIf="!loading && pendingJustifications.length === 0" class="empty-state">
        <div class="empty-icon">✅</div>
        <h3>{{ 'JUSTIFICATIONS.EMPTY_TITLE' | translate }}</h3>
        <p>{{ 'JUSTIFICATIONS.EMPTY_SUBTITLE' | translate }}</p>
      </div>

      <!-- Review Modal -->
      <div class="modal" *ngIf="showReviewModal" (click)="closeReviewModal($event)">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ 'JUSTIFICATIONS.REVIEW_TITLE' | translate }}</h3>
            <button class="close-btn" (click)="closeReviewModal($event)">✕</button>
          </div>

          <div class="modal-body">
            <div class="justification-details" *ngIf="selectedJustification">
              <div class="detail-row">
                <strong>{{ 'JUSTIFICATIONS.STUDENT' | translate }}:</strong>
                <span>{{ getStudentName(selectedJustification) }}</span>
              </div>
              <div class="detail-row">
                <strong>{{ 'JUSTIFICATIONS.CLASS' | translate }}:</strong>
                <span>{{ getClassName(selectedJustification) }}</span>
              </div>
              <div class="detail-row">
                <strong>{{ 'JUSTIFICATIONS.SUBJECT' | translate }}:</strong>
                <span>{{ selectedJustification.subject?.name || ('COMMON.GENERAL' | translate) }}</span>
              </div>
              <div class="detail-row">
                <strong>{{ 'JUSTIFICATIONS.DATE' | translate }}:</strong>
                <span>{{ selectedJustification.date | date:'fullDate' }}</span>
              </div>
              <div class="detail-row">
                <strong>{{ 'JUSTIFICATIONS.REASON' | translate }}:</strong>
                <p class="reason-text">{{ selectedJustification.justificationReason }}</p>
              </div>
              <div class="detail-row" *ngIf="selectedJustification.justificationDocument">
                <strong>{{ 'JUSTIFICATIONS.DOCUMENT' | translate }}:</strong>
                <a [href]="getDocumentUrl(selectedJustification)" target="_blank" class="document-link">
                  📎 {{ 'JUSTIFICATIONS.VIEW_DOCUMENT' | translate }}
                </a>
              </div>
            </div>

            <div class="form-group">
              <label>{{ 'JUSTIFICATIONS.COMMENT_LABEL' | translate }} ({{ 'COMMON.OPTIONAL' | translate }})</label>
              <textarea [(ngModel)]="reviewComment" rows="3"
                        [placeholder]="'JUSTIFICATIONS.COMMENT_PLACEHOLDER' | translate"></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-reject" (click)="reviewJustification('rejected')" [disabled]="loadingReview">
              {{ (loadingReview ? 'COMMON.LOADING' : 'JUSTIFICATIONS.REJECT') | translate }}
            </button>
            <button type="button" class="btn-approve" (click)="reviewJustification('approved')" [disabled]="loadingReview">
              {{ (loadingReview ? 'COMMON.LOADING' : 'JUSTIFICATIONS.APPROVE') | translate }}
            </button>
          </div>

          <div class="error-message" *ngIf="errorMessage">
            ⚠️ {{ errorMessage }}
          </div>
        </div>
      </div>

      <!-- Justifications List -->
      <div class="justifications-list" *ngIf="!loading && pendingJustifications.length > 0">
        <div class="justification-card" *ngFor="let justification of pendingJustifications">
          <div class="card-header">
            <div class="student-info">
              <h3>{{ getStudentName(justification) }}</h3>
              <span class="class-badge">{{ getClassName(justification) }}</span>
            </div>
            <span class="submitted-date">
              {{ justification.justificationSubmittedAt | date:'short' }}
            </span>
          </div>

          <div class="card-body">
            <div class="absence-info">
              <span class="info-item">
                <span class="icon">📚</span>
                {{ justification.subject?.name || ('COMMON.GENERAL' | translate) }}
              </span>
              <span class="info-item">
                <span class="icon">📅</span>
                {{ justification.date | date:'shortDate' }}
              </span>
              <span class="info-item">
                <span class="icon">⏱️</span>
                {{ justification.durationHours }}h
              </span>
            </div>

            <div class="reason-preview">
              <strong>{{ 'JUSTIFICATIONS.REASON' | translate }}:</strong>
              <p>{{ justification.justificationReason }}</p>
            </div>

            <div class="document-indicator" *ngIf="justification.justificationDocument">
              📎 {{ 'JUSTIFICATIONS.HAS_DOCUMENT' | translate }}
            </div>
          </div>

          <div class="card-footer">
            <button class="btn-review" (click)="openReviewModal(justification)">
              {{ 'JUSTIFICATIONS.REVIEW_ACTION' | translate }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .justifications-page {
      animation: fadeIn 0.4s ease-out;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1.5rem;
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

    .stats-badge {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      padding: 1rem 2rem;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 120px;
    }

    .stats-badge .count {
      font-size: 2.5rem;
      font-weight: 700;
      line-height: 1;
    }

    .stats-badge .label {
      font-size: 0.85rem;
      opacity: 0.9;
      margin-top: 0.25rem;
    }

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

    .justifications-list {
      display: grid;
      gap: 1.5rem;
    }

    .justification-card {
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      overflow: hidden;
      transition: var(--transition);
      border-left: 4px solid #3b82f6;
    }

    .justification-card:hover {
      box-shadow: var(--shadow-lg);
      transform: translateY(-2px);
    }

    .card-header {
      padding: 1.5rem;
      background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
      border-bottom: 1px solid #bae6fd;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .student-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .student-info h3 {
      font-size: 1.25rem;
      color: var(--text-main);
      margin: 0;
      font-weight: 600;
    }

    .class-badge {
      background: white;
      color: #1e40af;
      padding: 0.35rem 0.85rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      box-shadow: var(--shadow-sm);
    }

    .submitted-date {
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .card-body {
      padding: 1.5rem;
    }

    .absence-info {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    .reason-preview {
      background: #f8fafc;
      padding: 1rem;
      border-radius: var(--radius-md);
      margin-bottom: 1rem;
    }

    .reason-preview strong {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--text-main);
    }

    .reason-preview p {
      margin: 0;
      color: var(--text-muted);
      line-height: 1.6;
    }

    .document-indicator {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #dbeafe;
      color: #1e40af;
      border-radius: var(--radius-md);
      font-size: 0.9rem;
      font-weight: 500;
    }

    .card-footer {
      padding: 1rem 1.5rem;
      background: #f8fafc;
      border-top: 1px solid #f1f5f9;
      display: flex;
      justify-content: flex-end;
    }

    .btn-review {
      padding: 0.75rem 1.5rem;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
    }

    .btn-review:hover {
      background: var(--primary-dark);
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
      position: sticky;
      top: 0;
      background: white;
      z-index: 1;
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

    .justification-details {
      background: #f8fafc;
      padding: 1.5rem;
      border-radius: var(--radius-md);
      margin-bottom: 1.5rem;
    }

    .detail-row {
      margin-bottom: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail-row:last-child {
      margin-bottom: 0;
    }

    .detail-row strong {
      color: var(--text-main);
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-row span, .detail-row p {
      color: var(--text-muted);
      font-size: 1rem;
    }

    .reason-text {
      background: white;
      padding: 0.75rem;
      border-radius: var(--radius-sm);
      margin: 0.5rem 0 0 0;
      line-height: 1.6;
    }

    .document-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #dbeafe;
      color: #1e40af;
      text-decoration: none;
      border-radius: var(--radius-md);
      font-weight: 500;
      transition: var(--transition);
      margin-top: 0.5rem;
    }

    .document-link:hover {
      background: #bfdbfe;
      transform: translateX(4px);
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
      position: sticky;
      bottom: 0;
      background: white;
    }

    .btn-approve, .btn-reject {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: var(--radius-md);
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
    }

    .btn-approve {
      background: #10b981;
      color: white;
    }

    .btn-approve:hover:not(:disabled) {
      background: #059669;
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .btn-reject {
      background: #ef4444;
      color: white;
    }

    .btn-reject:hover:not(:disabled) {
      background: #dc2626;
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .btn-approve:disabled, .btn-reject:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .error-message {
      margin-top: 1rem;
      padding: 0.75rem;
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      color: #991b1b;
      border-radius: 6px;
      font-size: 0.9rem;
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }
      .stats-badge {
        width: 100%;
      }
      h2 {
        font-size: 1.5rem;
      }
      .modal-content {
        width: 95%;
        max-height: 95vh;
      }
      .card-header {
        flex-direction: column;
        align-items: flex-start;
      }
      .absence-info {
        flex-direction: column;
        gap: 0.75rem;
      }
    }
  `]
})
export class JustificationsComponent implements OnInit {
    pendingJustifications: Absence[] = [];
    loading = false;
    showReviewModal = false;
    selectedJustification: Absence | null = null;
    reviewComment = '';
    loadingReview = false;
    errorMessage = '';

    private translate = inject(TranslateService);

    constructor(
        private http: HttpClient,
        private router: Router,
        private authService: AuthService
    ) { }

    ngOnInit() {
        this.loadPendingJustifications();
    }

    loadPendingJustifications() {
        this.loading = true;
        this.http.get<Absence[]>(`${ApiConstants.baseUrl}${ApiConstants.absences}/pending-justifications`)
            .subscribe({
                next: (data) => {
                    this.pendingJustifications = data;
                    this.loading = false;
                },
                error: (err) => {
                    console.error(err);
                    this.loading = false;
                }
            });
    }

    openReviewModal(justification: Absence) {
        this.selectedJustification = justification;
        this.reviewComment = '';
        this.errorMessage = '';
        this.showReviewModal = true;
    }

    closeReviewModal(event: Event) {
        event.preventDefault();
        this.showReviewModal = false;
        this.selectedJustification = null;
        this.reviewComment = '';
        this.errorMessage = '';
    }

    reviewJustification(status: 'approved' | 'rejected') {
        if (!this.selectedJustification) return;

        this.loadingReview = true;
        this.errorMessage = '';

        this.http.patch(
            `${ApiConstants.baseUrl}${ApiConstants.absences}/${this.selectedJustification._id}/review-justification`,
            {
                status,
                comment: this.reviewComment.trim() || undefined
            }
        ).subscribe({
            next: () => {
                this.loadingReview = false;
                this.showReviewModal = false;
                this.loadPendingJustifications(); // Reload list
            },
            error: (err) => {
                this.translate.get('JUSTIFICATIONS.ERROR_REVIEW').subscribe(msg => {
                    this.errorMessage = err.error?.message || msg;
                });
                this.loadingReview = false;
            }
        });
    }

    getStudentName(absence: Absence): string {
        if (absence.student && typeof absence.student === 'object') {
            const student = absence.student as any;
            return `${student.firstName || ''} ${student.lastName || ''}`.trim();
        }
        return this.getTranslation('COMMON.UNKNOWN');
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

    getDocumentUrl(absence: Absence): string {
        if (absence.justificationDocument) {
            const baseUrl = ApiConstants.baseUrl.replace('/api', '');
            const path = absence.justificationDocument.startsWith('/')
                ? absence.justificationDocument
                : `/${absence.justificationDocument}`;
            return `${baseUrl}${path}`;
        }
        return '';
    }

    private getTranslation(key: string): string {
        let val = '';
        this.translate.get(key).subscribe(v => val = v);
        return val;
    }
}
