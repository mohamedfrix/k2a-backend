import { Request, Response } from 'express';
import { ContractService } from '../services/ContractService';
import { 
  CreateContractRequest, 
  UpdateContractRequest, 
  ContractQuery,
  VehicleAvailabilityRequest,
  BulkContractStatusUpdate
} from '../types/contract';
import { logger } from '../utils/logger';

export class ContractController {
  constructor(private contractService: ContractService) {}

  // Helper method for consistent error responses
  private sendError(res: Response, message: string, statusCode: number = 500, details?: any): Response {
    logger.error(`ContractController Error: ${message}`, { statusCode, details });
    return res.status(statusCode).json({
      success: false,
      message,
      ...(details && { details })
    });
  }

  // Helper method for consistent success responses
  private sendSuccess(res: Response, data: any, message: string = 'Success', statusCode: number = 200): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  // Helper method for error handling
  private handleError(error: any, res: Response, operation: string): Response {
    logger.error(`ContractController.${operation} Error:`, error);
    
    if (error.message) {
      return this.sendError(res, error.message, 400);
    }
    
    return this.sendError(res, 'An unexpected error occurred', 500);
  }

  // Create a new contract
  createContract = async (req: Request, res: Response): Promise<Response> => {
    try {
      const requestData: CreateContractRequest = req.body;
      const adminId = (req as any).admin?.id; // From auth middleware

      const contractInput = {
        ...requestData,
        startDate: new Date(requestData.startDate),
        endDate: new Date(requestData.endDate),
        adminId,
        accessories: requestData.accessories?.map(acc => ({
          name: acc.name,
          price: acc.price,
          quantity: acc.quantity || 1
        })) || []
      };

      const contract = await this.contractService.createContract(contractInput);
      return this.sendSuccess(res, contract, 'Contract created successfully', 201);
    } catch (error) {
      return this.handleError(error, res, 'createContract');
    }
  };

