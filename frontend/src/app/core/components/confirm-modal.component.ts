import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-confirm-modal',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    template: `
    <div class="confirm-overlay" *ngIf="isOpen" (click)="close(false)">
      <div class="confirm-modal" (click)="$event.stopPropagation()">
        <div class="confirm-header">
          <h3>{{ title }}</h3>
        </div>
        <div class="confirm-body">
          <p>{{ message }}</p>
        </div>
        <div class="confirm-footer">
          <button class="btn-cancel" (click)="close(false)">{{ 'COMMON.CANCEL' | translate }}</button>
          <button class="btn-confirm" (click)="close(true)">{{ 'COMMON.DELETE' | translate }}</button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .confirm-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(2px);
      animation: fadeIn 0.2s ease-out;
      padding: 1rem;
    }

    .confirm-modal {
      background: white;
      border-radius: 12px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      overflow: hidden;
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .confirm-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .confirm-header h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #1e293b;
      font-weight: 600;
    }

    .confirm-body {
      padding: 1.5rem;
      color: #475569;
      font-size: 1rem;
      line-height: 1.5;
    }

    .confirm-footer {
      padding: 1.25rem 1.5rem;
      background: #f8fafc;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }

    .btn-cancel, .btn-confirm {
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      font-size: 0.95rem;
      transition: all 0.2s;
    }

    .btn-cancel {
      background: white;
      border: 1px solid #cbd5e1;
      color: #64748b;
    }

    .btn-cancel:hover {
      background: #f1f5f9;
    }

    .btn-confirm {
      background: #ef4444; /* Destructive red */
      color: white;
      box-shadow: 0 2px 5px rgba(239, 68, 68, 0.2);
    }

    .btn-confirm:hover {
      background: #dc2626;
      transform: translateY(-1px);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    /* Mobile adjustments */
    @media (max-width: 480px) {
      .confirm-footer {
        flex-direction: column-reverse;
      }
      .btn-cancel, .btn-confirm {
        width: 100%;
        padding: 1rem;
        font-size: 1rem;
      }
    }
  `]
})
export class ConfirmModalComponent {
    @Input() isOpen = false;
    @Input() title = '';
    @Input() message = '';
    @Output() confirm = new EventEmitter<boolean>();

    close(result: boolean) {
        this.confirm.emit(result);
    }
}
