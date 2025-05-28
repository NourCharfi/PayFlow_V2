import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-delete-confirmation-dialog',
  template: `
    <div class="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-content animate__animated animate__fadeInDown">
          <div class="modal-header border-0 pb-0">
            <button type="button" class="btn-close custom-close" aria-label="Close" (click)="dismiss()">
              <i class="bi bi-x"></i>
            </button>
          </div>
          <div class="modal-body text-center px-5 pb-5">
            <div class="confirmation-icon mb-4">
              <div class="icon-circle animate__animated animate__pulse animate__infinite">
                <i class="bi bi-exclamation-triangle"></i>
              </div>
            </div>
            <h4 class="modal-title h3 mb-3">{{ title }}</h4>
            <p class="text-muted mb-4">{{ message }}</p>
            <div class="d-flex justify-content-center gap-3">
              <button type="button" class="btn btn-cancel" (click)="dismiss()">
                <i class="bi bi-x me-2"></i>{{ cancelText }}
              </button>
              <button type="button" class="btn btn-confirm" (click)="confirm()">
                <i class="bi bi-trash me-2"></i>{{ confirmText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-content {
      border: none;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      max-width: 450px;
      margin: auto;
    }
    .confirmation-icon {
      position: relative;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon-circle {
      width: 80px;
      height: 80px;
      background: #fff0f0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon-circle i {
      font-size: 2.5rem;
      color: #dc3545;
    }
    .modal-title {
      color: #2d3748;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    p {
      color: #718096;
      font-size: 1.1rem;
      line-height: 1.6;
    }
    .btn {
      font-weight: 600;
      min-width: 140px;
      padding: 12px 24px;
      border-radius: 12px;
      transition: all 0.2s ease;
      font-size: 1rem;
    }
    .btn-cancel {
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      color: #4a5568;
    }
    .btn-cancel:hover {
      background: #edf2f7;
      color: #2d3748;
    }
    .btn-confirm {
      background: #dc3545;
      border: 1px solid #dc3545;
      color: white;
    }
    .btn-confirm:hover {
      background: #c82333;
      border-color: #bd2130;
      transform: translateY(-1px);
    }
    .custom-close {
      position: absolute;
      right: 1.5rem;
      top: 1.5rem;
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #a0aec0;
      transition: color 0.2s ease;
    }
    .custom-close:hover {
      color: #2d3748;
    }
  `]
})
export class DeleteConfirmationDialogComponent {
  title = 'Supprimer le produit';
  message = 'Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.';
  confirmText = 'Supprimer';
  cancelText = 'Annuler';

  constructor(private activeModal: NgbActiveModal) {}

  confirm() {
    this.activeModal.close(true);
  }

  dismiss() {
    this.activeModal.dismiss(false);
  }
}
