import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Add FormsModule
import { ApiConstants } from '../../core/constants/api.constants';
import { Course, User } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { LocalizedDatePipe } from '../../shared/pipes/localized-date.pipe';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, LocalizedDatePipe], // Add LocalizedDatePipe
  template: `
    <div class="courses-page">
      <div class="page-header">
        <div>
          <h2>📚 {{ 'COURSES.TITLE' | translate }}</h2>
          <p class="subtitle">{{ 'COURSES.SUBTITLE' | translate }}</p>
        </div>
        
        <!-- Search Bar -->
        <div class="search-container">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              (ngModelChange)="filterCourses()"
              [placeholder]="'COMMON.SEARCH' | translate"
            >
            <button *ngIf="searchQuery" class="clear-search" (click)="searchQuery = ''; filterCourses()">×</button>
          </div>
        </div>

        <button *ngIf="user?.role !== 'student'" class="btn-add" (click)="navigateToUpload()">
          <span class="icon">➕</span> {{ 'COURSES.UPLOAD_COURSE' | translate }}
        </button>
      </div>
      
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ 'COURSES.LOADING' | translate }}</p>
      </div>
      
      <div *ngIf="!loading && filteredCourses.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>{{ 'COURSES.EMPTY_TITLE' | translate }}</h3>
        <p>{{ 'COURSES.EMPTY_SUBTITLE' | translate }}</p>
      </div>

      <div *ngIf="!loading && filteredCourses.length > 0">
        <div *ngFor="let classGroup of groupedCourses" class="class-group">
          <div class="class-header">
            <h2>🎓 {{ classGroup.className }}</h2>
            <span class="total-count">{{ 'COURSES.COUNT_COURSES' | translate:{count: getTotalCoursesInClass(classGroup)} }}</span>
          </div>

          <div *ngFor="let subjectGroup of classGroup.subjects" class="subject-group">
            <div class="subject-header">
              <h3>📖 {{ subjectGroup.subjectName }}</h3>
              <span class="course-count">{{ 'COURSES.COUNT_COURSES' | translate:{count: subjectGroup.courses.length} }}</span>
            </div>
            
            <div class="course-grid">
              <div class="course-card" *ngFor="let course of subjectGroup.courses">
                <div class="card-header">
                  <div class="file-icon">📄</div>
                  <span class="file-type">PDF</span>
                </div>
                
                <div class="card-body">
                  <h3 class="course-title">{{ course.title }}</h3>
                  <p class="course-desc">{{ course.description }}</p>
                  
                  <div class="meta-info">
                    <span class="meta-item">
                      <span class="icon">👨‍🏫</span>
                      {{ 'COURSES.PROFESSOR' | translate }}: {{ getProfessorName(course) }}
                    </span>
                    <span class="meta-item">
                      <span class="icon">📅</span>
                      {{ course.createdAt | localizedDate:'shortDate' }}
                    </span>
                  </div>
                </div>
                
                <div class="card-footer">
                  <a [href]="getFileUrl(course.fileUrl)" target="_blank" class="btn-download">
                    <span class="icon">⬇️</span> {{ 'COURSES.DOWNLOAD' | translate }}
                  </a>
                  <button *ngIf="user?.role === 'manager'" (click)="deleteCourse(course._id)" class="btn-delete" [title]="'COURSES.DELETE' | translate">
                    <span class="icon">🗑️</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .courses-page {
      animation: fadeIn 0.4s ease-out;
    }

    [dir="rtl"] .btn-add .icon { order: 2; }
    [dir="rtl"] .class-header h2 { order: 2; }
    [dir="rtl"] .subject-header h3 { order: 2; }
    [dir="rtl"] .search-icon { margin-left: 0.75rem; margin-right: 0; }
    [dir="rtl"] .clear-search { margin-right: 0.5rem; margin-left: 0; }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    /* Search Bar Styles */
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

    .clear-search:hover {
      color: var(--danger);
    }

    h2 {
      font-size: 2rem;
      color: var(--text-main);
      margin-bottom: 0.5rem;
    }

    /* ... rest of styles ... */
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
    }

    .btn-add:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    /* Loading State */
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

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-state h3 {
      color: var(--text-main);
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      color: var(--text-muted);
    }

    /* Class Group */
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

    /* Subject Group */
    .subject-group {
      margin-bottom: 2.5rem;
    }

    .subject-group:last-child {
      margin-bottom: 0;
    }

    .subject-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 3px solid var(--primary);
    }

    .subject-header h3 {
      font-size: 1.5rem;
      color: var(--text-main);
      margin: 0;
      font-weight: 600;
    }

    .course-count {
      background: var(--primary);
      color: white;
      padding: 0.35rem 0.85rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    /* Course Grid */
    .course-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .course-card {
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
      transition: var(--transition);
      border: 1px solid #f1f5f9;
    }

    .course-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    }

    .file-icon {
      font-size: 2.5rem;
    }

    .file-type {
      background: var(--primary);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .card-body {
      padding: 1.25rem;
    }

    .course-title {
      font-size: 1.1rem;
      color: var(--text-main);
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .course-desc {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-bottom: 1rem;
      line-height: 1.5;
    }

    .meta-info {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .card-footer {
      padding: 1rem 1.25rem;
      border-top: 1px solid #f1f5f9;
    }

    .btn-download {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1.25rem;
      background: var(--primary);
      color: white;
      text-decoration: none;
      border-radius: var(--radius-md);
      font-weight: 600;
      font-size: 0.9rem;
      transition: var(--transition);
      width: 100%;
      justify-content: center;
    }

    .btn-download:hover {
      background: var(--primary-dark);
    }

    .card-footer {
      display: flex;
      gap: 0.5rem;
    }

    .btn-delete {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.6rem;
      background: #fee2e2;
      color: #dc2626;
      border: none;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: var(--transition);
    }

    .btn-delete:hover {
      background: #fecaca;
      transform: scale(1.05);
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
      .btn-add { width: 100%; justify-content: center; }
      h2 { font-size: 1.5rem; }
      .class-header h2 { font-size: 1.25rem; }
      .subject-header h3 { font-size: 1.1rem; }
      .course-grid {
        grid-template-columns: 1fr;
      }
      .course-card { max-width: 100%; }
      .loading-state, .empty-state { padding: 2rem 1rem; }
    }
  `]
})

