import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './core/components/toast-container.component';
import { ConfirmModalComponent } from './core/components/confirm-modal.component';
import { ConfirmationService } from './core/services/confirmation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent, ConfirmModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
  protected confirmationService = inject(ConfirmationService);
  protected showSplash = signal(true);

  ngOnInit() {
    setTimeout(() => {
      this.showSplash.set(false);
    }, 2000);
  }
}
