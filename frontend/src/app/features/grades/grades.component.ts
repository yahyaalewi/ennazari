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

import { FormsModule } from '@angular/forms'; // Add import

@Component({
  selector: 'app-grades',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule], // Add FormsModule
  template: `
    <div class="grades-page">
      <div class="page-header">
        <div>
          <h2>📈 {{ 'GRADES.TITLE' | translate }}</h2>
          <p class="subtitle">{{ 'GRADES.SUBTITLE' | translate }}</p>
        </div>
        
        <!-- Search Bar -->
        <!-- Search Bar -->
        <div class="search-container" *ngIf="user?.role !== 'student'">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              (ngModelChange)="filterGrades()"
              [placeholder]="'GRADES.SEARCH_MANAGER' | translate"
            >
            <button *ngIf="searchQuery" class="clear-search" (click)="searchQuery = ''; filterGrades()">×</button>
          </div>
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
      
      <!-- ... rest of template ... -->
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
                <!-- ... -->
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
    /* ... existing styles ... */
    .search-container {
      flex: 1;
      min-width: 250px;
      max-width: 400px;
    }
    
    .search-box {
      position: relative;
      display: flex;
      align-items: center;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 50px; /* Pillow shape for premium feel */
      padding: 0.5rem 1rem;
      transition: all 0.3s ease;
      box-shadow: var(--shadow-sm);
    }
    
    .search-box:focus-within {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
      transform: translateY(-1px);
    }
    
    .search-icon {
      margin-right: 0.75rem;
      color: var(--text-muted);
      font-size: 1.1rem;
    }
    
    [dir="rtl"] .search-icon {
      margin-right: 0;
      margin-left: 0.75rem;
    }
    
    .search-box input {
      border: none;
      outline: none;
      width: 100%;
      font-size: 0.95rem;
      color: var(--text-main);
      background: transparent;
    }
    
    .clear-search {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1.25rem;
      padding: 0;
      line-height: 1;
      margin-left: 0.5rem;
      transition: color 0.2s;
    }
    
    [dir="rtl"] .clear-search {
      margin-left: 0;
      margin-right: 0.5rem;
    }
    
    .clear-search:hover {
      color: var(--danger);
    }

    /* Update page-header to accommodate search */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1.5rem;
    }
    
    /* ... existing styles ... */
    
    /* ... */
  `]
})
export class GradesComponent implements OnInit {
  grades: Grade[] = [];
  allGrades: Grade[] = []; // Store all grades
  searchQuery = ''; // Search query

  // ... existing properties ...
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
          this.allGrades = data; // Store original
          this.filterGrades(); // Initial filter (shows all)
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
  }

  filterGrades() {
    const query = this.searchQuery.toLowerCase().trim();

    if (!query) {
      this.grades = [...this.allGrades];
    } else {
      this.grades = this.allGrades.filter(grade => {
        if (this.user?.role === 'student') {
          // Student: search by subject name
          const subject = this.getSubjectName(grade).toLowerCase();
          return subject.includes(query);
        } else {
          // Manager/Professor: search by student, class, or subject
          const student = this.getStudentName(grade).toLowerCase();
          const className = this.getClassName(grade).toLowerCase();
          const subject = this.getSubjectName(grade).toLowerCase();
          return student.includes(query) || className.includes(query) || subject.includes(query);
        }
      });
    }

    // Re-group if not student
    if (this.user?.role !== 'student') {
      this.groupGradesByClassSubjectAndStudent();
    }
  }

  // ... rest of the file ...

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
