import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiConstants } from '../../core/constants/api.constants';
import { Grade, User } from '../../core/models/models';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmationService } from '../../core/services/confirmation.service';

@Component({
  selector: 'app-grades',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="grades-page">
      <div class="page-header">
        <div>
          <h2>📈 {{ 'GRADES.TITLE' | translate }}</h2>
          <p class="subtitle">{{ 'GRADES.SUBTITLE' | translate }}</p>
        </div>
        <div class="header-actions">
          <button *ngIf="user?.role !== 'student'" class="btn-add" (click)="navigateToAddGrade()">
            <span class="icon">➕</span> {{ 'GRADES.ADD_GRADE' | translate }}
          </button>
          <div class="stats-summary" *ngIf="grades.length > 0 && user?.role === 'student'">
            <div class="stat-card" *ngFor="let term of ['T1', 'T2', 'T3']">
              <span class="stat-value">{{ calculateAverage(term) }}</span>
              <span class="stat-label">{{ 'GRADES.AVERAGE' | translate }} {{ term }}</span>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ 'GRADES.LOADING' | translate }}</p>
      </div>

      <div *ngIf="!loading && grades.length === 0" class="empty-state">
        <div class="empty-icon">📊</div>
        <h3>{{ 'GRADES.EMPTY_TITLE' | translate }}</h3>
        <p>{{ 'GRADES.EMPTY_SUBTITLE' | translate }}</p>
      </div>

      <!-- Student View: Simple list -->
      <div class="grades-container" *ngIf="!loading && grades.length > 0 && user?.role === 'student'">
        <div class="grade-card" *ngFor="let grade of grades">
          <div class="grade-header">
            <div class="subject-info">
              <h3>{{ (grade.subject.name || ('COMMON.UNKNOWN' | translate)) }}</h3>
              <span class="eval-type">{{ getTranslatedEvalType(grade.evaluationType) }}</span>
            </div>
            <div class="grade-badge" [ngClass]="getGradeClass(grade.value)">
              {{ grade.value }}<span class="max">{{ 'GRADES.MAX_SCORE' | translate }}</span>
            </div>
          </div>
          
          <div class="grade-footer">
            <span class="coef-badge">
              <span class="icon">⚖️</span> {{ 'GRADES.COEFFICIENT' | translate }}: {{ grade.coefficient }}
            </span>
          </div>
        </div>
      </div>

      <!-- Professor/Manager View: Grouped by class, subject, and student -->
      <div *ngIf="!loading && grades.length > 0 && user?.role !== 'student'">
        <div *ngFor="let classGroup of groupedGrades" class="class-group">
          <div class="class-header">
            <h2>🎓 {{ classGroup.className }}</h2>
            <span class="total-count">{{ 'GRADES.COUNT_GRADES' | translate:{count: getTotalGradesInClass(classGroup)} }}</span>
          </div>

          <div *ngFor="let subjectGroup of classGroup.subjects" class="subject-group">
            <div class="subject-header">
              <h3>📚 {{ subjectGroup.subjectName }}</h3>
              <span class="subject-count">{{ subjectGroup.students.length }} {{ 'GRADES.STUDENTS' | translate }}</span>
            </div>

            <div *ngFor="let studentGroup of subjectGroup.students" class="student-group">
              <div class="student-header">
                <div class="student-info">
                  <h4>👤 {{ studentGroup.studentName }}</h4>
                  <span class="grade-count">{{ 'GRADES.COUNT_GRADES' | translate:{count: studentGroup.grades.length} }}</span>
                </div>
                <div class="student-average">
                  <span class="avg-label">{{ 'GRADES.STUDENT_AVERAGE' | translate }}:</span>
                  <span class="avg-value">{{ calculateStudentAverage(studentGroup.grades) }}</span>
                </div>
              </div>
              
              <div class="grades-grid">
                <div class="grade-card-compact" *ngFor="let grade of studentGroup.grades">
                  <div class="grade-compact-header">
                    <span class="eval-type-small">{{ getTranslatedEvalType(grade.evaluationType) }}</span>
                    <button *ngIf="user?.role === 'manager'" class="delete-grade-btn" (click)="deleteGrade(grade._id)" title="{{ 'COMMON.DELETE' | translate }}">
                      🗑️
                    </button>
                  </div>
                  <div class="grade-compact-body">
                    <div class="grade-badge-small" [ngClass]="getGradeClass(grade.value)">
                      {{ grade.value }}<span class="max">{{ 'GRADES.MAX_SCORE' | translate }}</span>
                    </div>
                    <span class="coef-small">{{ 'GRADES.COEFFICIENT' | translate }}: {{ grade.coefficient }}</span>
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
    .grades-page {
      animation: fadeIn 0.4s ease-out;
    }

    [dir="rtl"] .btn-add .icon { order: 2; }
    [dir="rtl"] .class-header h2 { order: 2; }
    [dir="rtl"] .student-info h3 { order: 2; }
    [dir="rtl"] .grade-card { border-left: none; border-right: 4px solid var(--primary); }
    [dir="rtl"] .grade-card-compact { border-left: none; border-right: 3px solid var(--primary); }

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
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--primary);
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
      opacity: 0.5;
    }

    /* Grades Container */
    .grades-container {
      display: grid;
      gap: 1rem;
    }

    .grade-card {
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
      transition: var(--transition);
      border-left: 4px solid var(--primary);
    }

    .grade-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateX(4px);
    }

    .grade-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
    }

    .subject-info h3 {
      font-size: 1.1rem;
      color: var(--text-main);
      margin-bottom: 0.5rem;
    }

    .eval-type {
      display: inline-block;
      background: #f1f5f9;
      color: var(--text-muted);
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .grade-badge {
      font-size: 2rem;
      font-weight: 700;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-md);
      min-width: 80px;
      text-align: center;
    }

    .grade-badge .max {
      font-size: 1rem;
      opacity: 0.6;
    }

    .grade-badge.excellent {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .grade-badge.good {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
    }

    .grade-badge.average {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }

    .grade-badge.poor {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }

    .grade-footer {
      padding: 0.75rem 1.5rem;
      background: #f8fafc;
      border-top: 1px solid #f1f5f9;
    }

    .coef-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    /* Class and Student Grouping */
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
      border-bottom: 4px solid var(--primary);
    }

    .class-header h2 {
      font-size: 1.75rem;
      color: var(--text-main);
      margin: 0;
      font-weight: 700;
    }

    .total-count {
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: white;
      padding: 0.5rem 1.25rem;
      border-radius: 25px;
      font-size: 0.9rem;
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
    }

    .subject-group {
      margin-bottom: 2rem;
      padding: 1.25rem;
      background: #f8fafc;
      border-radius: var(--radius-lg);
      border-left: 4px solid #3b82f6;
    }

    .subject-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #cbd5e1;
    }

    .subject-header h3 {
      font-size: 1.3rem;
      color: var(--text-main);
      margin: 0;
      font-weight: 600;
    }

    .subject-count {
      background: white;
      color: #3b82f6;
      padding: 0.35rem 1rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      box-shadow: var(--shadow-sm);
    }

    .student-group {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: white;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
    }

    .student-group:last-child {
      margin-bottom: 0;
    }

    .student-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #e2e8f0;
    }

    .student-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .student-info h3, .student-info h4 {
      font-size: 1.1rem;
      color: var(--text-main);
      margin: 0;
      font-weight: 600;
    }

    .grade-count {
      background: white;
      color: var(--text-muted);
      padding: 0.25rem 0.75rem;
      border-radius: 15px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .student-average {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .avg-label {
      font-size: 0.9rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .avg-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary);
    }

    .grades-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 0.75rem;
    }

    .grade-card-compact {
      background: white;
      border-radius: var(--radius-md);
      padding: 0.75rem;
      box-shadow: var(--shadow-sm);
      border-left: 3px solid var(--primary);
      transition: var(--transition);
      position: relative;
    }

    /* RTL support for padding */
    [dir="rtl"] .grade-card-compact {
      border-left: none;
      border-right: 3px solid var(--primary);
    }

    .grade-card-compact:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }

    .delete-grade-btn {
      position: relative !important; /* Force relative/static */
      background: none;
      border: none;
      font-size: 1.1rem; /* Slightly smaller */
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 50%;
      transition: var(--transition);
      opacity: 0;
      /* No absolute positioning anymore */
      margin-left: auto; /* Push to right in LTR */
    }

    [dir="rtl"] .delete-grade-btn {
        margin-left: 0;
        margin-right: auto; /* Push to left in RTL */
    }

    .grade-card-compact:hover .delete-grade-btn {
      opacity: 1;
    }

    .delete-grade-btn:hover {
      background: #fee2e2;
      transform: scale(1.1);
    }

    .grade-compact-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      position: relative; /* Just in case */
    }

    .eval-type-small {
      font-weight: 600;
      color: var(--text-main);
      font-size: 0.95rem;
      /* Ensure text doesn't flow under button */
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .subject-name {
      font-weight: 600;
      color: var(--text-main);
      font-size: 0.9rem;
    }

    .eval-type-small {
      background: #f1f5f9;
      color: var(--text-muted);
      padding: 0.2rem 0.5rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 500;
    }

    .grade-compact-body {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .grade-badge-small {
      font-size: 1.25rem;
      font-weight: 700;
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-sm);
    }

    .grade-badge-small .max {
      font-size: 0.75rem;
      opacity: 0.6;
    }

    .coef-small {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
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
        width: 100%;
      }
      .stat-card {
        width: 100%;
      }
      h2 { font-size: 1.5rem; }
      .grades-grid {
        grid-template-columns: 1fr;
      }
      .class-header h2 { font-size: 1.25rem; }
      .loading-state, .empty-state { padding: 2rem; }
      .grade-badge { font-size: 1.5rem; padding: 0.25rem 0.5rem; min-width: 60px; }
      .subject-info h3 { font-size: 1rem; }
      
      /* Always show delete button on mobile */
      .delete-grade-btn { opacity: 1; }
    }
  `]
})

export class GradesComponent implements OnInit {
  grades: Grade[] = [];
  groupedGrades: {
    className: string;
    subjects: {
      subjectName: string;
      students: { studentName: string; grades: Grade[] }[];
    }[];
  }[] = [];
  loading = false;
  user: User | null = null;

  private translate = inject(TranslateService);
  private toastService = inject(ToastService);
  private confirmation = inject(ConfirmationService);

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {
    this.user = this.authService.currentUser();
  }

  ngOnInit() {
    this.loading = true;
    this.http.get<Grade[]>(ApiConstants.baseUrl + ApiConstants.grades)
      .subscribe({
        next: (data) => {
          this.grades = data;
          if (this.user?.role !== 'student') {
            this.groupGradesByClassSubjectAndStudent();
          }
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
  }

  calculateAverage(term: string = ''): string {
    let filteredGrades = this.grades;

    // Filter by term if provided (T1, T2, T3)
    if (term) {
      filteredGrades = this.grades.filter(g => {
        // Check if eval type contains the term marker (e.g. "DEVOIR_T1", "EXAMEN_T1")
        // We use the translated key logic or check the raw string if needed, 
        // but typically the raw value stored is like "Devoir du 1er trimestre"
        const type = g.evaluationType || '';
        if (term === 'T1') return type.includes('1er') || type.includes('T1');
        if (term === 'T2') return type.includes('2ème') || type.includes('T2');
        if (term === 'T3') return type.includes('3ème') || type.includes('T3');
        return false;
      });
    }

    if (filteredGrades.length === 0) return '-';

    // Calculate weighted average
    const totalScore = filteredGrades.reduce((acc, g) => acc + (g.value * g.coefficient), 0);
    const totalCoef = filteredGrades.reduce((acc, g) => acc + g.coefficient, 0);

    if (totalCoef === 0) return '0.0';

    return (totalScore / totalCoef).toFixed(1);
  }

  getGradeClass(value: number): string {
    if (value >= 16) return 'excellent';
    if (value >= 12) return 'good';
    if (value >= 10) return 'average';
    return 'poor';
  }

  navigateToAddGrade() {
    this.router.navigate(['/dashboard/grades/add']);
  }

  getTranslatedEvalType(type: string): string {
    if (!type) return '';

    // Map evaluation types to translation keys
    const typeMap: { [key: string]: string } = {
      'Devoir du 1er trimestre': 'DEVOIR_T1',
      'Examen du 1er trimestre': 'EXAMEN_T1',
      'Devoir du 2ème trimestre': 'DEVOIR_T2',
      'Examen du 2ème trimestre': 'EXAMEN_T2',
      'Devoir du 3ème trimestre': 'DEVOIR_T3',
      'Examen du 3ème trimestre': 'EXAMEN_T3'
    };

    const translationKey = typeMap[type];
    if (translationKey) {
      let val = type;
      this.translate.get(`GRADES.EVAL_TYPES.${translationKey}`).subscribe(v => {
        if (!v.includes(`GRADES.EVAL_TYPES.`)) val = v;
      });
      return val;
    }

    // Fallback: return the type as-is if no mapping found
    return type;
  }

  getSubjectName(grade: Grade): string {
    if (grade.subject && typeof grade.subject === 'object') {
      const subj = grade.subject as any;
      return subj.name || this.getTranslation('COMMON.UNKNOWN');
    }
    return this.getTranslation('COMMON.UNKNOWN');
  }

  getStudentName(grade: Grade): string {
    if (grade.student && typeof grade.student === 'object') {
      const student = grade.student as any;
      const name = `${student.firstName || ''} ${student.lastName || ''}`.trim();
      return name || this.getTranslation('COMMON.UNKNOWN');
    }
    return this.getTranslation('COMMON.UNKNOWN');
  }

  getClassName(grade: Grade): string {
    if (grade.student && typeof grade.student === 'object') {
      const student = grade.student as any;
      if (student.classId && typeof student.classId === 'object') {
        return student.classId.name || this.getTranslation('COMMON.UNKNOWN');
      }
    }
    return this.getTranslation('COMMON.UNKNOWN');
  }

  private getTranslation(key: string): string {
    let val = '';
    this.translate.get(key).subscribe(v => val = v);
    return val;
  }

  groupGradesByClassSubjectAndStudent() {
    // Map structure: Class -> Subject -> Student -> Grades[]
    const classMap = new Map<string, Map<string, Map<string, Grade[]>>>();

    this.grades.forEach(grade => {
      const className = this.getClassName(grade);
      const subjectName = this.getSubjectName(grade);
      const studentName = this.getStudentName(grade);

      if (!classMap.has(className)) {
        classMap.set(className, new Map<string, Map<string, Grade[]>>());
      }

      const subjectMap = classMap.get(className)!;
      if (!subjectMap.has(subjectName)) {
        subjectMap.set(subjectName, new Map<string, Grade[]>());
      }

      const studentMap = subjectMap.get(subjectName)!;
      if (!studentMap.has(studentName)) {
        studentMap.set(studentName, []);
      }

      studentMap.get(studentName)!.push(grade);
    });

    const getClassOrder = (className: string): number => {
      // Handle French ordinal numbers: 1ère, 2ème, 3ème, etc.
      const ordinalMatch = className.match(/(\d+)(ère|ème|e)/i);
      if (ordinalMatch) {
        return parseInt(ordinalMatch[1]);
      }

      // Fallback to any number in the string
      const match = className.match(/(\d+)/);
      return match ? parseInt(match[1]) : 999;
    };

    this.groupedGrades = Array.from(classMap.entries())
      .map(([className, subjectMap]) => ({
        className,
        subjects: Array.from(subjectMap.entries())
          .map(([subjectName, studentMap]) => ({
            subjectName,
            students: Array.from(studentMap.entries())
              .map(([studentName, grades]) => ({ studentName, grades }))
              .sort((a, b) => a.studentName.localeCompare(b.studentName))
          }))
          .sort((a, b) => a.subjectName.localeCompare(b.subjectName))
      }))
      .sort((a, b) => getClassOrder(a.className) - getClassOrder(b.className));
  }

  getTotalGradesInClass(classGroup: any): number {
    return classGroup.subjects.reduce((total: number, subject: any) =>
      total + subject.students.reduce((subTotal: number, student: any) =>
        subTotal + student.grades.length, 0), 0);
  }

  calculateStudentAverage(grades: Grade[]): string {
    if (grades.length === 0) return '0.0';
    const sum = grades.reduce((acc, g) => acc + g.value, 0);
    return (sum / grades.length).toFixed(1);
  }

  deleteGrade(gradeId: string) {
    this.translate.get(['GRADES.DELETE_CONFIRM', 'COMMON.DELETE']).subscribe(msgs => {
      this.confirmation.confirm(msgs['COMMON.DELETE'], msgs['GRADES.DELETE_CONFIRM'])
        .then(confirmed => {
          if (confirmed) {
            this.http.delete(`${ApiConstants.baseUrl}${ApiConstants.grades}/${gradeId}`)
              .subscribe({
                next: () => {
                  // Remove from local array
                  this.grades = this.grades.filter(g => g._id !== gradeId);
                  // Regroup if needed
                  if (this.user?.role !== 'student') {
                    this.groupGradesByClassSubjectAndStudent();
                  }
                  this.translate.get('GRADES.DELETE_SUCCESS').subscribe(msg => {
                    this.toastService.success(msg || 'Note supprimée avec succès');
                  });
                },
                error: (err) => {
                  this.translate.get('GRADES.DELETE_ERROR').subscribe(errMsg => {
                    this.toastService.error(err.error?.message || errMsg);
                  });
                }
              });
          }
        });
    });
  }
}
