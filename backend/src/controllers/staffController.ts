import { Request, Response, NextFunction } from 'express';
import { StaffService } from '../services/staffService';

export class StaffController {
  static async createStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await StaffService.createStaff(req.body, req.user!.id);
      res.status(201).json(result);
    } catch (err) { next(err); }
  }

  static async listStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await StaffService.listStaff(req.query);
      res.json(result);
    } catch (err) { next(err); }
  }

  static async getStaffDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await StaffService.getStaffDetail(req.params.id);
      res.json(result);
    } catch (err) { next(err); }
  }

  static async updateStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await StaffService.updateStaff(req.params.id, req.body, req.user!.id);
      res.json(result);
    } catch (err) { next(err); }
  }

  static async sendInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await StaffService.sendInvite(req.params.id, req.user!.id);
      res.json(result);
    } catch (err) { next(err); }
  }

  static async deactivateStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await StaffService.deactivateStaff(req.params.id, req.user!.id);
      res.json(result);
    } catch (err) { next(err); }
  }

  static async reactivateStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await StaffService.reactivateStaff(req.params.id, req.user!.id);
      res.json(result);
    } catch (err) { next(err); }
  }
}
