import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="login-container">
      <div class="glass-card">
        <div class="brand-header">
          <img src="logo.jpg" alt="Ennazari Logo" class="brand-logo">
          <h2>{{ 'LOGIN.WELCOME' | translate }}</h2>
          <p>{{ 'LOGIN.SUBTITLE' | translate }}</p>
        </div>
        
        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">{{ 'LOGIN.EMAIL' | translate }}</label>
            <div class="input-wrapper">
              <span class="input-icon">✉️</span>
              <input type="email" id="email" [(ngModel)]="email" name="email" [placeholder]="'LOGIN.EMAIL_PLACEHOLDER' | translate" required>
            </div>
          </div>
          
          <div class="form-group">
            <label for="password">{{ 'LOGIN.PASSWORD' | translate }}</label>
            <div class="input-wrapper">
              <span class="input-icon">🔒</span>
              <input type="password" id="password" [(ngModel)]="password" name="password" placeholder="••••••••" required>
            </div>
          </div>
          
          <button type="submit" [disabled]="loading" class="btn-primary">
            <span *ngIf="!loading">{{ 'LOGIN.SUBMIT' | translate }}</span>
            <span *ngIf="loading" class="loader"></span>
          </button>
          
          <div class="error-toast" *ngIf="error">
            ⚠️ {{ error }}
          </div>
        </form>

        <div class="login-lang-switcher">
          <button (click)="setLang('fr')" [class.active]="currentLang() === 'fr'">Français</button>
          <button (click)="setLang('ar')" [class.active]="currentLang() === 'ar'">العربية</button>
        </div>
      </div>
      
      <!-- Background Blobs -->
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
    </div>
  `,
  styles: [`
    .login-container {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
      overflow: hidden;
    }
    
    .glass-card {
      position: relative;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px);
      padding: 3rem;
      border-radius: 24px;
      box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.4);
      width: 100%;
      max-width: 420px;
      min-height: 620px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      z-index: 10;
      animation: floatUp 0.6s ease-out;
    }
    
    .brand-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .brand-logo {
      width: 120px;
      height: 120px;
      object-fit: contain;
      margin-bottom: 1.5rem;
      border-radius: 50%; /* Optional: if the logo should be round */
      /* filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); */
    }

    h2 { color: var(--text-main); font-size: 1.8rem; margin-bottom: 0.5rem; }
    p { color: var(--text-muted); font-size: 0.95rem; }
    
    .form-group { margin-bottom: 1.5rem; }
    label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: var(--text-main); font-size: 0.9rem; }
    
    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-icon {
      position: absolute;
      left: 1rem;
      font-size: 1.1rem;
      opacity: 0.6;
    }

    [dir="rtl"] .input-icon { left: auto; right: 1rem; }

    input {
      width: 100%;
      padding: 0.85rem 1rem 0.85rem 3rem;
      border: 2px solid transparent;
      background: #f1f5f9;
      border-radius: 12px;
      font-size: 1rem;
      font-family: inherit;
      transition: var(--transition);
    }

    [dir="rtl"] input { padding: 0.85rem 3rem 0.85rem 1rem; }

    input:focus {
      outline: none;
      background: white;
      border-color: var(--primary);
      box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
    }
    
    .btn-primary {
      width: 100%;
      padding: 0.95rem;
      background: linear-gradient(to right, var(--primary), var(--primary-dark));
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      transition: var(--transition);
      box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
    }
    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
    }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
    
    .error-toast {
      margin-top: 1.5rem;
      padding: 0.75rem;
      background: #fef2f2;
      border-left: 4px solid var(--danger);
      color: #991b1b;
      border-radius: 6px;
      font-size: 0.9rem;
      animation: shake 0.4s ease-in-out;
    }

    .login-lang-switcher {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(0,0,0,0.05);
    }

    .login-lang-switcher button {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: var(--transition);
    }

    .login-lang-switcher button.active {
      color: var(--primary);
      font-weight: 700;
    }
    
    /* Decoration */
    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      opacity: 0.6;
      z-index: 0;
    }
    .blob-1 {
      top: -10%;
      left: -10%;
      width: 300px;
      height: 300px;
      background: var(--primary-light);
    }
    .blob-2 {
      bottom: -10%;
      right: -10%;
      width: 350px;
      height: 350px;
      background: var(--secondary);
    }
    
    @keyframes floatUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }

    @media (max-width: 480px) {
      .glass-card {
        padding: 2rem 1.5rem;
        margin: 1.5rem;
        border-radius: 16px;
      }
      .brand-logo { width: 100px; height: 100px; }
      h2 { font-size: 1.5rem; }
      .blob { filter: blur(40px); }
    }
  `]
})

export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';

  private i18nService = inject(I18nService);
  private translate = inject(TranslateService);
  currentLang = this.i18nService.currentLang;

  constructor(private authService: AuthService, private router: Router) { }

  setLang(lang: 'fr' | 'ar') {
    this.i18nService.setLanguage(lang);
  }

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.translate.get('LOGIN.ERROR').subscribe(msg => {
          this.error = msg;
        });
        this.loading = false;
      }
    });
  }
}
