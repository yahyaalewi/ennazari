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
  imports: [CommonModule, TranslateModule, FormsModule],
  template: `
    <div class="grades-page">
      <div class="page-header">
        <div class="header-content">
          <h2 class="title">📈 {{ 'GRADES.TITLE' | translate }}</h2>
          <p class="subtitle">{{ 'GRADES.SUBTITLE' | translate }}</p>
        </div>
        
        <!-- Search Bar (Manager/Professor) -->
        <div class="search-wrapper" *ngIf="user?.role !== 'student'">
          <div class="search-box glass-effect">
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
          <button *ngIf="user?.role !== 'student'" class="btn-primary" (click)="navigateToAddGrade()">
            <span class="icon">➕</span> {{ 'GRADES.ADD_GRADE' | translate }}
          </button>
        </div>
      </div>

      <!-- Student Stats Summary -->
      <div class="stats-grid" *ngIf="!loading && grades.length > 0 && user?.role === 'student'">
        <div class="stat-card gradient-1" *ngFor="let term of ['T1', 'T2', 'T3']">
          <div class="stat-content">
            <span class="stat-label">{{ 'GRADES.AVERAGE' | translate }} {{ term }}</span>
            <span class="stat-value">{{ calculateAverage(term) }}</span>
          </div>
          <div class="stat-icon">📊</div>
        </div>
      </div>

      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ 'GRADES.LOADING' | translate }}</p>
      </div>

      <div *ngIf="!loading && grades.length === 0" class="empty-state">
        <div class="empty-icon-wrapper">
          <span class="empty-icon">📝</span>
        </div>
        <h3>{{ 'GRADES.EMPTY_TITLE' | translate }}</h3>
        <p>{{ 'GRADES.EMPTY_SUBTITLE' | translate }}</p>
      </div>
      
      <!-- Student View: Grade List -->
      <div class="grades-container" *ngIf="!loading && grades.length > 0 && user?.role === 'student'">
        <div class="grade-card shadow-hover" *ngFor="let grade of grades">
          <div class="grade-left">
            <div class="subject-icon">{{ grade.subject.name.charAt(0) }}</div>
            <div class="grade-info">
              <h3>{{ (grade.subject.name || ('COMMON.UNKNOWN' | translate)) }}</h3>
              <span class="eval-type">{{ getTranslatedEvalType(grade.evaluationType) }}</span>
            </div>
          </div>
          
          <div class="grade-right">
            <div class="grade-circle" [ngClass]="getGradeClass(grade.value)">
              <span class="value">{{ grade.value }}</span>
              <span class="max">/20</span>
            </div>
            <span class="coef-badge">
             Coef: {{ grade.coefficient }}
            </span>
          </div>
        </div>
      </div>

      <!-- Manager/Professor View: Grouped Interface -->
      <div class="grouped-container" *ngIf="!loading && grades.length > 0 && user?.role !== 'student'">
        <div *ngFor="let classGroup of groupedGrades" class="class-group-card">
          <div class="class-header">
            <h2 class="class-title">{{ classGroup.className }}</h2>
            <span class="badge-count">{{ 'GRADES.COUNT_GRADES' | translate:{count: getTotalGradesInClass(classGroup)} }}</span>
          </div>

          <div class="subjects-list">
            <div *ngFor="let subjectGroup of classGroup.subjects" class="subject-section">
              <div class="subject-header">
                <h3>📚 {{ subjectGroup.subjectName }}</h3>
                <span class="student-count-badge">{{ subjectGroup.students.length }} {{ 'GRADES.STUDENTS' | translate }}</span>
              </div>

              <div class="students-grid">
                <div *ngFor="let studentGroup of subjectGroup.students" class="student-card shadow-sm">
                  <div class="student-header-compact">
                    <span class="student-avatar">{{ studentGroup.studentName.charAt(0) }}</span>
                    <div class="student-details">
                      <h4>{{ studentGroup.studentName }}</h4>
                      <span class="avg-text">{{ 'GRADES.STUDENT_AVERAGE' | translate }}: <strong>{{ calculateStudentAverage(studentGroup.grades) }}</strong></span>
                    </div>
                  </div>
                  
                  <div class="grades-mini-list">
                    <div class="grade-chip" *ngFor="let grade of studentGroup.grades" [ngClass]="getGradeClass(grade.value)">
                      <span class="grade-val">{{ grade.value }}</span>
                      <span class="grade-type-mini" title="{{ getTranslatedEvalType(grade.evaluationType) }}">{{ getTranslatedEvalType(grade.evaluationType).substring(0,3) }}</span>
                      <button *ngIf="user?.role === 'manager'" class="btn-delete-mini" (click)="deleteGrade(grade._id)" title="{{ 'COMMON.DELETE' | translate }}">×</button>
                    </div>
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
      padding: 0;
      animation: fadeIn 0.5s ease-out;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-bottom: 2.5rem;
    }
    
    @media (min-width: 768px) {
      .page-header {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }

    .header-content .title {
      font-size: 2.25rem;
      font-weight: 800;
      color: var(--text-main);
      margin: 0 0 0.5rem 0;
      background: linear-gradient(45deg, var(--text-main), var(--primary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .header-content .subtitle {
      color: var(--text-muted);
      font-size: 1.1rem;
      margin: 0;
    }

    /* Search Bar */
    .search-wrapper { flex: 1; max-width: 400px; margin: 0 auto; }
    [dir="rtl"] .search-wrapper { margin: 0 auto; }

    .search-box {
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 50px;
      padding: 0.75rem 1.25rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .search-box:focus-within {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      border-color: var(--primary);
      background: white;
    }

    .search-icon { color: var(--text-muted); font-size: 1.2rem; margin-right: 10px; }
    [dir="rtl"] .search-icon { margin-right: 0; margin-left: 10px; }

    .search-box input {
      border: none;
      background: transparent;
      outline: none;
      width: 100%;
      font-size: 1rem;
      color: var(--text-main);
    }

    .clear-search {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1.2rem;
      padding: 0 5px;
    }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: white;
      border: none;
      border-radius: 100px;
      font-weight: 600;
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 12px rgba(79, 70, 229, 0.3);
    }

    /* Stats Cards */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .stat-card {
      background: white;
      border-radius: 20px;
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
      position: relative;
      overflow: hidden;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%);
      pointer-events: none;
    }

    .gradient-1 { background: linear-gradient(135deg, #60a5fa, #3b82f6); color: white; }
    .gradient-1:nth-child(2) { background: linear-gradient(135deg, #a78bfa, #7c3aed); }
    .gradient-1:nth-child(3) { background: linear-gradient(135deg, #f472b6, #db2777); }

    .stat-content { display: flex; flex-direction: column; z-index: 1; }
    .stat-label { font-size: 0.9rem; opacity: 0.9; margin-bottom: 0.5rem; text-transform: uppercase; font-weight: 600; }
    .stat-value { font-size: 2.5rem; font-weight: 800; line-height: 1; }
    .stat-icon { font-size: 3rem; opacity: 0.3; position: absolute; right: -10px; bottom: -10px; transform: rotate(-15deg); }

    /* Student Grade List */
    .grades-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .grade-card {
      background: white;
      border-radius: 16px;
      padding: 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      transition: all 0.3s ease;
      border: 1px solid rgba(0,0,0,0.03);
    }

    .grade-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 20px rgba(0,0,0,0.08);
      border-color: rgba(0,0,0,0.05);
    }

    .grade-left { display: flex; align-items: center; gap: 1rem; }
    
    .subject-icon {
      width: 48px;
      height: 48px;
      background: #f1f5f9;
      color: var(--text-main);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .grade-info h3 { margin: 0; font-size: 1.1rem; color: var(--text-main); font-weight: 700; }
    .eval-type { font-size: 0.85rem; color: var(--text-muted); }

    .grade-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; }
    
    .grade-circle {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      /* background set by class */
      color: white;
      font-weight: 700;
      line-height: 1;
    }

    .grade-circle.excellent { background: #10b981; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3); }
    .grade-circle.good { background: #3b82f6; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3); }
    .grade-circle.average { background: #f59e0b; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3); }
    .grade-circle.poor { background: #ef4444; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3); }

    .grade-circle .value { font-size: 1.2rem; }
    .grade-circle .max { font-size: 0.6rem; opacity: 0.8; }
    
    .coef-badge {
      font-size: 0.75rem;
      background: #f8fafc;
      padding: 0.25rem 0.75rem;
      border-radius: 10px;
      color: var(--text-muted);
      font-weight: 600;
    }

    /* Manager View */
    .class-group-card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
      margin-bottom: 2rem;
      overflow: hidden;
      border: 1px solid rgba(0,0,0,0.03);
    }

    .class-header {
      background: #f8fafc;
      padding: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .class-title { margin: 0; font-size: 1.5rem; color: var(--text-main); font-weight: 700; }
    .badge-count { background: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600; color: var(--primary); box-shadow: 0 1px 2px rgba(0,0,0,0.05); }

    .subjects-list { padding: 1.5rem; }
    .subject-section { margin-bottom: 2rem; }
    .subject-section:last-child { margin-bottom: 0; }
    
    .subject-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    
    .subject-header h3 { margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--text-main); }
    .student-count-badge { font-size: 0.8rem; background: #eef2ff; color: #4338ca; padding: 0.2rem 0.6rem; border-radius: 6px; }

    .students-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .student-card {
      background: #fff;
      border: 1px solid #f1f5f9;
      border-radius: 12px;
      padding: 1rem;
      transition: all 0.2s ease;
    }
    .student-card:hover { transform: translateY(-2px); box-shadow: 0 8px 15px rgba(0,0,0,0.05); border-color: #e2e8f0; }

    .student-header-compact {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .student-avatar {
      width: 40px; height: 40px;
      background: linear-gradient(135deg, #cbd5e1, #94a3b8);
      color: white;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700;
    }

    .student-details h4 { margin: 0; font-size: 1rem; color: var(--text-main); }
    .avg-text { font-size: 0.8rem; color: var(--text-muted); }
    .avg-text strong { color: var(--text-main); }

    .grades-mini-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .grade-chip {
      background: #f1f5f9;
      border-radius: 8px;
      padding: 0.25rem 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      font-weight: 600;
      position: relative;
    }

    .grade-chip.excellent { background: #d1fae5; color: #065f46; }
    .grade-chip.good { background: #dbeafe; color: #1e40af; }
    .grade-chip.average { background: #fef3c7; color: #92400e; }
    .grade-chip.poor { background: #fee2e2; color: #991b1b; }

    .grade-type-mini { font-size: 0.65rem; opacity: 0.7; text-transform: uppercase; }
    
    .btn-delete-mini {
      background: rgba(0,0,0,0.1);
      border: none;
      border-radius: 50%;
      width: 16px;
      height: 16px;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem;
      cursor: pointer;
      color: currentColor;
      padding: 0;
    }
    .btn-delete-mini:hover { background: rgba(0,0,0,0.2); }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 20px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .empty-icon-wrapper {
      width: 80px; height: 80px;
      background: #f8fafc;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1.5rem;
    }
    .empty-icon { font-size: 2.5rem; }
    .empty-state h3 { margin: 0 0 0.5rem; color: var(--text-main); font-size: 1.5rem; }
    .empty-state p { color: var(--text-muted); margin: 0; }

    .loading-state { text-align: center; padding: 4rem; color: var(--text-muted); }
    .spinner { margin: 0 auto 1rem; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
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
