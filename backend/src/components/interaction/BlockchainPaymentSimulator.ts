import { PaymentData } from './ARQRCodeGenerator';

export interface TransactionResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export class BlockchainPaymentSimulator {

  async simulatePayment(qrData: PaymentData): Promise<TransactionResult> {
    try {
      // Show wallet popup simulation
      await this.showWalletPopup(qrData);
      
      return { success: true, transactionHash: this.generateTxHash() };
    } catch (error) {
      console.error('Payment simulation failed:', error);
      throw error; // Re-throw to be handled by the modal
    }
  }

  private showWalletPopup(qrData: PaymentData): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create wallet interface popup
      const walletPopup = document.createElement('div');
      walletPopup.className = 'wallet-popup';
      walletPopup.innerHTML = `
        <div class="wallet-content">
          <div class="wallet-header">
            <h3>🔗 NEAR Wallet</h3>
            <button class="close-wallet">×</button>
          </div>
          
          <div class="transaction-details">
            <h4>Confirm Transaction</h4>
            <div class="detail-row">
              <span>To:</span>
              <span class="wallet-address">${qrData.merchantAddress}</span>
            </div>
            <div class="detail-row">
              <span>Amount:</span>
              <span>${qrData.amount} ${qrData.currency || 'USDC'}</span>
            </div>
            <div class="detail-row">
              <span>Chain ID:</span>
              <span>1043 (BlockDAG Primordial)</span>
            </div>
            <div class="detail-row">
              <span>Gas Fee:</span>
              <span>0.001 BDAG</span>
            </div>
            <div class="detail-row total">
              <span>Total:</span>
              <span>${qrData.amount} ${qrData.currency || 'BDAG'} + 0.001 BDAG</span>
            </div>
            <div class="detail-row">
              <span>Memo:</span>
              <span class="memo">Payment for ${qrData.interactionType} with ${qrData.agentId}</span>
            </div>
            <div class="detail-row">
              <span>Network:</span>
              <span>BlockDAG Primordial Testnet (1043)</span>
            </div>
          </div>
          
          <div class="wallet-actions">
            <button class="btn-cancel">Cancel</button>
            <button class="btn-confirm">🦊 Sign & Send with MetaMask</button>
          </div>
          
          <div class="wallet-footer">
            <small>🔒 EIP-681 Compatible • Secured by Base Network</small>
          </div>
        </div>
      `;
      
      document.body.appendChild(walletPopup);
      