  // Get all contracts
  getContracts = async (req: Request, res: Response): Promise<Response> => {
    try {
      const query: ContractQuery = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        clientId: req.query.clientId as string,
        vehicleId: req.query.vehicleId as string,
        status: req.query.status as any,
        paymentStatus: req.query.paymentStatus as any,
        serviceType: req.query.serviceType as any,
        contractNumber: req.query.contractNumber as string,
        sortBy: req.query.sortBy as any || 'createdAt',
        sortOrder: req.query.sortOrder as any || 'desc'
      };

      // Parse date filters if provided
      if (req.query.startDate) {
        query.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        query.endDate = new Date(req.query.endDate as string);
      }

      const result = await this.contractService.getContracts(query);
      return this.sendSuccess(res, result, 'Contracts retrieved successfully');
    } catch (error) {
      return this.handleError(error, res, 'getContracts');
    }
  };

  // Get contract by ID
  getContractById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const contract = await this.contractService.getContractById(id);
      
      if (!contract) {
        return this.sendError(res, 'Contract not found', 404);
      }

      return this.sendSuccess(res, contract, 'Contract retrieved successfully');
    } catch (error) {
      return this.handleError(error, res, 'getContractById');
    }
  };

  // Update contract
  updateContract = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const updateData: UpdateContractRequest = req.body;
      const adminId = (req as any).admin?.id;

      const updateInput: any = {
        ...updateData,
        ...(updateData.startDate && { startDate: new Date(updateData.startDate) }),
        ...(updateData.endDate && { endDate: new Date(updateData.endDate) }),
        ...(updateData.accessories && {
          accessories: updateData.accessories.map(acc => ({
            name: acc.name,
            price: acc.price,
            quantity: acc.quantity || 1
          }))
        })
      };

      const contract = await this.contractService.updateContract(id, updateInput, adminId);
      return this.sendSuccess(res, contract, 'Contract updated successfully');
    } catch (error) {
      return this.handleError(error, res, 'updateContract');
    }
  };

  // Cancel contract
  cancelContract = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const adminId = (req as any).admin?.id;

      const contract = await this.contractService.cancelContract(id, adminId);
      return this.sendSuccess(res, contract, 'Contract cancelled successfully');
    } catch (error) {
      return this.handleError(error, res, 'cancelContract');
    }
  };

  // Confirm contract
  confirmContract = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const adminId = (req as any).admin?.id;

      const contract = await this.contractService.confirmContract(id, adminId);
      return this.sendSuccess(res, contract, 'Contract confirmed successfully');
    } catch (error) {
      return this.handleError(error, res, 'confirmContract');
    }
  };

  // Start contract
  startContract = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const adminId = (req as any).admin?.id;

      const contract = await this.contractService.startContract(id, adminId);
      return this.sendSuccess(res, contract, 'Contract started successfully');
    } catch (error) {
      return this.handleError(error, res, 'startContract');
    }
  };

  // Complete contract
  completeContract = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const adminId = (req as any).admin?.id;

      const contract = await this.contractService.completeContract(id, adminId);
      return this.sendSuccess(res, contract, 'Contract completed successfully');
    } catch (error) {
      return this.handleError(error, res, 'completeContract');
    }
  };

  // Update payment
  updatePayment = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const { paidAmount } = req.body;
      const adminId = (req as any).admin?.id;

      if (typeof paidAmount !== 'number') {
        return this.sendError(res, 'Paid amount must be a number', 400);
      }

      const contract = await this.contractService.updatePayment(id, paidAmount, adminId);
      return this.sendSuccess(res, contract, 'Payment updated successfully');
    } catch (error) {
      return this.handleError(error, res, 'updatePayment');
    }
  };

  // Check vehicle availability
  checkVehicleAvailability = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { vehicleId } = req.params;
      const { startDate, endDate, excludeContractId } = req.query;

      if (!startDate || !endDate) {
        return this.sendError(res, 'Start date and end date are required', 400);
      }

      const request: VehicleAvailabilityRequest = {
        vehicleId,
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        excludeContractId: excludeContractId as string
      };

      if (isNaN(request.startDate.getTime()) || isNaN(request.endDate.getTime())) {
        return this.sendError(res, 'Invalid date format', 400);
      }

      if (request.startDate >= request.endDate) {
        return this.sendError(res, 'Start date must be before end date', 400);
      }

      const availability = await this.contractService.checkVehicleAvailability(request);
      return this.sendSuccess(res, availability, 'Vehicle availability checked successfully');
    } catch (error) {
      return this.handleError(error, res, 'checkVehicleAvailability');
    }
  };

  // Get vehicle calendar
  getVehicleCalendar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { vehicleId } = req.params;
      const { month, year } = req.query;

      if (!month || !year) {
        return this.sendError(res, 'Month and year are required', 400);
      }

      const monthNum = parseInt(month as string);
      const yearNum = parseInt(year as string);

      if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
        return this.sendError(res, 'Invalid month or year', 400);
      }

      const calendar = await this.contractService.getVehicleCalendar(vehicleId, monthNum, yearNum);
      return this.sendSuccess(res, calendar, 'Vehicle calendar retrieved successfully');
    } catch (error) {
      return this.handleError(error, res, 'getVehicleCalendar');
    }
  };

  // Get contract statistics
  getContractStats = async (req: Request, res: Response): Promise<Response> => {
    try {
      const stats = await this.contractService.getContractStats();
      return this.sendSuccess(res, stats, 'Contract statistics retrieved successfully');
    } catch (error) {
      return this.handleError(error, res, 'getContractStats');
    }
  };

  // Get contract statistics comparison
  getContractStatsComparison = async (req: Request, res: Response): Promise<Response> => {
    try {
      const period = parseInt(req.query.period as string) || 30;
      
      if (period <= 0 || period > 365) {
        return this.sendError(res, 'Period must be between 1 and 365 days', 400);
      }

      const comparison = await this.contractService.getContractStatsComparison(period);
      return this.sendSuccess(res, comparison, 'Contract statistics comparison retrieved successfully');
    } catch (error) {
      return this.handleError(error, res, 'getContractStatsComparison');
    }
  };

  // Get dashboard data
  getDashboardData = async (req: Request, res: Response): Promise<Response> => {
    try {
      const data = await this.contractService.getDashboardData();
      return this.sendSuccess(res, data, 'Dashboard data retrieved successfully');
    } catch (error) {
      return this.handleError(error, res, 'getDashboardData');
    }
  };

  // Bulk update contract status
  bulkUpdateStatus = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { contractIds, status }: BulkContractStatusUpdate = req.body;
      const adminId = (req as any).admin?.id;

      if (!contractIds || !Array.isArray(contractIds) || contractIds.length === 0) {
        return this.sendError(res, 'Contract IDs array is required', 400);
      }

      if (!status) {
        return this.sendError(res, 'Status is required', 400);
      }

      const result = await this.contractService.bulkUpdateStatus(contractIds, status, adminId);
      return this.sendSuccess(res, result, 'Contracts updated successfully');
    } catch (error) {
      return this.handleError(error, res, 'bulkUpdateStatus');
    }
  };

  // Delete contract
  deleteContract = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      
      const success = await this.contractService.deleteContract(id);
      if (!success) {
        return this.sendError(res, 'Failed to delete contract', 500);
      }

      return this.sendSuccess(res, null, 'Contract deleted successfully');
    } catch (error) {
      return this.handleError(error, res, 'deleteContract');
    }
  };

  // Get contracts by client
  getContractsByClient = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { clientId } = req.params;
      const query: Partial<ContractQuery> = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        status: req.query.status as any,
        sortBy: req.query.sortBy as any || 'createdAt',
        sortOrder: req.query.sortOrder as any || 'desc'
      };

      const result = await this.contractService.getContractsByClient(clientId, query);
      return this.sendSuccess(res, result, 'Client contracts retrieved successfully');
    } catch (error) {
      return this.handleError(error, res, 'getContractsByClient');
    }
  };

  // Get contracts by vehicle
  getContractsByVehicle = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { vehicleId } = req.params;
      const query: Partial<ContractQuery> = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        status: req.query.status as any,
        sortBy: req.query.sortBy as any || 'createdAt',
        sortOrder: req.query.sortOrder as any || 'desc'
      };

      const result = await this.contractService.getContractsByVehicle(vehicleId, query);
      return this.sendSuccess(res, result, 'Vehicle contracts retrieved successfully');
    } catch (error) {
      return this.handleError(error, res, 'getContractsByVehicle');
    }
  };

  // Get today's active contracts
  getTodayActiveContracts = async (req: Request, res: Response): Promise<Response> => {
    try {
      const contracts = await this.contractService.getTodayActiveContracts();
      return this.sendSuccess(res, contracts, 'Today\'s active contracts retrieved successfully');
    } catch (error) {
      return this.handleError(error, res, 'getTodayActiveContracts');
    }
  };

  // Get contracts ending soon
  getContractsEndingSoon = async (req: Request, res: Response): Promise<Response> => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const contracts = await this.contractService.getContractsEndingSoon(days);
      return this.sendSuccess(res, contracts, 'Contracts ending soon retrieved successfully');
    } catch (error) {
      return this.handleError(error, res, 'getContractsEndingSoon');
    }
  };

  // Auto-update contract statuses (admin endpoint)
  autoUpdateStatuses = async (req: Request, res: Response): Promise<Response> => {
    try {
      await this.contractService.autoUpdateContractStatuses();
      return this.sendSuccess(res, null, 'Contract statuses updated successfully');
    } catch (error) {
      return this.handleError(error, res, 'autoUpdateStatuses');
    }
  };

  // Export contracts to Excel file
  exportContracts = async (req: Request, res: Response): Promise<Response> => {
    try {
      // Use the same query parsing logic as getContracts
      const query: ContractQuery = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        clientId: req.query.clientId as string,
        vehicleId: req.query.vehicleId as string,
        status: req.query.status as any,
        paymentStatus: req.query.paymentStatus as any,
        serviceType: req.query.serviceType as any,
        contractNumber: req.query.contractNumber as string,
        sortBy: req.query.sortBy as any || 'createdAt',
        sortOrder: req.query.sortOrder as any || 'desc'
      };

      // Parse date filters if provided
      if (req.query.startDate) {
        query.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        query.endDate = new Date(req.query.endDate as string);
      }

      // Generate Excel file
      const excelBuffer = await this.contractService.exportContractsToExcel(query);

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const filename = `contracts_export_${currentDate}.xlsx`;

      // Set proper headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', excelBuffer.length.toString());

      // Send the Excel file
      return res.send(excelBuffer);
    } catch (error) {
      return this.handleError(error, res, 'exportContracts');
    }
  };
}