export class CoursesComponent implements OnInit {
  courses: Course[] = [];
  filteredCourses: Course[] = []; // Filtered list
  searchQuery = ''; // Search query

  groupedCourses: {
    className: string;
    subjects: { subjectName: string; courses: Course[] }[];
  }[] = [];
  loading = false;
  user: User | null = null;

  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);
  private confirmation = inject(ConfirmationService);

  constructor(private http: HttpClient, private authService: AuthService, private router: Router) {
    this.user = this.authService.currentUser();
  }

  ngOnInit() {
    this.loading = true;
    this.http.get<Course[]>(ApiConstants.baseUrl + ApiConstants.courses)
      .subscribe({
        next: (data) => {
          this.courses = data;
          this.filterCourses(); // Initial filter
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
  }

  filterCourses() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredCourses = [...this.courses];
    } else {
      this.filteredCourses = this.courses.filter(course => {
        const title = course.title?.toLowerCase() || '';
        const subject = this.getSubjectName(course).toLowerCase();
        const professor = this.getProfessorName(course).toLowerCase();
        return title.includes(query) || subject.includes(query) || professor.includes(query);
      });
    }
    this.groupCoursesByClassAndSubject();
  }

  getFileUrl(path: string): string {
    const rootUrl = ApiConstants.baseUrl.replace('/api', '');
    return rootUrl + path;
  }

  navigateToUpload() {
    this.router.navigate(['/dashboard/courses/upload']);
  }

  deleteCourse(id: string) {
    this.translate.get(['COURSES.DELETE_CONFIRM', 'COMMON.DELETE']).subscribe(msgs => {
      this.confirmation.confirm(msgs['COMMON.DELETE'], msgs['COURSES.DELETE_CONFIRM'])
        .then(confirmed => {
          if (confirmed) {
            this.http.delete(`${ApiConstants.baseUrl}${ApiConstants.courses}/${id}`)
              .subscribe({
                next: () => {
                  // Use a more robust filter and ensure a new array reference
                  this.courses = [...this.courses.filter(c => String(c._id) !== String(id))];
                  this.filterCourses();
                  this.cdr.detectChanges(); // Force UI update
                  this.translate.get('COURSES.DELETE_SUCCESS').subscribe(msg => {
                    this.toastService.success(msg || 'Cours supprimé avec succès');
                  });
                },
                error: (err) => {
                  console.error('Error deleting course:', err);
                  this.toastService.error(err.error?.message || 'Erreur lors de la suppression');
                }
              });
          }
        });
    });
  }

  getProfessorName(course: Course): string {
    if (course.professor && typeof course.professor === 'object') {
      const prof = course.professor as any;
      const name = `${prof.firstName || ''} ${prof.lastName || ''}`.trim();
      return name || this.getTranslation('COMMON.UNKNOWN');
    }
    return this.getTranslation('COMMON.UNKNOWN');
  }

  getSubjectName(course: Course): string {
    if (course.subject && typeof course.subject === 'object') {
      const subj = course.subject as any;
      return subj.name || this.getTranslation('COMMON.UNKNOWN');
    }
    return this.getTranslation('COMMON.UNKNOWN');
  }

  getClassName(course: Course): string {
    if (course.class && typeof course.class === 'object') {
      const cls = course.class as any;
      return cls.name || this.getTranslation('COMMON.UNKNOWN');
    }
    return this.getTranslation('COMMON.UNKNOWN');
  }

  private getTranslation(key: string): string {
    let val = '';
    this.translate.get(key).subscribe(v => val = v);
    return val;
  }

  groupCoursesByClassAndSubject() {
    const classMap = new Map<string, Map<string, Course[]>>();

    this.filteredCourses.forEach(course => {
      const className = this.getClassName(course);
      const subjectName = this.getSubjectName(course);

      if (!classMap.has(className)) {
        classMap.set(className, new Map<string, Course[]>());
      }

      const subjectMap = classMap.get(className)!;
      if (!subjectMap.has(subjectName)) {
        subjectMap.set(subjectName, []);
      }

      subjectMap.get(subjectName)!.push(course);
    });

    this.groupedCourses = Array.from(classMap.entries())
      .map(([className, subjectMap]) => ({
        className,
        subjects: Array.from(subjectMap.entries())
          .map(([subjectName, courses]) => ({ subjectName, courses }))
          .sort((a, b) => a.subjectName.localeCompare(b.subjectName))
      }))
      .sort((a, b) => a.className.localeCompare(b.className));
  }

  getTotalCoursesInClass(classGroup: any): number {
    return classGroup.subjects.reduce((total: number, subject: any) =>
      total + subject.courses.length, 0);
  }
}
