import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toastService.toasts()" 
           class="toast" 
           [ngClass]="toast.type"
           (click)="toastService.remove(toast.id)">
        <span class="icon">{{ getIcon(toast.type) }}</span>
        <span class="message">{{ toast.message }}</span>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }

    .toast {
      pointer-events: auto;
      min-width: 300px;
      padding: 1rem;
      border-radius: 8px;
      background: white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      animation: slideIn 0.3s ease-out forwards;
      transition: transform 0.2s;
    }

    .toast:hover {
      transform: translateY(-2px);
    }

    .toast.success { border-left: 4px solid #22c55e; }
    .toast.error { border-left: 4px solid #ef4444; }
    .toast.warning { border-left: 4px solid #f59e0b; }
    .toast.info { border-left: 4px solid #3b82f6; }

    .icon { font-size: 1.25rem; }
    
    .message {
      color: #1e293b;
      font-size: 0.95rem;
      font-weight: 500;
      line-height: 1.4;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideDown {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    /* RTL Support */
    [dir="rtl"] .toast-container { right: auto; left: 20px; }
    [dir="rtl"] .toast.success { border-left: none; border-right: 4px solid #22c55e; }
    [dir="rtl"] .toast.error { border-left: none; border-right: 4px solid #ef4444; }
    [dir="rtl"] .toast.warning { border-left: none; border-right: 4px solid #f59e0b; }
    [dir="rtl"] .toast.info { border-left: none; border-right: 4px solid #3b82f6; }
    [dir="rtl"] .toast { animation-name: slideInRTL; }

    @keyframes slideInRTL {
      from { transform: translateX(-100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    /* Mobile Styles */
    @media (max-width: 768px) {
      .toast-container {
        top: 20px;
        left: 20px;
        right: 20px;
        align-items: center;
      }

      .toast {
        min-width: 0; /* Override min-width */
        width: 100%;
        animation-name: slideDown; /* Slide down on mobile */
      }
      
      [dir="rtl"] .toast-container {
         left: 20px;
         right: 20px;
      }
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  getIcon(type: string): string {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '';
    }
  }
}
