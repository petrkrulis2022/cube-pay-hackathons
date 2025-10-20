import QRCode from 'qrcode';

export interface PaymentData {
  agentId: string;
  interactionType: string;
  amount: number;
  transactionId: string;
  timestamp: number;
  walletAddress: string;
  merchantAddress: string;
  currency: string;
  network: string;
  chainId?: number;
}

export interface EIP681Data {
  to: string;
  value?: string;
  gas?: string;
  gasPrice?: string;
  chainId?: number;
  functionName?: string;
  argsDefaults?: any[];
}

export interface BlockchainData {
  to: string;
  amount: number;
  currency: string;
  memo: string;
  transactionId: string;
  network: string;
  timestamp: number;
  chainId?: number;
  gasPrice?: string;
  gasLimit?: string;
}

export class ARQRCodeGenerator {
  private scene: any;
  private qrCodeObject: any = null;
  private glowMesh: any = null;
  private textMesh: any = null;
  private animationFrameId: number | null = null;

  constructor(scene: any) {
    this.scene = scene;
  }

  async generateQRCode(paymentData: PaymentData): Promise<void> {
    try {
      // Generate QR code content (blockchain transaction data)
      const qrContent = this.createBlockchainQRContent(paymentData);
      
      // Create QR code texture using QR.js library
      const qrCodeTexture = await this.generateQRTexture(qrContent);
      
      // Create 3D QR code object in AR space
      this.createARQRObject(qrCodeTexture, paymentData);
      
      // Add visual effects
      this.addQREffects();
      
      console.log('🎯 AR QR Code generated successfully!', paymentData);
    } catch (error) {
      console.error('❌ Failed to generate AR QR Code:', error);
    }
  }

  private createBlockchainQRContent(paymentData: PaymentData): string {
    // Create strict EIP-681 compliant URL format for USDC ERC-20 token transfers
    // Format: ethereum:<token_contract_address>@<chain_id>/transfer?address=<recipient_address>&uint256=<amount_in_wei>
    const tokenContractAddress = '0x6533fe2Ebb66CcE28FDdBA9663Fe433A308137e9'; // BDAG Token Contract Address
    const recipientAddress = paymentData.merchantAddress;
    const amountInWei = (paymentData.amount * Math.pow(10, 18)).toString(); // BDAG has 18 decimals
    const chainId = 1043; // BlockDAG Primordial Testnet
    
    // Strict EIP-681 format for ERC-20 token transfers (no gas parameter for token transfers)
    // This format lets MetaMask choose the active account automatically
    const eip681Url = `ethereum:${tokenContractAddress}@${chainId}/transfer?address=${recipientAddress}&uint256=${amountInWei}`;
    
    console.log('🎯 Creating Strict EIP-681 BDAG Transfer QR Code:');
    console.log('📋 QR Code URL:', eip681Url);
    console.log('📋 Transaction Details:', {
      tokenContract: tokenContractAddress,
      tokenSymbol: 'BDAG',
      recipient: recipientAddress,
      amountBDAG: paymentData.amount,
      amountWei: amountInWei,
      chainId: chainId,
      network: 'BlockDAG Primordial Testnet',
      rpc: 'https://test-rpc.primordial.bdagscan.com/',
      format: 'Strict EIP-681 ERC-20 Transfer (No Gas Parameter)'
    });
    
    return eip681Url;
  }

  private async generateQRTexture(content: string): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        canvas.width = 512;
        canvas.height = 512;
        
