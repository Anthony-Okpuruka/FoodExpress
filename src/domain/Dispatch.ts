import { DriverStatus } from './types';

export interface DispatchDriverProps {
  driverId: string;
  name: string;
  vehicleType: string;
  plateNumber: string;
  distanceKm: number;
  status: DriverStatus;
  rating: number;
  zone: string;
}

export class DispatchDriver {
  public readonly driverId: string;
  public readonly name: string;
  public readonly vehicleType: string;
  public readonly plateNumber: string;
  public readonly distanceKm: number;
  public status: DriverStatus;
  public readonly rating: number;
  public readonly zone: string;

  constructor(props: DispatchDriverProps) {
    this.driverId = props.driverId;
    this.name = props.name;
    this.vehicleType = props.vehicleType;
    this.plateNumber = props.plateNumber;
    this.distanceKm = props.distanceKm;
    this.status = props.status;
    this.rating = props.rating;
    this.zone = props.zone;
  }

  public getEtaMinutes(): number {
    return Math.max(4, Math.round(this.distanceKm * 5.5));
  }
}

export interface HeuristicCandidate {
  driver: DispatchDriver;
  rank: number;
  eligible: boolean;
  scoreLabel: string;
  reason: string;
}

export interface DispatchMatchResult {
  assignedDriver: DispatchDriver | null;
  candidates: HeuristicCandidate[];
}

/**
 * DispatchHeuristic
 * Ranks candidate DispatchDriver objects by availability (AVAILABLE flag)
 * and ascending proximity distance in kilometers.
 */
export class DispatchHeuristic {
  public static evaluateAndAssign(drivers: DispatchDriver[]): DispatchMatchResult {
    const sorted = [...drivers].sort((a, b) => {
      const aAvail = a.status === DriverStatus.Available ? 0 : 1;
      const bAvail = b.status === DriverStatus.Available ? 0 : 1;
      if (aAvail !== bAvail) return aAvail - bAvail;
      return a.distanceKm - b.distanceKm;
    });

    let optimal: DispatchDriver | null = null;
    const candidates: HeuristicCandidate[] = sorted.map((driver, idx) => {
      const eligible = driver.status === DriverStatus.Available;
      if (eligible && !optimal) {
        optimal = driver;
      }

      const reason = !eligible
        ? `Skipped: status=${driver.status}`
        : optimal === driver
          ? `Optimal match: AVAILABLE & closest (${driver.distanceKm.toFixed(1)} km)`
          : `Standby: AVAILABLE (+${(driver.distanceKm - (optimal?.distanceKm ?? 0)).toFixed(1)} km farther)`;

      return {
        driver,
        rank: idx + 1,
        eligible,
        scoreLabel: eligible ? `${(10 - driver.distanceKm).toFixed(1)} pts` : '0.0 pts',
        reason,
      };
    });

    if (optimal) {
      (optimal as DispatchDriver).status = DriverStatus.Assigned;
    }

    return {
      assignedDriver: optimal,
      candidates,
    };
  }
}
