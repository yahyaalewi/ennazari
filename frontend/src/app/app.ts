import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './core/components/toast-container.component';
import { ConfirmModalComponent } from './core/components/confirm-modal.component';
import { ConfirmationService } from './core/services/confirmation.service';
import { UiService } from './core/services/ui.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent, ConfirmModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected uiService = inject(UiService);
  protected confirmationService = inject(ConfirmationService);
  // showSplash and logic moved to UiService
}