      // Handle wallet actions
      this.setupWalletActions(walletPopup, qrData, resolve, reject);
    });
  }

  private setupWalletActions(
    popup: HTMLElement, 
    qrData: PaymentData, 
    resolve: () => void, 
    reject: (reason?: any) => void
  ): void {
    const confirmBtn = popup.querySelector('.btn-confirm') as HTMLButtonElement;
    const cancelBtn = popup.querySelector('.btn-cancel') as HTMLButtonElement;
    const closeBtn = popup.querySelector('.close-wallet') as HTMLButtonElement;
    
    confirmBtn.addEventListener('click', () => {
      this.confirmPayment(popup, qrData).then(resolve).catch(reject);
    });
    
    cancelBtn.addEventListener('click', () => {
      this.cancelPayment(popup);
      reject(new Error('Payment cancelled by user'));
    });
    
    closeBtn.addEventListener('click', () => {
      this.cancelPayment(popup);
      reject(new Error('Payment cancelled by user'));
    });
  }

  private async confirmPayment(popup: HTMLElement, qrData: PaymentData): Promise<void> {
    const walletContent = popup.querySelector('.wallet-content') as HTMLElement;
    
    // Show processing state
    walletContent.innerHTML = `
      <div class="processing-state">
        <div class="spinner"></div>
        <h3>Processing Transaction...</h3> 
        <p>Broadcasting to BlockDAG network</p>
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
        <div class="transaction-steps">
          <div class="step active">Validating transaction</div>
          <div class="step">Broadcasting to network</div>
          <div class="step">Confirming on blockchain</div>
        </div>
      </div>
    `;
    
    // Simulate blockchain processing with realistic steps
    await this.simulateBlockchainSteps(walletContent);
    
    // Show success
    const txHash = this.generateTxHash();
    const blockHeight = this.generateBlockHeight();
    walletContent.innerHTML = `
      <div class="success-state">
        <div class="success-icon">✅</div>
        <h3>Transaction Successful!</h3>
        <p>Payment of ${qrData.amount} ${qrData.currency || 'BDAG'} sent</p>
        <div class="transaction-hash">
          <label>Transaction Hash:</label>
          <div class="hash-container">
            <span class="hash">${txHash}</span>
            <button class="copy-hash" onclick="navigator.clipboard.writeText('${txHash}')">📋</button>
          </div>
        </div>
        <div class="transaction-details-success">
          <div class="detail-row">
            <span>Block Height:</span>
            <span>${blockHeight}</span>
          </div>
          <div class="detail-row">
            <span>Gas Used:</span>
            <span>0.001 BDAG</span>
          </div>
          <div class="detail-row">
            <span>Status:</span>
            <span class="status-success">Confirmed</span>
          </div>
          <div class="detail-row">
            <span>Network:</span> 
            <span>${qrData.network || 'BlockDAG Primordial Testnet'}</span>
          </div>
        </div>
        <button class="btn-close">Close</button>
      </div>
    `;
    
    // Handle close button
    const closeBtn = walletContent.querySelector('.btn-close') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(popup);
      this.onPaymentSuccess(qrData, txHash);
    });
    
    // Auto-close after 5 seconds
    setTimeout(() => {
      if (document.body.contains(popup)) {
        document.body.removeChild(popup);
        this.onPaymentSuccess(qrData, txHash);
      }
    }, 5000);
  }

  private async simulateBlockchainSteps(container: HTMLElement): Promise<void> {
    const steps = container.querySelectorAll('.step');
    
    // Step 1: Validating
    await this.delay(1000);
    if (steps[1]) {
      steps[1].classList.add('active');
    }
    
    // Step 2: Broadcasting
    await this.delay(1500);
    if (steps[2]) {
      steps[2].classList.add('active');
    }
    
    // Step 3: Confirming
    await this.delay(2000);
    
    // Complete progress bar
    const progressFill = container.querySelector('.progress-fill') as HTMLElement;
    if (progressFill) {
      progressFill.style.width = '100%';
    }
    
    await this.delay(500);
  }

  private cancelPayment(popup: HTMLElement): void {
    document.body.removeChild(popup);
    this.onPaymentCancelled();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateTxHash(): string {
    // Generate realistic-looking transaction hash
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }

  private generateBlockHeight(): number {
    // Generate realistic block height
    return Math.floor(Math.random() * 1000000) + 50000000;
  }

  private onPaymentSuccess(qrData: PaymentData, txHash: string): void {
    console.log('✅ Payment successful!', { qrData, txHash });
    
    // Trigger AR success animation
    if (window.triggerPaymentSuccess) {
      window.triggerPaymentSuccess(qrData);
    }
    
    // Enable chat interface
    if (window.enableChatInterface) {
      window.enableChatInterface(qrData.agentId, qrData.interactionType);
    }
    
    // Remove QR code from AR
    if (window.removeARQRCode) {
      window.removeARQRCode();
    }
    
    // Show success notification
    this.showSuccessNotification(qrData, txHash);
  }

  private onPaymentCancelled(): void {
    console.log('❌ Payment cancelled');
    
    // Remove QR code from AR
    if (window.removeARQRCode) {
      window.removeARQRCode();
    }
  }

  private showSuccessNotification(qrData: PaymentData, _txHash: string): void {
    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'payment-success-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">🎉</div>
        <div class="notification-text">
          <h4>Payment Successful!</h4>
          <p>You can now interact with ${qrData.agentId}</p>
        </div>
        <button class="notification-close">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.classList.add('fade-out');
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }
    }, 3000);
    
    // Handle close button
    const closeBtn = notification.querySelector('.notification-close') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    });
  }
}