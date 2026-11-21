import { MobileNetwork, PaymentMethodType, PaymentStatus } from './types';

export interface PaymentActionResult {
  success: boolean;
  transactionId: string;
  status: PaymentStatus;
  message: string;
  methodCall: string;
  returnLabel: string;
}

export interface GatewayAttributeSnapshot {
  className: PaymentMethodType;
  instanceName: string;
  baseAttributes: {
    transactionId: string;
    amount: number;
    status: PaymentStatus;
    timeStamp: string;
  };
  subclassAttributes: Record<string, string | number | boolean>;
}

/**
 * Abstract Superclass: PaymentGateway
 * Defines the polymorphic contract shared by all payment processors.
 */
export abstract class PaymentGateway {
  protected transactionId: string;
  protected amount: number = 0;
  protected status: PaymentStatus = PaymentStatus.Idle;
  protected timeStamp: string;
  public readonly simulateDecline: boolean;

  constructor(simulateDecline = false) {
    this.transactionId = `TXN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    this.timeStamp = new Date().toISOString();
    this.simulateDecline = simulateDecline;
  }

  public abstract getClassName(): PaymentMethodType;
  public abstract getInstanceName(): string;

  public abstract authorizePayment(amount: number): PaymentActionResult;
  public abstract processSettlement(transactionId: string): PaymentActionResult;
  public abstract issueRefund(transactionId: string, amount: number): PaymentActionResult;

  public getTransactionId(): string {
    return this.transactionId;
  }

  public getStatus(): PaymentStatus {
    return this.status;
  }

  public getAmount(): number {
    return this.amount;
  }

  protected abstract getSubclassAttributes(): Record<string, string | number | boolean>;

  public inspectAttributes(): GatewayAttributeSnapshot {
    return {
      className: this.getClassName(),
      instanceName: this.getInstanceName(),
      baseAttributes: {
        transactionId: this.transactionId,
        amount: this.amount,
        status: this.status,
        timeStamp: this.timeStamp,
      },
      subclassAttributes: this.getSubclassAttributes(),
    };
  }
}

export interface CreditCardConfig {
  cardNumber: string;
  cardholderName: string;
  expiry: string;
  cvv: string;
  simulateDecline?: boolean;
}

/**
 * Concrete Subclass: CreditCardPayment
 * Simulates card tokenization (validateCardToken) and 3D Secure pre-authorization hold.
 */
export class CreditCardPayment extends PaymentGateway {
  private cardNumberMasked: string;
  private cardholderName: string;
  private expiry: string;
  private gatewayToken: string;
  private threeDSecureStatus: 'PENDING' | '3DS_VERIFIED' | '3DS_FAILED' = 'PENDING';
  private cvvValid: boolean;

  constructor(config: CreditCardConfig) {
    super(config.simulateDecline ?? false);
    const digits = config.cardNumber.replace(/\D/g, '');
    const last4 = digits.slice(-4).padStart(4, '0');
    this.cardNumberMasked = `**** **** **** ${last4}`;
    this.cardholderName = config.cardholderName.trim() || 'Adebayo Ogunlesi';
    this.expiry = config.expiry.trim() || '08/28';
    this.cvvValid = config.cvv.replace(/\D/g, '').length >= 3;
    this.gatewayToken = `tok_visa_${last4}_${Math.random().toString(36).substring(2, 7)}`;
  }

  public getClassName(): PaymentMethodType {
    return PaymentMethodType.CreditCard;
  }

  public getInstanceName(): string {
    return 'creditCardPayment';
  }

  public validateCardToken(): boolean {
    return this.gatewayToken.startsWith('tok_') && this.cvvValid && this.expiry.includes('/');
  }

  public authorizePayment(amount: number): PaymentActionResult {
    this.amount = amount;
    this.timeStamp = new Date().toISOString();

    const tokenValid = this.validateCardToken();
    if (!tokenValid || this.simulateDecline) {
      this.status = PaymentStatus.Declined;
      this.threeDSecureStatus = '3DS_FAILED';
      return {
        success: false,
        transactionId: this.transactionId,
        status: this.status,
        message: !tokenValid
          ? 'Card token validation failed. Check expiry and CVV.'
          : '3D Secure issuer declined card authorization hold.',
        methodCall: `creditCardPayment.authorizePayment(${amount.toFixed(2)})`,
        returnLabel: 'false (DECLINED)',
      };
    }

    this.threeDSecureStatus = '3DS_VERIFIED';
    this.status = PaymentStatus.PreAuthorized;
    return {
      success: true,
      transactionId: this.transactionId,
      status: this.status,
      message: `3D Secure verified & hold placed via token ${this.gatewayToken}.`,
      methodCall: `creditCardPayment.authorizePayment(${amount.toFixed(2)})`,
      returnLabel: 'true (PRE_AUTHORIZED)',
    };
  }

  public processSettlement(transactionId: string): PaymentActionResult {
    this.timeStamp = new Date().toISOString();
    this.status = PaymentStatus.Settled;
    return {
      success: true,
      transactionId,
      status: this.status,
      message: `Captured pre-authorized hold on ${this.cardNumberMasked}.`,
      methodCall: `creditCardPayment.processSettlement("${transactionId}")`,
      returnLabel: 'true (SETTLED)',
    };
  }

  public issueRefund(transactionId: string, amount: number): PaymentActionResult {
    this.timeStamp = new Date().toISOString();
    this.status = PaymentStatus.Refunded;
    return {
      success: true,
      transactionId,
      status: this.status,
      message: `Reversed hold / issued refund of ₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })} to ${this.cardNumberMasked}.`,
      methodCall: `creditCardPayment.issueRefund("${transactionId}", ${amount.toFixed(2)})`,
      returnLabel: 'true (REFUNDED)',
    };
  }

  protected getSubclassAttributes(): Record<string, string | number | boolean> {
    return {
      cardNumberMasked: this.cardNumberMasked,
      cardholderName: this.cardholderName,
      expiry: this.expiry,
      gatewayToken: this.gatewayToken,
      threeDSecureStatus: this.threeDSecureStatus,
    };
  }
}

export interface MobileMoneyConfig {
  msisdn: string;
  networkProvider: MobileNetwork;
  ussdApproved: boolean;
  simulateDecline?: boolean;
}

/**
 * Concrete Subclass: MobileMoneyPayment
 * Simulates USSD push prompt (sendUSSDPrompt) for Nigerian Mobile Money networks.
 */
export class MobileMoneyPayment extends PaymentGateway {
  private msisdn: string;
  private networkProvider: MobileNetwork;
  private ussdSessionId: string;
  private ussdApproved: boolean;

  constructor(config: MobileMoneyConfig) {
    super(config.simulateDecline ?? false);
    this.msisdn = config.msisdn.trim() || '+234 803 456 7890';
    this.networkProvider = config.networkProvider;
    this.ussdSessionId = `USSD-${Math.floor(100000 + Math.random() * 900000)}`;
    this.ussdApproved = config.ussdApproved;
  }

  public getClassName(): PaymentMethodType {
    return PaymentMethodType.MobileMoney;
  }

  public getInstanceName(): string {
    return 'mobileMoneyPayment';
  }

  public sendUSSDPrompt(): string {
    return this.ussdSessionId;
  }

  public authorizePayment(amount: number): PaymentActionResult {
    this.amount = amount;
    this.timeStamp = new Date().toISOString();
    const session = this.sendUSSDPrompt();

    if (!this.ussdApproved || this.simulateDecline) {
      this.status = PaymentStatus.Declined;
      return {
        success: false,
        transactionId: this.transactionId,
        status: this.status,
        message: !this.ussdApproved
          ? `USSD prompt (${session}) awaiting customer PIN approval.`
          : `${this.networkProvider} declined USSD debit on ${this.msisdn}.`,
        methodCall: `mobileMoneyPayment.authorizePayment(${amount.toFixed(2)})`,
        returnLabel: 'false (DECLINED)',
      };
    }

    this.status = PaymentStatus.PreAuthorized;
    return {
      success: true,
      transactionId: this.transactionId,
      status: this.status,
      message: `${this.networkProvider} USSD session ${session} approved by ${this.msisdn}.`,
      methodCall: `mobileMoneyPayment.authorizePayment(${amount.toFixed(2)})`,
      returnLabel: 'true (PRE_AUTHORIZED)',
    };
  }

  public processSettlement(transactionId: string): PaymentActionResult {
    this.timeStamp = new Date().toISOString();
    this.status = PaymentStatus.Settled;
    return {
      success: true,
      transactionId,
      status: this.status,
      message: `Settled ${this.networkProvider} transfer (${this.ussdSessionId}).`,
      methodCall: `mobileMoneyPayment.processSettlement("${transactionId}")`,
      returnLabel: 'true (SETTLED)',
    };
  }

  public issueRefund(transactionId: string, amount: number): PaymentActionResult {
    this.timeStamp = new Date().toISOString();
    this.status = PaymentStatus.Refunded;
    return {
      success: true,
      transactionId,
      status: this.status,
      message: `Credited ₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })} back to ${this.msisdn} (${this.networkProvider}).`,
      methodCall: `mobileMoneyPayment.issueRefund("${transactionId}", ${amount.toFixed(2)})`,
      returnLabel: 'true (REFUNDED)',
    };
  }

  protected getSubclassAttributes(): Record<string, string | number | boolean> {
    return {
      msisdn: this.msisdn,
      networkProvider: this.networkProvider,
      ussdSessionId: this.ussdSessionId,
      ussdApproved: this.ussdApproved,
    };
  }
}

export interface PlatformWalletConfig {
  walletId: string;
  walletBalance: number;
  simulateDecline?: boolean;
}

/**
 * Concrete Subclass: PlatformWalletPayment
 * Verifies internal stored balance (verifyBalance) and performs instant ledger settlement.
 */
export class PlatformWalletPayment extends PaymentGateway {
  private walletId: string;
  private walletBalance: number;

  constructor(config: PlatformWalletConfig) {
    super(config.simulateDecline ?? false);
    this.walletId = config.walletId;
    this.walletBalance = config.walletBalance;
  }

  public getClassName(): PaymentMethodType {
    return PaymentMethodType.PlatformWallet;
  }

  public getInstanceName(): string {
    return 'platformWalletPayment';
  }

  public getWalletBalance(): number {
    return this.walletBalance;
  }

  public verifyBalance(amount: number): boolean {
    return this.walletBalance >= amount;
  }

  public authorizePayment(amount: number): PaymentActionResult {
    this.amount = amount;
    this.timeStamp = new Date().toISOString();

    if (!this.verifyBalance(amount) || this.simulateDecline) {
      this.status = PaymentStatus.Declined;
      return {
        success: false,
        transactionId: this.transactionId,
        status: this.status,
        message: !this.verifyBalance(amount)
          ? `Insufficient balance in ${this.walletId} (₦${this.walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })} available).`
          : `Wallet risk guard declined transaction on ${this.walletId}.`,
        methodCall: `platformWalletPayment.authorizePayment(${amount.toFixed(2)})`,
        returnLabel: 'false (DECLINED)',
      };
    }

    this.walletBalance = Math.max(0, this.walletBalance - amount);
    this.status = PaymentStatus.PreAuthorized;
    return {
      success: true,
      transactionId: this.transactionId,
      status: this.status,
      message: `Reserved ₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })} from ${this.walletId}.`,
      methodCall: `platformWalletPayment.authorizePayment(${amount.toFixed(2)})`,
      returnLabel: 'true (PRE_AUTHORIZED)',
    };
  }

  public processSettlement(transactionId: string): PaymentActionResult {
    this.timeStamp = new Date().toISOString();
    this.status = PaymentStatus.Settled;
    return {
      success: true,
      transactionId,
      status: this.status,
      message: `Instant ledger settlement completed for ${this.walletId}.`,
      methodCall: `platformWalletPayment.processSettlement("${transactionId}")`,
      returnLabel: 'true (SETTLED)',
    };
  }

  public issueRefund(transactionId: string, amount: number): PaymentActionResult {
    this.timeStamp = new Date().toISOString();
    this.walletBalance += amount;
    this.status = PaymentStatus.Refunded;
    return {
      success: true,
      transactionId,
      status: this.status,
      message: `Instant wallet credit of ₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })} returned to ${this.walletId}.`,
      methodCall: `platformWalletPayment.issueRefund("${transactionId}", ${amount.toFixed(2)})`,
      returnLabel: 'true (REFUNDED)',
    };
  }

  protected getSubclassAttributes(): Record<string, string | number | boolean> {
    return {
      walletId: this.walletId,
      walletBalance: `₦${this.walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
    };
  }
}