        // Generate EIP-681 compliant QR code for MetaMask compatibility
        QRCode.toCanvas(canvas, content, {
          width: 512,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'H' // Higher error correction for better scanning
        }, (error: Error | null | undefined) => {
          if (error) {
            console.error('❌ Strict EIP-681 QR code generation failed:', error);
            reject(error);
          } else {
            console.log('✅ Strict EIP-681 compliant QR code generated successfully');
            resolve(canvas);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private createARQRObject(qrTexture: HTMLCanvasElement, paymentData: PaymentData): void {
    // Remove existing QR code if any
    this.removeQRCode();

    // Create enhanced 3D QR code object using A-Frame
    const qrEntity = document.createElement('a-entity');
    qrEntity.setAttribute('geometry', {
      primitive: 'plane',
      width: 0.4,
      height: 0.4
    });

    // Create high-quality texture from canvas
    const textureDataURL = qrTexture.toDataURL('image/png', 1.0);
    
    qrEntity.setAttribute('material', {
      src: textureDataURL,
      transparent: true,
      alphaTest: 0.1,
      shader: 'flat'
    });

    // Position QR code at optimal viewing distance
    qrEntity.setAttribute('position', '0 2.0 -1.5');
    qrEntity.setAttribute('rotation', '0 0 0');
    
    // Make QR code always face the camera
    qrEntity.setAttribute('look-at', '[camera]');
    
    // Add subtle animation
    qrEntity.setAttribute('animation', {
      property: 'rotation',
      to: '0 360 0',
      loop: true,
      dur: 20000,
      easing: 'linear'
    });
    
    // Add click handler for QR code scanning simulation
    qrEntity.addEventListener('click', () => {
      this.handleQRCodeScan(paymentData);
    });

    // Add to scene
    if (this.scene && this.scene.appendChild) {
      this.scene.appendChild(qrEntity);
    } else {
      // Fallback: add to a-scene directly
      const aScene = document.querySelector('a-scene');
      if (aScene) {
        aScene.appendChild(qrEntity);
      }
    }

    this.qrCodeObject = qrEntity;
    
    // Add payment info display
    this.addPaymentInfoDisplay(paymentData);
  }

  private addQREffects(): void {
    if (!this.qrCodeObject) return;

    // Create enhanced glowing effect
    const glowEntity = document.createElement('a-entity');
    glowEntity.setAttribute('geometry', {
      primitive: 'plane',
      width: 0.45,
      height: 0.45
    });
    glowEntity.setAttribute('material', {
      color: '#4F46E5',
      transparent: true,
      opacity: 0.2,
      shader: 'flat'
    });
    glowEntity.setAttribute('position', '0 2.0 -1.51');
    glowEntity.setAttribute('look-at', '[camera]');

    const aScene = document.querySelector('a-scene');
    if (aScene) {
      aScene.appendChild(glowEntity);
    }

    this.glowMesh = glowEntity;

    // Add enhanced pulsing glow effect
    glowEntity.setAttribute('animation', {
      property: 'material.opacity',
      to: '0.4',
      direction: 'alternate',
      loop: true,
      dur: 1500,
      easing: 'easeInOutSine'
    });
    
    // Add scale pulsing effect
    glowEntity.setAttribute('animation__scale', {
      property: 'scale',
      to: '1.1 1.1 1.1',
      direction: 'alternate',
      loop: true,
      dur: 2000,
      easing: 'easeInOutSine'
    });
  }

  private addPaymentInfoDisplay(paymentData: PaymentData): void {
    // Create floating text display above QR code
    const textEntity = document.createElement('a-entity');

    const paymentText = `${paymentData.amount} USDC\n${paymentData.interactionType.toUpperCase()} CHAT\nTo: ${paymentData.merchantAddress.slice(0, 6)}...${paymentData.merchantAddress.slice(-4)}\nScan with MetaMask\nExpires in 5:00`;
    
    textEntity.setAttribute('text', {
      value: paymentText,
      align: 'center',
      color: '#4F46E5',
      font: 'kelsonsans',
      width: 6,
      position: '0 0 0.1'
    });
    
    textEntity.setAttribute('position', '0 2.4 -1.5');
    textEntity.setAttribute('look-at', '[camera]');
    
    // Add background plane for better readability
    const bgEntity = document.createElement('a-entity');
    bgEntity.setAttribute('geometry', {
      primitive: 'plane',
      width: 1.2,
      height: 0.6
    });
    bgEntity.setAttribute('material', {
      color: '#000000',
      transparent: true,
      opacity: 0.7
    });
    bgEntity.setAttribute('position', '0 2.4 -1.51');
    bgEntity.setAttribute('look-at', '[camera]');

    const aScene = document.querySelector('a-scene');
    if (aScene) {
      aScene.appendChild(textEntity);
      aScene.appendChild(bgEntity);
    }

    this.textMesh = textEntity;

    // Add timer countdown
    this.startPaymentTimer();
  }

  private startPaymentTimer(): void {
    let timeLeft = 300; // 5 minutes in seconds
    
    const updateTimer = () => {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      if (this.textMesh) {
        const currentText = this.textMesh.getAttribute('text').value;
        const updatedText = currentText.replace(/Expires in \d+:\d+/, `Expires in ${timeString}`);
        this.textMesh.setAttribute('text', 'value', updatedText);
      }
      
      timeLeft--;
      
      if (timeLeft >= 0) {
        setTimeout(updateTimer, 1000);
      } else {
        // Timer expired, remove QR code
        this.removeQRCode();
        this.onPaymentExpired();
      }
    };
    
    updateTimer();
  }

  private handleQRCodeScan(paymentData: PaymentData): void {
    console.log('🔍 QR Code scanned!', paymentData);
    
    // Show MetaMask-compatible transaction details
    const transactionDetails = {
      to: paymentData.merchantAddress,
      value: `${paymentData.amount} BDAG`,
      chainId: 1043,
      network: 'BlockDAG Primordial Testnet'
    };
    
    console.log('📱 MetaMask transaction details:', transactionDetails);
    
    // Trigger blockchain payment simulation
    if (window.blockchainPaymentSimulator) {
      window.blockchainPaymentSimulator.simulatePayment(paymentData);
    } else {
      // Fallback: show alert
      alert(`MetaMask Compatible QR Code Scanned!\nAmount: ${paymentData.amount} BDAG\nTo: ${paymentData.merchantAddress}\nAgent: ${paymentData.agentId}\nType: ${paymentData.interactionType}\nChain ID: 1043`);
    }
  }

  private onPaymentExpired(): void {
    console.log('⏰ Payment QR code expired');
    // Notify the interaction modal that payment expired
    if (window.onPaymentExpired) {
      window.onPaymentExpired();
    }
  }

  removeQRCode(): void {
    const aScene = document.querySelector('a-scene');
    
    if (this.qrCodeObject && aScene) {
      aScene.removeChild(this.qrCodeObject);
      this.qrCodeObject = null;
    }
    
    if (this.glowMesh && aScene) {
      aScene.removeChild(this.glowMesh);
      this.glowMesh = null;
    }
    
    if (this.textMesh && aScene) {
      aScene.removeChild(this.textMesh);
      this.textMesh = null;
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  getAgentPosition(agentId: string): { x: number; y: number; z: number } {
    // Try to find the agent in the scene
    const agentElement = document.querySelector(`[data-agent-id="${agentId}"]`);
    if (agentElement) {
      const positionAttr = agentElement.getAttribute('position');
      if (positionAttr && typeof positionAttr === 'string') {
        // Parse position string like "1 2 3" into object
        const coords = positionAttr.split(' ').map(Number);
        return {
          x: coords[0] || 0,
          y: coords[1] || 1.6,
          z: coords[2] || -2
        };
      }
      // If position attribute exists but is an object
      const position = agentElement.getAttribute('position') as any;
      return {
        x: position.x || 0,
        y: position.y || 1.6,
        z: position.z || -2
      };
    }
    
    // Try to get position from current agent reference
    if ((this as any).currentAgent) {
      // Use the same positioning logic as in ARViewer
      const angle = Math.random() * 360 * Math.PI / 180;
      const radius = 8;
      return {
        x: Math.sin(angle) * radius * 0.8,
        y: 2.5, // Slightly higher than agent
        z: -Math.cos(angle) * radius * 0.8
      };
    }
    
    // Default position
    return { x: 0, y: 1.6, z: -2 };
  }
}

// Global utility functions
export const generateTransactionId = (): string => {
  return 'tx_' + Math.random().toString(36).substr(2, 16) + Date.now().toString(36);
};

export const formatCurrency = (amount: number, currency: string = 'USDFC'): string => {
  return `${amount} ${currency}`;
};

// Global type declarations for window object
declare global {
  interface Window {
    generateARQRCode?: (paymentData: PaymentData) => void;
    removeARQRCode?: () => void;
    triggerPaymentSuccess?: (qrData: PaymentData) => void;
    enableChatInterface?: (agentId: string, interactionType: string) => void;
    onPaymentExpired?: () => void;
    blockchainPaymentSimulator?: any;
  }
}