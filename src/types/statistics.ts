// Statistics comparison interfaces for historical data analysis

export interface PercentageChanges {
  [key: string]: string; // Format: "+12.5%" or "-3.2%"
}

export interface VehicleStatsComparison {
  current: {
    totalVehicles: number;
    availableVehicles: number;
    bookedVehicles: number;
    maintenanceVehicles: number;
    categoryBreakdown: Array<{
      category: string;
      count: number;
    }>;
    rentalServiceBreakdown: Array<{
      serviceType: string;
      count: number;
    }>;
    featuredVehicles: number;
  };
  previous: {
    totalVehicles: number;
    availableVehicles: number;
    bookedVehicles: number;
    maintenanceVehicles: number;
    categoryBreakdown: Array<{
      category: string;
      count: number;
    }>;
    rentalServiceBreakdown: Array<{
      serviceType: string;
      count: number;
    }>;
    featuredVehicles: number;
  };
  percentageChanges: PercentageChanges;
}

export interface ContractStatsComparison {
  current: {
    totalContracts: number;
    totalRevenue: number;
    activeContracts: number;
    completedContracts: number;
    cancelledContracts: number;
    pendingContracts: number;
    averageContractValue: number;
    averageRentalDuration: number;
  };
  previous: {
    totalContracts: number;
    totalRevenue: number;
    activeContracts: number;
    completedContracts: number;
    cancelledContracts: number;
    pendingContracts: number;
    averageContractValue: number;
    averageRentalDuration: number;
  };
  percentageChanges: PercentageChanges;
}

export interface ClientStatsComparison {
  current: {
    totalClients: number;
    activeClients: number;
    inactiveClients: number;
    suspendedClients: number;
    recentClients: number;
    clientsWithEmail: number;
    clientsWithoutEmail: number;
    statusBreakdown: Array<{
      status: string;
      count: number;
    }>;
  };
  previous: {
    totalClients: number;
    activeClients: number;
    inactiveClients: number;
    suspendedClients: number;
    recentClients: number;
    clientsWithEmail: number;
    clientsWithoutEmail: number;
    statusBreakdown: Array<{
      status: string;
      count: number;
    }>;
  };
  percentageChanges: PercentageChanges;
}

// Utility function for calculating percentage changes
export function calculatePercentageChange(current: number, previous: number): string {
  if (previous === 0) {
    return current > 0 ? '+100.0%' : '0%';
  }
  
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}
